<?php

namespace App\Http\Middleware;

use App\Services\SettingsService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
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
        ];
    }
}
