<?php

namespace App\Http\Controllers;

use App\Models\Attribute;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use App\Models\ProductInquiry;
use App\Models\ProductPrice;
use App\Services\InstallerService;
use App\Services\RealtimeNotificationService;
use App\Services\SettingsService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class StorefrontController extends Controller
{
    public function __construct(
        private readonly SettingsService $settings,
        private readonly RealtimeNotificationService $realtime,
        private readonly ?InstallerService $installer = null,
    ) {}

    public function home(): Response|RedirectResponse
    {
        if (! app()->runningUnitTests() && ! ($this->installer ?? app(InstallerService::class))->isInstalled()) {
            return redirect()->route('install.index');
        }
        $featured = Product::query()
            ->where('status', 'published')
            ->where('visibility', '!=', 'private')
            ->where('is_featured', true)
            ->with([
                'category:id,name,name_ar,slug',
                'brand:id,name,name_ar,slug',
                'images' => fn ($q) => $q->whereNull('variation_id')->orderByDesc('is_main')->orderBy('sort_order'),
                'prices.priceType',
            ])
            ->orderBy('sort_order')
            ->limit(8)
            ->get();

        $latest = Product::query()
            ->where('status', 'published')
            ->where('visibility', '!=', 'private')
            ->with([
                'category:id,name,name_ar,slug',
                'brand:id,name,name_ar,slug',
                'images' => fn ($q) => $q->whereNull('variation_id')->orderByDesc('is_main')->orderBy('sort_order'),
                'prices.priceType',
            ])
            ->latest('published_at')
            ->limit(8)
            ->get();

        return Inertia::render('Storefront/Home', [
            'featuredProducts' => $featured,
            'latestProducts' => $latest,
            'categories' => Category::query()->where('is_visible', true)->whereNull('parent_id')->withCount('products')->orderBy('sort_order')->limit(8)->get(),
            'brands' => $this->settings->isEnabled('module_brands', true)
                ? Brand::query()->where('is_visible', true)->orderBy('sort_order')->limit(10)->get()
                : [],
        ]);
    }

    public function catalog(Request $request): Response
    {
        $query = Product::query()
            ->where('status', 'published')
            ->where('visibility', '!=', 'private')
            ->with([
                'category:id,name,name_ar,slug',
                'brand:id,name,name_ar,slug',
                'images' => fn ($q) => $q->whereNull('variation_id')->orderByDesc('is_main')->orderBy('sort_order'),
                'prices.priceType',
            ]);

        if ($search = $request->string('search')->trim()->toString()) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('name_ar', 'like', "%{$search}%")
                    ->orWhere('sku', 'like', "%{$search}%")
                    ->orWhere('barcode', 'like', "%{$search}%")
                    ->orWhere('short_description', 'like', "%{$search}%");
            });
        }

        if ($categorySlug = $request->string('category')->trim()->toString()) {
            $category = Category::query()->where('slug', $categorySlug)->first();
            if ($category) {
                $childIds = Category::query()->where('parent_id', $category->id)->pluck('id')->all();
                $query->whereIn('category_id', [$category->id, ...$childIds]);
            }
        }

        if ($brandSlug = $request->string('brand')->trim()->toString()) {
            $query->whereHas('brand', fn ($q) => $q->where('slug', $brandSlug));
        }

        if ($brandsParam = $request->string('brands')->trim()->toString()) {
            $slugs = array_filter(explode(',', $brandsParam));
            if (! empty($slugs)) {
                $query->whereHas('brand', fn ($q) => $q->whereIn('slug', $slugs));
            }
        }

        if ($optionsParam = $request->string('options')->trim()->toString()) {
            $optIds = array_filter(array_map('intval', explode(',', $optionsParam)));
            if (! empty($optIds)) {
                $query->whereHas('variations.options', fn ($q) => $q->whereIn('attribute_options.id', $optIds));
            }
        }

        if ($request->boolean('in_stock')) {
            $query->where('stock_quantity', '>', 0);
        }

        if ($request->boolean('featured')) {
            $query->where('is_featured', true);
        }

        if ($request->boolean('on_sale')) {
            $query->whereHas('prices.priceType', fn ($q) => $q->where('slug', 'sale'));
        }

        if ($minPrice = $request->input('min_price')) {
            $query->whereHas('prices', fn ($q) => $q->where('amount', '>=', (float) $minPrice));
        }

        if ($maxPrice = $request->input('max_price')) {
            $query->whereHas('prices', fn ($q) => $q->where('amount', '<=', (float) $maxPrice));
        }

        $sort = $request->string('sort')->toString();
        match ($sort) {
            'name_asc' => $query->orderBy('name', 'asc'),
            'name_desc' => $query->orderBy('name', 'desc'),
            'oldest' => $query->orderBy('published_at', 'asc'),
            'price_asc' => $query->orderByRaw('(SELECT MIN(amount) FROM product_prices WHERE product_prices.product_id = products.id) ASC'),
            'price_desc' => $query->orderByRaw('(SELECT MIN(amount) FROM product_prices WHERE product_prices.product_id = products.id) DESC'),
            default => $query->orderByDesc('is_featured')->orderByDesc('published_at'),
        };

        $priceBounds = ProductPrice::query()
            ->selectRaw('MIN(amount) as min_price, MAX(amount) as max_price')
            ->first();

        return Inertia::render('Storefront/Catalog', [
            'products' => $query->paginate(12)->withQueryString(),
            'categories' => Category::query()
                ->where('is_visible', true)
                ->withCount(['products' => fn ($q) => $q->where('status', 'published')->where('visibility', '!=', 'private')])
                ->orderBy('sort_order')
                ->get(['id', 'name', 'name_ar', 'slug', 'parent_id']),
            'brands' => Brand::query()
                ->where('is_visible', true)
                ->withCount(['products' => fn ($q) => $q->where('status', 'published')->where('visibility', '!=', 'private')])
                ->orderBy('sort_order')
                ->get(['id', 'name', 'name_ar', 'slug']),
            'attributes' => Attribute::query()->with('options')->orderBy('sort_order')->get(),
            'priceBounds' => [
                'min' => (float) ($priceBounds->min_price ?? 0),
                'max' => (float) ($priceBounds->max_price ?? 1000),
            ],
            'filters' => (object) $request->only(['search', 'category', 'brand', 'brands', 'options', 'in_stock', 'featured', 'on_sale', 'min_price', 'max_price', 'sort']),
        ]);
    }

    public function show(string $slug): Response
    {
        $product = Product::query()
            ->where('slug', $slug)
            ->where('status', 'published')
            ->where('visibility', '!=', 'private')
            ->with([
                'category:id,name,name_ar,slug',
                'brand:id,name,name_ar,slug,logo',
                'images' => fn ($q) => $q->whereNull('variation_id')->orderByDesc('is_main')->orderBy('sort_order'),
                'prices.priceType',
                'variations' => fn ($q) => $q->where('status', 'active')->with(['options.attribute', 'prices.priceType', 'images']),
                'reviews.customer:id,name',
            ])
            ->firstOrFail();

        $related = Product::query()
            ->where('status', 'published')
            ->where('id', '!=', $product->id)
            ->when($product->category_id, fn ($q) => $q->where('category_id', $product->category_id))
            ->with(['images' => fn ($q) => $q->whereNull('variation_id')->orderByDesc('is_main')->orderBy('sort_order'), 'prices.priceType'])
            ->limit(4)
            ->get();

        return Inertia::render('Storefront/ProductDetail', [
            'product' => $product,
            'relatedProducts' => $related,
        ]);
    }

    public function submitInquiry(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'product_id' => ['nullable', 'integer', 'exists:products,id'],
            'variation_id' => ['nullable', 'integer', 'exists:product_variations,id'],
            'name' => ['required', 'string', 'max:150'],
            'email' => ['nullable', 'email', 'max:150'],
            'phone' => ['nullable', 'string', 'max:30'],
            'message' => ['required', 'string', 'max:2000'],
        ]);

        $inquiry = ProductInquiry::query()->create($data);
        $this->realtime->inquiryReceived($inquiry);

        return back()->with('success', __('Your inquiry has been submitted. We will contact you shortly.'));
    }

    public function switchLocale(Request $request, string $locale): RedirectResponse
    {
        if (in_array($locale, ['en', 'ar'], true)) {
            $request->session()->put('locale', $locale);
        }

        return back()->withCookie(cookie('locale', $locale, 60 * 24 * 365));
    }

    public function policy(string $slug): Response
    {
        $map = [
            'privacy-policy' => [
                'en' => 'Privacy Policy',
                'ar' => 'سياسة الخصوصية',
                'key' => 'policy_privacy',
            ],
            'terms' => [
                'en' => 'Terms & Conditions',
                'ar' => 'الشروط والأحكام',
                'key' => 'policy_terms',
            ],
            'refund-policy' => [
                'en' => 'Return & Refund Policy',
                'ar' => 'سياسة الاستبدال والاسترجاع',
                'key' => 'policy_refund',
            ],
        ];

        abort_unless(isset($map[$slug]), 404);
        $meta = $map[$slug];

        $rawHighlights = $this->settings->get($meta['key'].'_highlights');
        $highlights = is_array($rawHighlights)
            ? $rawHighlights
            : (is_string($rawHighlights) ? json_decode($rawHighlights, true) : null);

        return Inertia::render('Storefront/Policy', [
            'slug' => $slug,
            'titleEn' => $meta['en'],
            'titleAr' => $meta['ar'],
            'bodyEn' => $this->settings->get($meta['key'], ''),
            'bodyAr' => $this->settings->get($meta['key'].'_ar', ''),
            'highlights' => is_array($highlights) ? $highlights : null,
        ]);
    }

    public function about(): Response
    {
        return Inertia::render('Storefront/About', [
            'titleEn' => $this->settings->get('about_title', 'About Us'),
            'titleAr' => $this->settings->get('about_title_ar', 'من نحن'),
            'bodyEn' => $this->settings->get('about_body', ''),
            'bodyAr' => $this->settings->get('about_body_ar', ''),
        ]);
    }

    public function contact(): Response
    {
        return Inertia::render('Storefront/Contact');
    }

    public function sitemap(): \Illuminate\Http\Response
    {
        $esc = fn (string $v) => htmlspecialchars($v, ENT_XML1 | ENT_QUOTES, 'UTF-8');

        $products = Product::query()
            ->where('status', 'published')
            ->where('visibility', '!=', 'private')
            ->with(['images' => fn ($q) => $q->whereNull('variation_id')->orderByDesc('is_main')->orderBy('sort_order')])
            ->get(['id', 'name', 'slug', 'updated_at']);

        $categories = Category::query()->where('is_visible', true)->get(['slug', 'updated_at']);
        $brands = Brand::query()->where('is_visible', true)->get(['slug', 'updated_at']);

        $xml = '<?xml version="1.0" encoding="UTF-8"?>';
        $xml .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">';
        $xml .= '<url><loc>'.$esc(url('/')).'</loc><changefreq>daily</changefreq><priority>1.0</priority></url>';
        $xml .= '<url><loc>'.$esc(url('/catalog')).'</loc><changefreq>daily</changefreq><priority>0.9</priority></url>';
        foreach (['about', 'contact', 'policies/privacy-policy', 'policies/terms', 'policies/refund-policy'] as $staticPath) {
            $xml .= '<url><loc>'.$esc(url('/'.$staticPath)).'</loc><changefreq>monthly</changefreq><priority>0.5</priority></url>';
        }

        foreach ($categories as $cat) {
            $xml .= '<url><loc>'.$esc(url('/catalog?category='.$cat->slug)).'</loc>';
            if ($cat->updated_at) {
                $xml .= '<lastmod>'.$cat->updated_at->toAtomString().'</lastmod>';
            }
            $xml .= '<changefreq>weekly</changefreq><priority>0.8</priority></url>';
        }

        foreach ($brands as $brand) {
            $xml .= '<url><loc>'.$esc(url('/catalog?brand='.$brand->slug)).'</loc>';
            if ($brand->updated_at) {
                $xml .= '<lastmod>'.$brand->updated_at->toAtomString().'</lastmod>';
            }
            $xml .= '<changefreq>weekly</changefreq><priority>0.7</priority></url>';
        }

        foreach ($products as $p) {
            $xml .= '<url><loc>'.$esc(url('/products/'.$p->slug)).'</loc>';
            if ($p->updated_at) {
                $xml .= '<lastmod>'.$p->updated_at->toAtomString().'</lastmod>';
            }
            $img = $p->images->first()?->path;
            if ($img) {
                $xml .= '<image:image><image:loc>'.$esc(url('/storage/'.$img)).'</image:loc><image:title>'.$esc($p->name).'</image:title></image:image>';
            }
            $xml .= '<changefreq>weekly</changefreq><priority>0.8</priority></url>';
        }
        $xml .= '</urlset>';

        return response($xml, 200, ['Content-Type' => 'application/xml']);
    }
}
