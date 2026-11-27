<?php

namespace App\Http\Middleware;

use App\Models\Order;
use App\Models\Product;
use App\Services\DemoModeService;
use App\Services\SettingsService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Schema;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function __construct(private readonly SettingsService $settings) {}

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    public function share(Request $request): array
    {
        $admin = Auth::guard('web')->user();
        $customer = Auth::guard('customer')->user();

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $admin ? [
                    'id' => $admin->id,
                    'name' => $admin->name,
                    'email' => $admin->email,
                    'phone' => $admin->phone,
                    'avatar' => $admin->avatar,
                    'status' => $admin->status,
                    'roles' => $admin->roles()->pluck('slug')->all(),
                ] : null,
                'permissions' => $admin ? $admin->getAllPermissionSlugs() : [],
                'customer' => $customer ? [
                    'id' => $customer->id,
                    'name' => $customer->name,
                    'email' => $customer->email,
                    'phone' => $customer->phone,
                ] : null,
            ],
            'locale' => app()->getLocale(),
            'dir' => app()->getLocale() === 'ar' ? 'rtl' : 'ltr',
            'settings' => $this->settings->publicSettings(),
            'cartCount' => collect($request->session()->get('cart', []))->sum('quantity'),
            'wishlistIds' => $customer ? $customer->wishlists()->pluck('product_id')->all() : [],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
            'adminAlerts' => fn () => $admin ? $this->buildAdminAlerts() : null,
            'adminUnreadNotifications' => fn () => $admin && Schema::hasTable('notifications') ? $admin->unreadNotifications()->count() : 0,
            'customerUnreadNotifications' => fn () => $customer && Schema::hasTable('notifications') ? $customer->unreadNotifications()->count() : 0,
            'demoMode' => fn () => app(DemoModeService::class)->isEnabled(),
        ];
    }

    private function buildAdminAlerts(): array
    {
        if (! Schema::hasTable('orders') || ! Schema::hasTable('products')) {
            return ['total' => 0, 'pending_orders' => 0, 'review_orders' => 0, 'low_stock' => 0];
        }

        $pendingOrders = Order::query()->where('status', 'pending')->count();
        $reviewOrders = Order::query()->whereIn('payment_status', ['amount_mismatch', 'needs_review', 'refund_pending'])->count();
        $lowStock = Product::query()
            ->where('track_inventory', true)
            ->whereColumn('stock_quantity', '<=', 'low_stock_threshold')
            ->count();

        return [
            'total' => $pendingOrders + $reviewOrders + $lowStock,
            'pending_orders' => $pendingOrders,
            'review_orders' => $reviewOrders,
            'low_stock' => $lowStock,
        ];
    }
}
