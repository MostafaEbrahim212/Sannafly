<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Brand;
use App\Models\Category;
use App\Models\ImportError;
use App\Models\ImportJob;
use App\Models\PriceType;
use App\Models\Product;
use App\Models\ProductPrice;
use App\Models\ProductVariation;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Shuchkin\SimpleXLSX;
use Shuchkin\SimpleXLSXGen;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ImportExportController extends Controller
{
    public const SYSTEM_FIELDS = [
        'sku' => 'SKU (Required)',
        'name' => 'Name EN (Required)',
        'name_ar' => 'Name AR',
        'barcode' => 'Barcode',
        'category' => 'Category',
        'brand' => 'Brand',
        'status' => 'Status (draft/published/archived)',
        'visibility' => 'Visibility (public/catalog_only/private)',
        'is_featured' => 'Featured (1/0)',
        'regular_price' => 'Regular Price',
        'sale_price' => 'Sale Price',
        'wholesale_price' => 'Wholesale Price',
        'stock_quantity' => 'Stock Quantity',
        'low_stock_threshold' => 'Low Stock Threshold',
        'weight' => 'Weight',
        'short_description' => 'Short Description (EN)',
        'short_description_ar' => 'Short Description (AR)',
        'description' => 'Description (EN)',
        'description_ar' => 'Description (AR)',
        'tags' => 'Tags (comma-separated)',
        'seo_title' => 'SEO Title',
        'seo_description' => 'SEO Description',
        'variations' => 'Variations (SKU:Name:Price:Stock; ...)',
    ];

    public function __construct(private readonly AuditLogger $audit) {}

    public function index(): Response
    {
        return Inertia::render('Admin/ImportExport/Index', [
            'jobs' => ImportJob::query()->with(['user:id,name', 'errors'])->latest()->limit(15)->get(),
            'categories' => Category::query()->orderBy('name')->get(['id', 'name', 'name_ar']),
            'systemFields' => self::SYSTEM_FIELDS,
        ]);
    }

    public function downloadTemplate(string $format = 'csv'): StreamedResponse
    {
        $headers = array_keys(self::SYSTEM_FIELDS);
        $sample = [
            'CF-SAMPLE-01',
            'Studio Wireless Headphones',
            'سماعات استوديو لاسلكية',
            '6221234567890',
            'Electronics',
            'ApexTech',
            'published',
            'public',
            '1',
            '249.00',
            '199.00',
            '175.00',
            '40',
            '5',
            '0.350',
            'Wireless ANC headphones with 40h battery.',
            'سماعات لاسلكية بعزل ضوضاء وبطارية 40 ساعة.',
            'Full product description in English.',
            'وصف كامل للمنتج باللغة العربية.',
            'audio,wireless,headphones',
            'Studio Wireless Headphones | CatalogFlow',
            'Buy Studio Wireless Headphones with fast delivery.',
            'CF-SAMPLE-01-BLK:Black / Std:249:25; CF-SAMPLE-01-SLV:Silver / Pro:269:15',
        ];

        if ($format === 'xlsx') {
            $xlsx = SimpleXLSXGen::fromArray([$headers, $sample]);
            $binary = (string) $xlsx;

            return response()->streamDownload(function () use ($binary) {
                echo $binary;
            }, 'catalogflow-full-template.xlsx', [
                'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            ]);
        }

        return response()->streamDownload(function () use ($headers, $sample) {
            $handle = fopen('php://output', 'w');
            fwrite($handle, "\xEF\xBB\xBF");
            fputcsv($handle, $headers);
            fputcsv($handle, $sample);
            fclose($handle);
        }, 'catalogflow-full-template.csv', ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    public function preview(Request $request): JsonResponse
    {
        $request->validate([
            'file' => ['required', 'file', 'mimes:csv,txt,xlsx', 'max:10240'],
        ]);

        $file = $request->file('file');
        $ext = strtolower($file->getClientOriginalExtension());
        $format = $ext === 'xlsx' ? 'xlsx' : 'csv';
        $storedPath = $file->store('imports');

        $rows = $this->parseSpreadsheet(Storage::path($storedPath), $format);
        if (count($rows) < 2) {
            Storage::delete($storedPath);

            return response()->json(['message' => __('The uploaded file has no data rows.')], 422);
        }

        $headers = array_map(fn ($h) => trim((string) $h), $rows[0]);
        $sampleRows = array_slice($rows, 1, 5);

        $suggestedMapping = [];
        foreach ($headers as $idx => $h) {
            $normalized = strtolower(str_replace([' ', '-'], '_', $h));
            if ($normalized === 'price') {
                $normalized = 'regular_price';
            }
            $suggestedMapping[$idx] = array_key_exists($normalized, self::SYSTEM_FIELDS) ? $normalized : '';
        }

        return response()->json([
            'file_path' => $storedPath,
            'filename' => $file->getClientOriginalName(),
            'format' => $format,
            'total_rows' => count($rows) - 1,
            'headers' => $headers,
            'sample_rows' => $sampleRows,
            'suggested_mapping' => $suggestedMapping,
        ]);
    }

    public function export(Request $request): StreamedResponse
    {
        $format = $request->string('format')->toString() === 'xlsx' ? 'xlsx' : 'csv';
        $this->audit->log('product.exported', 'Product', null, null, ['format' => $format]);

        $headers = array_keys(self::SYSTEM_FIELDS);
        $rows = [];

        Product::query()
            ->with(['category:id,name', 'brand:id,name', 'prices.priceType', 'variations'])
            ->when($request->string('status')->trim()->toString(), fn ($q, $s) => $q->where('status', $s))
            ->when($request->integer('category_id'), fn ($q, $cid) => $q->where('category_id', $cid))
            ->chunk(200, function ($products) use (&$rows) {
                foreach ($products as $p) {
                    $regular = $p->prices->firstWhere('priceType.slug', 'regular')?->amount ?? '';
                    $sale = $p->prices->firstWhere('priceType.slug', 'sale')?->amount ?? '';
                    $wholesale = $p->prices->firstWhere('priceType.slug', 'wholesale')?->amount ?? '';

                    $varString = $p->variations->map(function ($v) {
                        $vPrice = $v->prices->first()?->amount ?? '';

                        return "{$v->sku}:{$v->name}:{$vPrice}:{$v->stock_quantity}";
                    })->implode('; ');

                    $rows[] = [
                        $this->safeCell($p->sku),
                        $this->safeCell($p->name),
                        $this->safeCell((string) $p->name_ar),
                        $this->safeCell((string) $p->barcode),
                        $this->safeCell((string) $p->category?->name),
                        $this->safeCell((string) $p->brand?->name),
                        $p->status,
                        $p->visibility,
                        $p->is_featured ? '1' : '0',
                        $regular !== '' ? number_format((float) $regular, 2, '.', '') : '',
                        $sale !== '' ? number_format((float) $sale, 2, '.', '') : '',
                        $wholesale !== '' ? number_format((float) $wholesale, 2, '.', '') : '',
                        $p->stock_quantity,
                        $p->low_stock_threshold,
                        $p->weight ?? '',
                        $this->safeCell((string) $p->short_description),
                        $this->safeCell((string) $p->short_description_ar),
                        $this->safeCell((string) $p->description),
                        $this->safeCell((string) $p->description_ar),
                        $this->safeCell(is_array($p->tags) ? implode(',', $p->tags) : ''),
                        $this->safeCell((string) $p->seo_title),
                        $this->safeCell((string) $p->seo_description),
                        $this->safeCell($varString),
                    ];
                }
            });

        if ($format === 'xlsx') {
            $xlsx = SimpleXLSXGen::fromArray([$headers, ...$rows]);
            $binary = (string) $xlsx;

            return response()->streamDownload(function () use ($binary) {
                echo $binary;
            }, 'products-full-export-'.now()->format('Ymd-His').'.xlsx', [
                'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            ]);
        }

        return response()->streamDownload(function () use ($headers, $rows) {
            $handle = fopen('php://output', 'w');
            fwrite($handle, "\xEF\xBB\xBF");
            fputcsv($handle, $headers);
            foreach ($rows as $row) {
                fputcsv($handle, $row);
            }
            fclose($handle);
        }, 'products-full-export-'.now()->format('Ymd-His').'.csv', [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    public function import(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'file' => ['nullable', 'file', 'mimes:csv,txt,xlsx', 'max:10240'],
            'file_path' => ['nullable', 'string'],
            'filename' => ['nullable', 'string'],
            'format' => ['nullable', 'in:csv,xlsx'],
            'column_mapping' => ['nullable', 'array'],
            'duplicate_strategy' => ['required', 'in:skip,update,fail'],
        ]);

        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $ext = strtolower($file->getClientOriginalExtension());
            $format = $ext === 'xlsx' ? 'xlsx' : 'csv';
            $storedPath = $file->store('imports');
            $filename = $file->getClientOriginalName();
        } elseif (! empty($data['file_path']) && Storage::exists($data['file_path'])) {
            $storedPath = $data['file_path'];
            $format = $data['format'] ?? 'csv';
            $filename = $data['filename'] ?? basename($storedPath);
        } else {
            return back()->with('error', __('Please upload a valid CSV or XLSX file.'));
        }

        $rows = $this->parseSpreadsheet(Storage::path($storedPath), $format);
        if (count($rows) < 2) {
            return back()->with('error', __('The uploaded file has no data rows.'));
        }

        $headers = array_map(fn ($h) => strtolower(trim(str_replace([' ', '-'], '_', (string) $h))), $rows[0]);
        $mapping = $data['column_mapping'] ?? null;
        $dataRows = array_slice($rows, 1);

        $job = ImportJob::query()->create([
            'user_id' => Auth::id(),
            'filename' => $filename,
            'file_path' => $storedPath,
            'format' => $format,
            'status' => 'processing',
            'duplicate_strategy' => $data['duplicate_strategy'],
            'column_mapping' => $mapping,
            'total_rows' => count($dataRows),
            'started_at' => now(),
        ]);

        $priceTypes = PriceType::query()->pluck('id', 'slug')->all();

        foreach (array_chunk($dataRows, 50, true) as $chunk) {
            DB::transaction(function () use ($chunk, $headers, $mapping, $job, $data, $priceTypes) {
                foreach ($chunk as $idx => $rawRow) {
                    $rowNum = $idx + 2;
                    $assoc = [];

                    foreach ($headers as $colIdx => $colName) {
                        $targetField = $mapping ? ($mapping[$colIdx] ?? '') : ($colName === 'price' ? 'regular_price' : $colName);
                        if ($targetField !== '' && isset($rawRow[$colIdx])) {
                            $assoc[$targetField] = trim((string) $rawRow[$colIdx]);
                        }
                    }

                    $sku = $assoc['sku'] ?? '';
                    $name = $assoc['name'] ?? '';

                    if ($sku === '' || $name === '') {
                        $job->increment('failed_rows');
                        ImportError::query()->create([
                            'import_job_id' => $job->id,
                            'row_number' => $rowNum,
                            'sku' => $sku ?: null,
                            'message' => 'SKU and Name are required.',
                            'row_data' => $assoc,
                            'created_at' => now(),
                        ]);
                        continue;
                    }

                    $existing = Product::query()->where('sku', $sku)->first();
                    if ($existing) {
                        if ($data['duplicate_strategy'] === 'skip') {
                            $job->increment('processed_rows');
                            continue;
                        }
                        if ($data['duplicate_strategy'] === 'fail') {
                            $job->increment('failed_rows');
                            ImportError::query()->create([
                                'import_job_id' => $job->id,
                                'row_number' => $rowNum,
                                'sku' => $sku,
                                'message' => 'Duplicate SKU.',
                                'row_data' => $assoc,
                                'created_at' => now(),
                            ]);
                            continue;
                        }
                    }

                    $categoryId = $existing?->category_id;
                    if (! empty($assoc['category'])) {
                        $cat = Category::query()->firstOrCreate(
                            ['slug' => Str::slug($assoc['category'])],
                            ['name' => $assoc['category'], 'is_visible' => true]
                        );
                        $categoryId = $cat->id;
                    }

                    $brandId = $existing?->brand_id;
                    if (! empty($assoc['brand'])) {
                        $brand = Brand::query()->firstOrCreate(
                            ['slug' => Str::slug($assoc['brand'])],
                            ['name' => $assoc['brand'], 'is_visible' => true]
                        );
                        $brandId = $brand->id;
                    }

                    $status = in_array($assoc['status'] ?? '', ['draft', 'published', 'archived'], true)
                        ? $assoc['status']
                        : ($existing?->status ?? 'draft');
                    $visibility = in_array($assoc['visibility'] ?? '', ['public', 'catalog_only', 'private'], true)
                        ? $assoc['visibility']
                        : ($existing?->visibility ?? 'public');

                    $payload = [
                        'name' => $name,
                        'name_ar' => $assoc['name_ar'] ?? $existing?->name_ar,
                        'barcode' => $assoc['barcode'] ?? $existing?->barcode,
                        'category_id' => $categoryId,
                        'brand_id' => $brandId,
                        'status' => $status,
                        'visibility' => $visibility,
                        'is_featured' => isset($assoc['is_featured']) ? in_array(strtolower($assoc['is_featured']), ['1', 'true', 'yes'], true) : ($existing?->is_featured ?? false),
                        'stock_quantity' => is_numeric($assoc['stock_quantity'] ?? null) ? (int) $assoc['stock_quantity'] : ($existing?->stock_quantity ?? 0),
                        'low_stock_threshold' => is_numeric($assoc['low_stock_threshold'] ?? null) ? (int) $assoc['low_stock_threshold'] : ($existing?->low_stock_threshold ?? 5),
                        'weight' => is_numeric($assoc['weight'] ?? null) ? $assoc['weight'] : $existing?->weight,
                        'short_description' => $assoc['short_description'] ?? $existing?->short_description,
                        'short_description_ar' => $assoc['short_description_ar'] ?? $existing?->short_description_ar,
                        'description' => $assoc['description'] ?? $existing?->description,
                        'description_ar' => $assoc['description_ar'] ?? $existing?->description_ar,
                        'tags' => ! empty($assoc['tags']) ? array_values(array_filter(array_map('trim', explode(',', $assoc['tags'])))) : $existing?->tags,
                        'seo_title' => $assoc['seo_title'] ?? $existing?->seo_title,
                        'seo_description' => $assoc['seo_description'] ?? $existing?->seo_description,
                    ];

                    if ($existing) {
                        $existing->update($payload);
                        $product = $existing;
                        $job->increment('updated_rows');
                    } else {
                        $product = Product::query()->create([
                            ...$payload,
                            'sku' => $sku,
                            'slug' => Str::slug($name).'-'.Str::lower(Str::random(5)),
                            'published_at' => $status === 'published' ? now() : null,
                        ]);
                        $job->increment('created_rows');
                    }

                    // Sync Regular, Sale, and Wholesale Prices
                    foreach (['regular_price' => 'regular', 'sale_price' => 'sale', 'wholesale_price' => 'wholesale'] as $col => $slug) {
                        if (isset($priceTypes[$slug]) && isset($assoc[$col]) && is_numeric($assoc[$col])) {
                            ProductPrice::query()->updateOrCreate(
                                ['product_id' => $product->id, 'variation_id' => null, 'price_type_id' => $priceTypes[$slug], 'min_quantity' => 1],
                                ['amount' => number_format((float) $assoc[$col], 4, '.', ''), 'currency' => 'USD']
                            );
                        }
                    }

                    // Sync Variations if provided (SKU:Name:Price:Stock; ...)
                    if (! empty($assoc['variations'])) {
                        $product->update(['has_variations' => true]);
                        $totalVarStock = 0;
                        foreach (explode(';', $assoc['variations']) as $varEntry) {
                            $parts = array_map('trim', explode(':', $varEntry));
                            $vSku = $parts[0] ?? '';
                            if ($vSku === '') {
                                continue;
                            }
                            $vName = $parts[1] ?? $vSku;
                            $vPrice = $parts[2] ?? '';
                            $vStock = isset($parts[3]) && is_numeric($parts[3]) ? (int) $parts[3] : 0;

                            $variation = ProductVariation::query()->updateOrCreate(
                                ['sku' => $vSku],
                                [
                                    'product_id' => $product->id,
                                    'combination_hash' => hash('sha256', $vSku),
                                    'name' => $vName,
                                    'stock_quantity' => $vStock,
                                    'low_stock_threshold' => $product->low_stock_threshold ?? 5,
                                    'status' => 'active',
                                ]
                            );

                            if (is_numeric($vPrice) && isset($priceTypes['regular'])) {
                                ProductPrice::query()->updateOrCreate(
                                    ['product_id' => $product->id, 'variation_id' => $variation->id, 'price_type_id' => $priceTypes['regular'], 'min_quantity' => 1],
                                    ['amount' => number_format((float) $vPrice, 4, '.', ''), 'currency' => 'USD']
                                );
                            }
                            $totalVarStock += $vStock;
                        }
                        $product->update(['stock_quantity' => $totalVarStock]);
                    }

                    $job->increment('processed_rows');
                }
            });
        }

        $job->update(['status' => 'completed', 'completed_at' => now()]);
        $this->audit->log('product.imported', 'ImportJob', $job->id, null, [
            'created' => $job->created_rows,
            'updated' => $job->updated_rows,
            'failed' => $job->failed_rows,
        ]);

        return back()->with('success', __('Import finished: :created created, :updated updated, :failed failed.', [
            'created' => $job->created_rows,
            'updated' => $job->updated_rows,
            'failed' => $job->failed_rows,
        ]));
    }

    public function downloadErrors(ImportJob $job): StreamedResponse
    {
        return response()->streamDownload(function () use ($job) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, ['Row Number', 'SKU', 'Error Message']);
            foreach ($job->errors as $err) {
                fputcsv($handle, [$err->row_number, $this->safeCell((string) $err->sku), $this->safeCell($err->message)]);
            }
            fclose($handle);
        }, "import-errors-job-{$job->id}.csv", ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    private function parseSpreadsheet(string $path, string $format): array
    {
        if ($format === 'xlsx') {
            $xlsx = SimpleXLSX::parse($path);

            return $xlsx ? $xlsx->rows() : [];
        }

        $rows = [];
        if (($handle = fopen($path, 'r')) !== false) {
            while (($row = fgetcsv($handle)) !== false) {
                // Strip UTF-8 BOM from first cell if present
                if (empty($rows) && isset($row[0])) {
                    $row[0] = preg_replace('/^\xEF\xBB\xBF/', '', $row[0]);
                }
                $rows[] = $row;
            }
            fclose($handle);
        }

        return $rows;
    }

    private function safeCell(string $value): string
    {
        if ($value !== '' && in_array($value[0], ['=', '+', '-', '@', "\t", "\r"], true)) {
            return "'".$value;
        }

        return $value;
    }
}
