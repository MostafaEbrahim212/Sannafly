<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Support\Money;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AnalyticsController extends Controller
{
    public function index(Request $request): Response
    {
        $days = max(7, min(365, (int) $request->integer('days', 30)));
        $since = now()->subDays($days)->startOfDay();

        $orders = Order::query()
            ->where('created_at', '>=', $since)
            ->where('status', '!=', 'cancelled')
            ->get(['id', 'grand_total', 'subtotal', 'discount_total', 'shipping_total', 'payment_status', 'payment_method_id', 'created_at']);

        $totalRevenue = '0.0000';
        $paidRevenue = '0.0000';
        $totalDiscount = '0.0000';
        $totalShipping = '0.0000';

        foreach ($orders as $order) {
            $totalRevenue = Money::add($totalRevenue, (string) $order->grand_total);
            $totalDiscount = Money::add($totalDiscount, (string) $order->discount_total);
            $totalShipping = Money::add($totalShipping, (string) $order->shipping_total);
            if ($order->payment_status === 'paid') {
                $paidRevenue = Money::add($paidRevenue, (string) $order->grand_total);
            }
        }

        $orderCount = $orders->count();
        $avgOrderValue = $orderCount > 0 ? Money::div($totalRevenue, (string) $orderCount) : '0.0000';

        $topProducts = OrderItem::query()
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->where('orders.created_at', '>=', $since)
            ->where('orders.status', '!=', 'cancelled')
            ->select(
                'order_items.sku',
                'order_items.product_name',
                DB::raw('SUM(order_items.quantity) as total_qty'),
                DB::raw('SUM(order_items.total_price) as total_sales')
            )
            ->groupBy('order_items.sku', 'order_items.product_name')
            ->orderByDesc('total_qty')
            ->limit(10)
            ->get();

        $byPaymentMethod = Order::query()
            ->leftJoin('payment_methods', 'payment_methods.id', '=', 'orders.payment_method_id')
            ->where('orders.created_at', '>=', $since)
            ->where('orders.status', '!=', 'cancelled')
            ->select(
                'payment_methods.name',
                'payment_methods.name_ar',
                'payment_methods.driver',
                DB::raw('COUNT(orders.id) as orders_count'),
                DB::raw('SUM(orders.grand_total) as total_amount')
            )
            ->groupBy('payment_methods.id', 'payment_methods.name', 'payment_methods.name_ar', 'payment_methods.driver')
            ->orderByDesc('orders_count')
            ->get();

        return Inertia::render('Admin/Analytics/Index', [
            'days' => $days,
            'summary' => [
                'order_count' => $orderCount,
                'total_revenue' => Money::toGateway($totalRevenue),
                'paid_revenue' => Money::toGateway($paidRevenue),
                'avg_order_value' => Money::toGateway($avgOrderValue),
                'total_discount' => Money::toGateway($totalDiscount),
                'total_shipping' => Money::toGateway($totalShipping),
            ],
            'topProducts' => $topProducts,
            'byPaymentMethod' => $byPaymentMethod,
        ]);
    }

    public function export(Request $request): StreamedResponse
    {
        $days = max(7, min(365, (int) $request->integer('days', 30)));
        $since = now()->subDays($days)->startOfDay();

        return response()->streamDownload(function () use ($since) {
            $handle = fopen('php://output', 'w');
            fwrite($handle, "\xEF\xBB\xBF");
            fputcsv($handle, ['Order Number', 'Date', 'Status', 'Payment Status', 'Subtotal', 'Discount', 'Shipping', 'Grand Total', 'Currency']);

            Order::query()
                ->where('created_at', '>=', $since)
                ->orderBy('id')
                ->chunk(200, function ($chunk) use ($handle) {
                    foreach ($chunk as $order) {
                        fputcsv($handle, [
                            $this->csvSafe($order->order_number),
                            $order->created_at?->toDateTimeString() ?? '',
                            $order->status,
                            $order->payment_status,
                            $order->subtotal,
                            $order->discount_total,
                            $order->shipping_total,
                            $order->grand_total,
                            $order->currency,
                        ]);
                    }
                });

            fclose($handle);
        }, 'sales-analytics-'.now()->format('Ymd').'.csv', [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    private function csvSafe(string $value): string
    {
        if ($value !== '' && in_array($value[0], ['=', '+', '-', '@', "\t", "\r"], true)) {
            return "'".$value;
        }

        return $value;
    }
}
