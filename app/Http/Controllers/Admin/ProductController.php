<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Attribute;
use App\Models\Brand;
use App\Models\Category;
use App\Models\PriceType;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\ProductPrice;
use App\Services\AuditLogger;
use App\Services\ImageService;
use App\Services\InventoryService;
use App\Services\ProductService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    public function __construct(
        private readonly ProductService $productService,
        private readonly ImageService $imageService,
        private readonly InventoryService $inventoryService,
        private readonly AuditLogger $audit,
    ) {}

    public function index(Request $request): Response
    {
        $query = Product::query()->with([
            'category:id,name,name_ar',
            'brand:id,name,name_ar',
            'images' => fn ($q) => $q->whereNull('variation_id')->orderByDesc('is_main')->orderBy('sort_order'),
            'prices.priceType',
        ]);

        if ($search = $request->string('search')->trim()->toString()) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('name_ar', 'like', "%{$search}%")
                    ->orWhere('sku', 'like', "%{$search}%")
                    ->orWhere('barcode', 'like', "%{$search}%");
            });
        }

        if ($status = $request->string('status')->trim()->toString()) {
            $query->where('status', $status);
        }

        if ($categoryId = $request->integer('category_id')) {
            $query->where('category_id', $categoryId);
        }

        if ($brandId = $request->integer('brand_id')) {
            $query->where('brand_id', $brandId);
        }

        if ($request->boolean('low_stock')) {
            $query->where('track_inventory', true)->whereColumn('stock_quantity', '<=', 'low_stock_threshold');
        }

        $sortField = in_array($request->string('sort')->toString(), ['name', 'sku', 'stock_quantity', 'created_at'], true)
            ? $request->string('sort')->toString()
            : 'created_at';
        $sortDir = $request->string('dir')->toString() === 'asc' ? 'asc' : 'desc';

        $products = $query->orderBy($sortField, $sortDir)->paginate(15)->withQueryString();

        return Inertia::render('Admin/Products/Index', [
            'products' => $products,
            'categories' => Category::query()->orderBy('name')->get(['id', 'name', 'name_ar']),
            'brands' => Brand::query()->orderBy('name')->get(['id', 'name', 'name_ar']),
            'filters' => (object) $request->only(['search', 'status', 'category_id', 'brand_id', 'low_stock', 'sort', 'dir']),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/Products/Form', [
            'product' => null,
            'categories' => Category::query()->orderBy('name')->get(['id', 'name', 'name_ar', 'parent_id']),
            'brands' => Brand::query()->orderBy('name')->get(['id', 'name', 'name_ar']),
            'priceTypes' => PriceType::query()->where('is_active', true)->orderBy('sort_order')->get(),
            'attributes' => Attribute::query()->with('options')->orderBy('sort_order')->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validateProduct($request);
        $images = $request->file('images', []);
        $variationImages = $request->file('variation_images', []);

        $product = $this->productService->createProduct(
            $data,
            is_array($images) ? $images : [],
            is_array($variationImages) ? $variationImages : []
        );

        return redirect()->route('admin.products.edit', $product)->with('success', __('Product created successfully.'));
    }

    public function edit(Product $product): Response
    {
        $product->load([
            'images' => fn ($q) => $q->whereNull('variation_id')->orderBy('sort_order'),
            'prices.priceType',
            'variations.options.attribute',
            'variations.prices.priceType',
            'variations.images',
            'stockMovements' => fn ($q) => $q->with('user:id,name')->limit(20),
        ]);

        return Inertia::render('Admin/Products/Form', [
            'product' => $product,
            'categories' => Category::query()->orderBy('name')->get(['id', 'name', 'name_ar', 'parent_id']),
            'brands' => Brand::query()->orderBy('name')->get(['id', 'name', 'name_ar']),
            'priceTypes' => PriceType::query()->where('is_active', true)->orderBy('sort_order')->get(),
            'attributes' => Attribute::query()->with('options')->orderBy('sort_order')->get(),
        ]);
    }

    public function update(Request $request, Product $product): RedirectResponse
    {
        $data = $this->validateProduct($request, $product);
        $images = $request->file('images', []);
        $variationImages = $request->file('variation_images', []);

        $this->productService->updateProduct(
            $product,
            $data,
            is_array($images) ? $images : [],
            is_array($variationImages) ? $variationImages : []
        );

        return back()->with('success', __('Product updated successfully.'));
    }

    public function destroy(Product $product): RedirectResponse
    {
        DB::transaction(function () use ($product) {
            $product->delete();
            $this->audit->log('product.deleted', 'Product', $product->id);
        });

        return redirect()->route('admin.products.index')->with('success', __('Product deleted.'));
    }

    public function bulkAction(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'action' => ['required', Rule::in(['publish', 'draft', 'archive', 'delete', 'adjust_stock', 'update_price'])],
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer', 'exists:products,id'],
            'stock_delta' => ['nullable', 'integer'],
            'price_amount' => ['nullable', 'numeric', 'min:0'],
        ]);

        $user = $request->user();
        if ($data['action'] === 'delete' && ! $user->hasPermission('products.delete')) {
            abort(403);
        }
        if (in_array($data['action'], ['publish', 'draft', 'archive'], true) && ! $user->hasPermission('products.publish')) {
            abort(403);
        }
        if ($data['action'] === 'adjust_stock' && ! $user->hasPermission('inventory.manage')) {
            abort(403);
        }

        DB::transaction(function () use ($data) {
            $products = Product::query()->whereIn('id', $data['ids'])->lockForUpdate()->get();

            foreach ($products as $product) {
                match ($data['action']) {
                    'publish' => $product->update(['status' => 'published', 'published_at' => $product->published_at ?? now()]),
                    'draft' => $product->update(['status' => 'draft']),
                    'archive' => $product->update(['status' => 'archived']),
                    'delete' => $product->delete(),
                    'adjust_stock' => $this->inventoryService->adjustStock($product, (int) ($data['stock_delta'] ?? 0), 'adjustment', null, 'Bulk stock adjustment'),
                    'update_price' => ProductPrice::query()->updateOrCreate(
                        ['product_id' => $product->id, 'variation_id' => null, 'price_type_id' => 1, 'min_quantity' => 1],
                        ['amount' => number_format((float) ($data['price_amount'] ?? 0), 4, '.', ''), 'currency' => 'USD']
                    ),
                };
            }

            $this->audit->log('product.bulk_'.$data['action'], 'Product', null, null, ['ids' => $data['ids']]);
        });

        return back()->with('success', __('Bulk action completed.'));
    }

    public function generateVariations(Request $request, Product $product): RedirectResponse
    {
        $data = $request->validate([
            'option_groups' => ['required', 'array', 'min:1'],
            'option_groups.*' => ['array', 'min:1'],
            'option_groups.*.*' => ['integer', 'exists:attribute_options,id'],
        ]);

        $count = $this->productService->generateVariations($product, $data['option_groups']);

        return back()->with('success', __(':count variation(s) generated.', ['count' => $count]));
    }

    public function reorderImages(Request $request, Product $product): RedirectResponse
    {
        $data = $request->validate([
            'order' => ['required', 'array'],
            'order.*' => ['integer', 'exists:product_images,id'],
        ]);

        DB::transaction(function () use ($product, $data) {
            foreach ($data['order'] as $index => $imageId) {
                ProductImage::query()
                    ->where('product_id', $product->id)
                    ->where('id', $imageId)
                    ->update(['sort_order' => $index]);
            }
        });

        return back()->with('success', __('Images reordered.'));
    }

    public function setMainImage(Product $product, ProductImage $image): RedirectResponse
    {
        if ($image->product_id !== $product->id) {
            abort(404);
        }

        DB::transaction(function () use ($product, $image) {
            $product->images()->update(['is_main' => false]);
            $image->update(['is_main' => true]);
        });

        return back()->with('success', __('Main image updated.'));
    }

    public function deleteImage(Product $product, ProductImage $image): RedirectResponse
    {
        if ($image->product_id !== $product->id) {
            abort(404);
        }

        $paths = [$image->path, $image->thumbnail_path, $image->webp_path];
        $image->delete();
        $this->imageService->deleteFiles($paths);

        return back()->with('success', __('Image removed.'));
    }

    private function validateProduct(Request $request, ?Product $product = null): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'name_ar' => ['nullable', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', Rule::unique('products', 'slug')->ignore($product?->id)],
            'sku' => ['required', 'string', 'max:100', Rule::unique('products', 'sku')->ignore($product?->id)],
            'barcode' => ['nullable', 'string', 'max:100'],
            'category_id' => ['nullable', 'integer', 'exists:categories,id'],
            'brand_id' => ['nullable', 'integer', 'exists:brands,id'],
            'short_description' => ['nullable', 'string', 'max:1000'],
            'short_description_ar' => ['nullable', 'string', 'max:1000'],
            'description' => ['nullable', 'string'],
            'description_ar' => ['nullable', 'string'],
            'status' => ['required', Rule::in(['draft', 'published', 'archived'])],
            'visibility' => ['required', Rule::in(['public', 'private', 'catalog_only'])],
            'is_featured' => ['boolean'],
            'has_variations' => ['boolean'],
            'track_inventory' => ['boolean'],
            'allow_backorder' => ['boolean'],
            'allow_negative_stock' => ['boolean'],
            'stock_quantity' => ['integer'],
            'low_stock_threshold' => ['integer', 'min:0'],
            'weight' => ['nullable', 'numeric', 'min:0'],
            'specifications' => ['nullable', 'array'],
            'custom_fields' => ['nullable', 'array'],
            'tags' => ['nullable', 'array'],
            'seo_title' => ['nullable', 'string', 'max:255'],
            'seo_description' => ['nullable', 'string', 'max:500'],
            'prices' => ['nullable', 'array'],
            'prices.*.price_type_id' => ['required_with:prices', 'integer', 'exists:price_types,id'],
            'prices.*.amount' => ['nullable', 'numeric', 'min:0'],
            'prices.*.min_quantity' => ['nullable', 'integer', 'min:1'],
            'variations' => ['nullable', 'array'],
            'variations.*.id' => ['nullable', 'integer'],
            'variations.*.name' => ['nullable', 'string', 'max:255'],
            'variations.*.sku' => ['required_with:variations', 'string', 'max:100'],
            'variations.*.price' => ['nullable', 'numeric', 'min:0'],
            'variations.*.stock_quantity' => ['nullable', 'integer', 'min:0'],
            'variations.*.status' => ['nullable', Rule::in(['active', 'inactive'])],
            'variations.*.is_default' => ['nullable', 'boolean'],
            'variations.*.option_ids' => ['nullable', 'array'],
            'images' => ['nullable', 'array'],
            'images.*' => ['image', 'mimes:jpg,jpeg,png,webp,gif', 'max:5120'],
            'variation_images' => ['nullable', 'array'],
            'variation_images.*' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp,gif', 'max:5120'],
        ]);
    }
}
