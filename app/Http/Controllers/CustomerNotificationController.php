<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;

class CustomerNotificationController extends Controller
{
    public function index(Request $request): Response
    {
        /** @var Customer $customer */
        $customer = Auth::guard('customer')->user();
        $filter = $request->string('filter')->toString() ?: 'all';

        $query = $customer->notifications()->latest();
        if ($filter === 'unread') {
            $query->whereNull('read_at');
        }

        $notifications = $query->paginate(20)->withQueryString()->through(fn ($n) => [
            'id' => $n->id,
            'data' => $n->data,
            'read_at' => $n->read_at?->toIso8601String(),
            'created_at' => $n->created_at?->toDateTimeString(),
            'human_time' => $n->created_at?->diffForHumans(),
        ]);

        return Inertia::render('Storefront/Notifications', [
            'notifications' => $notifications,
            'unreadCount' => $customer->unreadNotifications()->count(),
            'filter' => $filter,
        ]);
    }

    public function feed(): JsonResponse
    {
        /** @var Customer $customer */
        $customer = Auth::guard('customer')->user();
        $hasTable = Schema::hasTable('notifications');

        $unreadCount = $hasTable ? $customer->unreadNotifications()->count() : 0;
        $latest = $hasTable
            ? $customer->notifications()->latest()->limit(8)->get()->map(fn ($n) => [
                'id' => $n->id,
                'data' => $n->data,
                'read_at' => $n->read_at?->toIso8601String(),
                'created_at' => $n->created_at?->toIso8601String(),
                'human_time' => $n->created_at?->diffForHumans(),
            ])
            : collect();

        $latestOrder = Order::query()
            ->where('customer_id', $customer->id)
            ->latest('updated_at')
            ->first(['id', 'order_number', 'status', 'payment_status', 'updated_at']);

        return response()->json([
            'unread_count' => $unreadCount,
            'notifications' => $latest,
            'latest_order_signature' => $latestOrder
                ? "{$latestOrder->id}:{$latestOrder->status}:{$latestOrder->payment_status}:{$latestOrder->updated_at?->timestamp}"
                : null,
        ]);
    }

    public function orderLiveStatus(string $orderNumber): JsonResponse
    {
        $order = Order::query()
            ->where('order_number', $orderNumber)
            ->first(['id', 'order_number', 'status', 'payment_status', 'tracking_number', 'shipping_carrier', 'updated_at']);

        if (! $order) {
            return response()->json(['message' => 'Order not found.'], 404);
        }

        return response()->json([
            'order_number' => $order->order_number,
            'status' => $order->status,
            'payment_status' => $order->payment_status,
            'tracking_number' => $order->tracking_number,
            'shipping_carrier' => $order->shipping_carrier,
            'updated_at' => $order->updated_at?->toIso8601String(),
        ]);
    }

    public function markRead(string $id): RedirectResponse
    {
        /** @var Customer $customer */
        $customer = Auth::guard('customer')->user();
        $customer->notifications()->where('id', $id)->update(['read_at' => now()]);

        return back();
    }

    public function markAllRead(): RedirectResponse
    {
        /** @var Customer $customer */
        $customer = Auth::guard('customer')->user();
        $customer->unreadNotifications()->update(['read_at' => now()]);

        return back();
    }

    public function destroy(string $id): RedirectResponse
    {
        /** @var Customer $customer */
        $customer = Auth::guard('customer')->user();
        $customer->notifications()->where('id', $id)->delete();

        return back();
    }
}
