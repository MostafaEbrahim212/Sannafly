<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Services\OrderService;
use App\Support\ErrorLogger;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;

class OrderController extends Controller
{
    public function __construct(private readonly OrderService $orderService) {}

    public function index(Request $request): Response
    {
        $orders = Order::query()
            ->with(['paymentMethod:id,name,name_ar,driver', 'items', 'payments'])
            ->when($search = $request->string('search')->trim()->toString(), fn ($q) => $q->where('order_number', 'like', "%{$search}%")->orWhere('customer_name', 'like', "%{$search}%")->orWhere('customer_phone', 'like', "%{$search}%"))
            ->when($status = $request->string('status')->trim()->toString(), fn ($q) => $q->where('status', $status))
            ->latest()
            ->paginate(15)
            ->withQueryString();

        $statusCounts = Order::query()
            ->selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status')
            ->all();

        return Inertia::render('Admin/Orders/Index', [
            'orders' => $orders,
            'statusCounts' => $statusCounts,
            'allowedTransitions' => OrderService::ALLOWED_TRANSITIONS,
            'filters' => (object) $request->only(['search', 'status']),
        ]);
    }

    public function updateStatus(Request $request, Order $order): RedirectResponse
    {
        $data = $request->validate([
            'status' => ['required', Rule::in(array_keys(OrderService::ALLOWED_TRANSITIONS))],
            'payment_status' => ['nullable', Rule::in(Order::PAYMENT_STATUSES)],
            'tracking_number' => ['nullable', 'string', 'max:120'],
            'shipping_carrier' => ['nullable', 'string', 'max:80'],
        ]);

        try {
            $this->orderService->transitionStatus(
                $order,
                $data['status'],
                $data['payment_status'] ?? null
            );

            if (array_key_exists('tracking_number', $data) || array_key_exists('shipping_carrier', $data)) {
                $order->update([
                    'tracking_number' => $data['tracking_number'] ?? $order->tracking_number,
                    'shipping_carrier' => $data['shipping_carrier'] ?? $order->shipping_carrier,
                ]);
            }
        } catch (RuntimeException $e) {
            ErrorLogger::warning('order.status_transition_failed', $e, extra: [
                'order_id' => $order->id,
                'order_number' => $order->order_number,
                'target_status' => $data['status'],
            ]);

            return back()->with('error', $e->getMessage());
        }

        return back()->with('success', __('Order updated.'));
    }

    public function show(Order $order): Response
    {
        $order->load(['items', 'payments.paymentMethod', 'paymentMethod', 'customer', 'coupon', 'shippingZone']);

        return Inertia::render('Admin/Orders/Show', [
            'order' => $order,
            'allowedTransitions' => OrderService::ALLOWED_TRANSITIONS,
        ]);
    }

    public function invoice(Order $order): Response
    {
        $order->load(['items', 'paymentMethod', 'coupon', 'shippingZone']);

        return Inertia::render('Admin/Orders/Invoice', [
            'order' => $order,
        ]);
    }

    public function shippingLabel(Order $order): Response
    {
        $order->load(['items', 'paymentMethod', 'shippingZone']);

        return Inertia::render('Admin/Orders/ShippingLabel', [
            'order' => $order,
        ]);
    }
}
