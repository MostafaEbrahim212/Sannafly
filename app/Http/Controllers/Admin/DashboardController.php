<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Brand;
use App\Models\Category;
use App\Models\ImportJob;
use App\Models\Order;
use App\Models\Product;
use App\Models\ProductInquiry;
use App\Services\SettingsService;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __construct(private readonly SettingsService $settings) {}

    public function index(): Response
    {
        $lowStockProducts = Product::query()
            ->where('track_inventory', true)
            ->whereColumn('stock_quantity', '<=', 'low_stock_threshold')
            ->with(['category:id,name,name_ar'])
            ->orderBy('stock_quantity')
            ->limit(6)
            ->get(['id', 'name', 'name_ar', 'sku', 'stock_quantity', 'low_stock_threshold', 'category_id']);

        $categoryBreakdown = Category::query()
            ->withCount('products')
            ->orderByDesc('products_count')
            ->limit(6)
            ->get(['id', 'name', 'name_ar']);

        return Inertia::render('Admin/Dashboard', [
            'stats' => [
                'total_products' => Product::query()->count(),
                'published_products' => Product::query()->where('status', 'published')->count(),
                'draft_products' => Product::query()->where('status', 'draft')->count(),
                'low_stock_count' => Product::query()->where('track_inventory', true)->whereColumn('stock_quantity', '<=', 'low_stock_threshold')->count(),
                'categories_count' => Category::query()->count(),
                'brands_count' => Brand::query()->count(),
                'orders_count' => $this->settings->isEnabled('module_ecommerce') ? Order::query()->count() : 0,
                'pending_orders' => $this->settings->isEnabled('module_ecommerce') ? Order::query()->where('status', 'pending')->count() : 0,
            ],
            'lowStockProducts' => $lowStockProducts,
            'recentProducts' => Product::query()->with(['category:id,name,name_ar', 'images' => fn ($q) => $q->orderByDesc('is_main')->orderBy('sort_order')])->latest()->limit(6)->get(),
            'recentActivity' => AuditLog::query()->latest('created_at')->limit(8)->get(),
            'recentImports' => ImportJob::query()->latest()->limit(5)->get(),
            'recentInquiries' => ProductInquiry::query()->with('product:id,name,name_ar')->latest()->limit(5)->get(),
            'categoryBreakdown' => $categoryBreakdown,
        ]);
    }
}
