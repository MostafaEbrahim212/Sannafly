<?php

namespace App\Http\Controllers;

use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ProductReview;
use App\Services\SettingsService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ProductReviewController extends Controller
{
    public function store(Request $request, Product $product): RedirectResponse
    {
        $data = $request->validate([
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'title' => ['nullable', 'string', 'max:150'],
            'comment' => ['nullable', 'string', 'max:2000'],
        ]);

        $customerId = Auth::guard('customer')->id();

        $verifiedPurchase = OrderItem::query()
            ->where('product_id', $product->id)
            ->whereHas('order', fn ($q) => $q->where('customer_id', $customerId)->whereIn('status', ['confirmed', 'processing', 'shipped', 'delivered']))
            ->exists();

        if (app(SettingsService::class)->isEnabled('reviews_verified_only') && ! $verifiedPurchase) {
            return back()->with('error', __('Only customers who purchased this product can leave a review.'));
        }

        ProductReview::query()->updateOrCreate(
            [
                'product_id' => $product->id,
                'customer_id' => $customerId,
            ],
            [
                'rating' => (int) $data['rating'],
                'title' => $data['title'] ?? null,
                'comment' => $data['comment'] ?? null,
                'is_verified_purchase' => $verifiedPurchase,
                'is_approved' => true,
            ]
        );

        return back()->with('success', __('Thank you for your review!'));
    }
}
