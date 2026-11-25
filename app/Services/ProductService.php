<?php

namespace App\Services;

use App\Models\AttributeOption;
use App\Models\PriceType;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\ProductPrice;
use App\Models\ProductVariation;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ProductService
{
    public function __construct(
        private readonly AuditLogger $audit,
        private readonly ImageService $imageService,
    ) {}

    public function createProduct(array $data, array $uploadedImages = [], array $variationImages = []): Product
    {
        $storedPaths = [];

        try {
            return DB::transaction(function () use ($data, $uploadedImages, $variationImages, &$storedPaths) {
                $slug = $data['slug'] ?? Str::slug($data['name']);
                $slug = $this->uniqueSlug($slug);

                $product = Product::query()->create([
                    'category_id' => $data['category_id'] ?? null,
                    'brand_id' => $data['brand_id'] ?? null,
                    'name' => $data['name'],
                    'name_ar' => $data['name_ar'] ?? null,
                    'slug' => $slug,
                    'sku' => $data['sku'],
                    'barcode' => $data['barcode'] ?? null,
                    'short_description' => $data['short_description'] ?? null,
                    'short_description_ar' => $data['short_description_ar'] ?? null,
                    'description' => $data['description'] ?? null,
                    'description_ar' => $data['description_ar'] ?? null,
                    'status' => $data['status'] ?? 'draft',
                    'visibility' => $data['visibility'] ?? 'public',
                    'is_featured' => (bool) ($data['is_featured'] ?? false),
                    'has_variations' => (bool) ($data['has_variations'] ?? false),
                    'track_inventory' => (bool) ($data['track_inventory'] ?? true),
                    'allow_backorder' => (bool) ($data['allow_backorder'] ?? false),
                    'allow_negative_stock' => (bool) ($data['allow_negative_stock'] ?? false),
                    'stock_quantity' => (int) ($data['stock_quantity'] ?? 0),
                    'low_stock_threshold' => (int) ($data['low_stock_threshold'] ?? 5),
                    'weight' => $data['weight'] ?? null,
                    'specifications' => $data['specifications'] ?? null,
                    'custom_fields' => $data['custom_fields'] ?? null,
                    'tags' => $data['tags'] ?? null,
                    'seo_title' => $data['seo_title'] ?? null,
                    'seo_description' => $data['seo_description'] ?? null,
                    'published_at' => ($data['status'] ?? 'draft') === 'published' ? now() : null,
                    'created_by' => Auth::id(),
                    'updated_by' => Auth::id(),
                ]);

                $this->syncPrices($product, $data['prices'] ?? []);
                $this->syncVariations($product, $data['variations'] ?? [], $variationImages, $storedPaths);
                $this->storeImages($product, $uploadedImages, $storedPaths);

                $this->audit->log('product.created', 'Product', $product->id, null, [
                    'name' => $product->name,
                    'sku' => $product->sku,
                    'status' => $product->status,
                ]);

                return $product->load(['prices.priceType', 'variations.options', 'images']);
            });
        } catch (\Throwable $e) {
            $this->imageService->deleteFiles($storedPaths);
            throw $e;
        }
    }

    public function updateProduct(Product $product, array $data, array $uploadedImages = [], array $variationImages = []): Product
    {
        $storedPaths = [];

        try {
            return DB::transaction(function () use ($product, $data, $uploadedImages, $variationImages, &$storedPaths) {
                $locked = Product::query()->lockForUpdate()->findOrFail($product->id);
                $old = $locked->only(['name', 'sku', 'status', 'stock_quantity']);

                $status = $data['status'] ?? $locked->status;
                $locked->update([
                    'category_id' => $data['category_id'] ?? null,
                    'brand_id' => $data['brand_id'] ?? null,
                    'name' => $data['name'],
                    'name_ar' => $data['name_ar'] ?? null,
                    'slug' => $data['slug'] ?? $locked->slug,
                    'sku' => $data['sku'],
                    'barcode' => $data['barcode'] ?? null,
                    'short_description' => $data['short_description'] ?? null,
                    'short_description_ar' => $data['short_description_ar'] ?? null,
                    'description' => $data['description'] ?? null,
                    'description_ar' => $data['description_ar'] ?? null,
                    'status' => $status,
                    'visibility' => $data['visibility'] ?? $locked->visibility,
                    'is_featured' => (bool) ($data['is_featured'] ?? false),
                    'has_variations' => (bool) ($data['has_variations'] ?? false),
                    'track_inventory' => (bool) ($data['track_inventory'] ?? true),
                    'allow_backorder' => (bool) ($data['allow_backorder'] ?? false),
                    'allow_negative_stock' => (bool) ($data['allow_negative_stock'] ?? false),
                    'stock_quantity' => (int) ($data['stock_quantity'] ?? $locked->stock_quantity),
                    'low_stock_threshold' => (int) ($data['low_stock_threshold'] ?? $locked->low_stock_threshold),
                    'weight' => $data['weight'] ?? null,
                    'specifications' => $data['specifications'] ?? null,
                    'custom_fields' => $data['custom_fields'] ?? null,
                    'tags' => $data['tags'] ?? null,
                    'seo_title' => $data['seo_title'] ?? null,
                    'seo_description' => $data['seo_description'] ?? null,
                    'published_at' => $status === 'published' && ! $locked->published_at ? now() : $locked->published_at,
                    'updated_by' => Auth::id(),
                ]);

                if (array_key_exists('prices', $data)) {
                    $this->syncPrices($locked, $data['prices'] ?? []);
                }

                if (array_key_exists('variations', $data)) {
                    $this->syncVariations($locked, $data['variations'] ?? [], $variationImages, $storedPaths);
                }

                $this->storeImages($locked, $uploadedImages, $storedPaths);

                $this->audit->log('product.updated', 'Product', $locked->id, $old, $locked->only(['name', 'sku', 'status', 'stock_quantity']));

                return $locked->load(['prices.priceType', 'variations.options', 'images']);
            });
        } catch (\Throwable $e) {
            $this->imageService->deleteFiles($storedPaths);
            throw $e;
        }
    }

    /**
     * Generate Cartesian product combinations for selected attribute option IDs, skipping duplicates.
     *
     * @param  array<int, array<int, int>>  $attributeOptionGroups
     */
    public function generateVariations(Product $product, array $attributeOptionGroups): int
    {
        $groups = array_values(array_filter($attributeOptionGroups, fn ($g) => ! empty($g)));
        if (empty($groups)) {
            return 0;
        }

        $combinations = [[]];
        foreach ($groups as $group) {
            $next = [];
            foreach ($combinations as $combo) {
                foreach ($group as $optionId) {
                    $next[] = [...$combo, (int) $optionId];
                }
            }
            $combinations = $next;
        }

        $optionsMap = AttributeOption::query()
            ->whereIn('id', collect($combinations)->flatten()->unique()->all())
            ->get()
            ->keyBy('id');

        return DB::transaction(function () use ($product, $combinations, $optionsMap) {
            $created = 0;
            $product->update(['has_variations' => true]);

            foreach ($combinations as $idx => $optionIds) {
                $hash = ProductVariation::hashOptions($optionIds);
                if ($product->variations()->where('combination_hash', $hash)->exists()) {
                    continue;
                }

                $labels = collect($optionIds)->map(fn ($id) => $optionsMap[$id]->value ?? $id)->all();
                $skuSuffix = strtoupper(Str::slug(implode('-', $labels)));

                $variation = ProductVariation::query()->create([
                    'product_id' => $product->id,
                    'sku' => $product->sku.'-'.$skuSuffix.'-'.($idx + 1),
                    'combination_hash' => $hash,
                    'name' => implode(' / ', $labels),
                    'stock_quantity' => 0,
                    'low_stock_threshold' => $product->low_stock_threshold ?? 5,
                    'status' => 'active',
                    'is_default' => $created === 0 && ! $product->variations()->where('is_default', true)->exists(),
                ]);

                $variation->options()->sync($optionIds);
                $created++;
            }

            return $created;
        });
    }

    private function syncPrices(Product $product, array $prices): void
    {
        ProductPrice::query()->where('product_id', $product->id)->whereNull('variation_id')->delete();

        foreach ($prices as $price) {
            if (! isset($price['amount']) || $price['amount'] === '' || $price['amount'] === null) {
                continue;
            }
            ProductPrice::query()->create([
                'product_id' => $product->id,
                'variation_id' => null,
                'price_type_id' => $price['price_type_id'],
                'amount' => number_format((float) $price['amount'], 4, '.', ''),
                'currency' => $price['currency'] ?? 'USD',
                'min_quantity' => max(1, (int) ($price['min_quantity'] ?? 1)),
                'max_quantity' => ! empty($price['max_quantity']) ? (int) $price['max_quantity'] : null,
            ]);
        }
    }

    private function syncVariations(Product $product, array $variations, array $variationImages = [], array &$storedPaths = []): void
    {
        if (! $product->has_variations && empty($variations)) {
            return;
        }

        $regularPriceTypeId = PriceType::query()->where('slug', 'regular')->value('id') ?? 1;
        $keptIds = [];
        $totalStock = 0;

        foreach ($variations as $idx => $varData) {
            $optionIds = $varData['option_ids'] ?? [];
            $hash = ! empty($optionIds)
                ? ProductVariation::hashOptions($optionIds)
                : hash('sha256', (string) ($varData['sku'] ?? Str::uuid()));

            $variation = isset($varData['id'])
                ? ProductVariation::query()->where('product_id', $product->id)->find($varData['id'])
                : ProductVariation::query()->where('product_id', $product->id)->where('combination_hash', $hash)->first();

            $payload = [
                'product_id' => $product->id,
                'sku' => $varData['sku'],
                'barcode' => $varData['barcode'] ?? null,
                'combination_hash' => $hash,
                'name' => $varData['name'] ?? null,
                'stock_quantity' => (int) ($varData['stock_quantity'] ?? 0),
                'low_stock_threshold' => (int) ($varData['low_stock_threshold'] ?? $product->low_stock_threshold ?? 5),
                'weight' => $varData['weight'] ?? null,
                'status' => $varData['status'] ?? 'active',
                'is_default' => (bool) ($varData['is_default'] ?? false),
            ];

            if ($variation) {
                $variation->update($payload);
            } else {
                $variation = ProductVariation::query()->create($payload);
            }

            $keptIds[] = $variation->id;

            if (! empty($optionIds)) {
                $variation->options()->sync($optionIds);
            }

            if (isset($varData['price']) && $varData['price'] !== '' && $varData['price'] !== null) {
                ProductPrice::query()->updateOrCreate(
                    [
                        'product_id' => $product->id,
                        'variation_id' => $variation->id,
                        'price_type_id' => $varData['price_type_id'] ?? $regularPriceTypeId,
                        'min_quantity' => 1,
                    ],
                    [
                        'amount' => number_format((float) $varData['price'], 4, '.', ''),
                        'currency' => 'USD',
                    ]
                );
            }

            if (isset($variationImages[$idx]) && $variationImages[$idx] instanceof UploadedFile) {
                $processed = $this->imageService->processAndStore($variationImages[$idx], "products/{$product->id}/variations");
                $storedPaths[] = $processed['path'];
                $storedPaths[] = $processed['thumbnail_path'];

                $variation->images()->delete();
                ProductImage::query()->create([
                    'product_id' => $product->id,
                    'variation_id' => $variation->id,
                    'path' => $processed['path'],
                    'thumbnail_path' => $processed['thumbnail_path'],
                    'webp_path' => $processed['webp_path'],
                    'alt_text' => $variation->name ?? $product->name,
                    'sort_order' => 0,
                    'is_main' => true,
                    'size_bytes' => $processed['size_bytes'],
                    'width' => $processed['width'],
                    'height' => $processed['height'],
                ]);
            }

            if (($payload['status'] ?? 'active') === 'active') {
                $totalStock += $payload['stock_quantity'];
            }
        }

        // Remove variations that were deleted in the UI
        $product->variations()->whereNotIn('id', $keptIds)->delete();

        if ($product->has_variations) {
            $product->update(['stock_quantity' => $totalStock]);
        }
    }

    private function storeImages(Product $product, array $uploadedImages, array &$storedPaths): void
    {
        if (empty($uploadedImages)) {
            return;
        }

        $nextOrder = (int) ($product->images()->max('sort_order') ?? 0) + 1;
        $hasMain = $product->images()->where('is_main', true)->exists();

        foreach ($uploadedImages as $index => $file) {
            $processed = $this->imageService->processAndStore($file, "products/{$product->id}");
            $storedPaths[] = $processed['path'];
            $storedPaths[] = $processed['thumbnail_path'];

            ProductImage::query()->create([
                'product_id' => $product->id,
                'path' => $processed['path'],
                'thumbnail_path' => $processed['thumbnail_path'],
                'webp_path' => $processed['webp_path'],
                'alt_text' => $product->name,
                'sort_order' => $nextOrder + $index,
                'is_main' => ! $hasMain && $index === 0,
                'size_bytes' => $processed['size_bytes'],
                'width' => $processed['width'],
                'height' => $processed['height'],
            ]);
        }
    }

    private function uniqueSlug(string $base): string
    {
        $slug = $base !== '' ? $base : Str::random(8);
        $original = $slug;
        $counter = 1;

        while (Product::withTrashed()->where('slug', $slug)->exists()) {
            $slug = "{$original}-{$counter}";
            $counter++;
        }

        return $slug;
    }
}
