<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Wishlist;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class WishlistController extends Controller
{
    public function index(): Response
    {
        $customer = Auth::guard('customer')->user();

        $products = Product::query()
            ->whereIn('id', $customer->wishlists()->pluck('product_id'))
            ->where('status', 'published')
            ->with([
                'category:id,name,name_ar,slug',
                'brand:id,name,name_ar,slug',
                'images' => fn ($q) => $q->whereNull('variation_id')->orderByDesc('is_main')->orderBy('sort_order'),
                'prices.priceType',
            ])
            ->get();

        return Inertia::render('Storefront/Wishlist', [
            'products' => $products,
        ]);
    }

    public function toggle(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'product_id' => ['required', 'integer', 'exists:products,id'],
        ]);

        $customerId = Auth::guard('customer')->id();
        $existing = Wishlist::query()
            ->where('customer_id', $customerId)
            ->where('product_id', $data['product_id'])
            ->first();

        if ($existing) {
            $existing->delete();

            return back()->with('success', __('Removed from wishlist.'));
        }

        Wishlist::query()->create([
            'customer_id' => $customerId,
            'product_id' => $data['product_id'],
        ]);

        return back()->with('success', __('Added to wishlist.'));
    }
}
