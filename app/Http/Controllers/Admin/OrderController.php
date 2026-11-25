<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Services\OrderService;
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
            'payment_status' => ['nullable', Rule::in(['unpaid', 'paid', 'partially_refunded', 'refunded', 'failed'])],
        ]);

        try {
            $this->orderService->transitionStatus(
                $order,
                $data['status'],
                $data['payment_status'] ?? null
            );
        } catch (RuntimeException $e) {
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
}
