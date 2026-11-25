<?php

namespace App\Services;

use App\Models\Coupon;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\PaymentMethod;
use App\Models\Product;
use App\Models\ProductVariation;
use App\Notifications\OrderStatusNotification;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;
use RuntimeException;

class OrderService
{
    /**
     * Explicit state machine for order status transitions.
     *
     * @var array<string, array<int, string>>
     */
    public const ALLOWED_TRANSITIONS = [
        'pending' => ['confirmed', 'processing', 'cancelled'],
        'confirmed' => ['processing', 'shipped', 'cancelled'],
        'processing' => ['shipped', 'cancelled'],
        'shipped' => ['delivered', 'returned', 'cancelled'],
        'delivered' => ['returned', 'refunded'],
        'returned' => ['refunded'],
        'cancelled' => [],
        'refunded' => [],
    ];

    public function __construct(
        private readonly InventoryService $inventory,
        private readonly AuditLogger $audit,
        private readonly ShippingService $shipping,
        private readonly SettingsService $settings,
    ) {}

    public static function allowedNextStatuses(string $currentStatus): array
    {
        return self::ALLOWED_TRANSITIONS[$currentStatus] ?? [];
    }

    public function placeOrder(array $customerData, array $cartItems, int $paymentMethodId, ?string $idempotencyKey = null, ?string $couponCode = null): Order
    {
        if ($idempotencyKey) {
            $existing = Order::query()->where('idempotency_key', $idempotencyKey)->first();
            if ($existing) {
                return $existing->load(['items', 'paymentMethod']);
            }
        }

        if (empty($cartItems)) {
            throw new RuntimeException('Cart is empty.');
        }

        return DB::transaction(function () use ($customerData, $cartItems, $paymentMethodId, $idempotencyKey, $couponCode) {
            $paymentMethod = PaymentMethod::query()->where('is_active', true)->findOrFail($paymentMethodId);

            // Sort items by product_id to acquire row locks in deterministic order and avoid deadlocks
            usort($cartItems, fn ($a, $b) => ($a['product_id'] <=> $b['product_id']));

            $subtotal = '0.0000';
            $preparedItems = [];

            foreach ($cartItems as $item) {
                $qty = max(1, (int) $item['quantity']);
                $product = Product::query()->with(['prices.priceType'])->lockForUpdate()->findOrFail($item['product_id']);
                $variation = ! empty($item['variation_id'])
                    ? ProductVariation::query()->where('product_id', $product->id)->with('prices.priceType')->lockForUpdate()->findOrFail($item['variation_id'])
                    : null;

                if ($product->track_inventory && ! $product->allow_backorder) {
                    $available = $variation ? $variation->stock_quantity : $product->stock_quantity;
                    if ($available < $qty && ! $product->allow_negative_stock) {
                        throw new RuntimeException("Insufficient stock for {$product->name}.");
                    }
                }

                $unitPrice = $this->resolveUnitPrice($product, $variation, $qty);
                $lineTotal = bcmul($unitPrice, (string) $qty, 4);
                $subtotal = bcadd($subtotal, $lineTotal, 4);

                $preparedItems[] = [
                    'product' => $product,
                    'variation' => $variation,
                    'quantity' => $qty,
                    'unit_price' => $unitPrice,
                    'total_price' => $lineTotal,
                ];
            }

            $coupon = null;
            $discountTotal = '0.0000';
            if ($couponCode) {
                $normalizedCode = strtoupper(trim($couponCode));
                $coupon = Coupon::query()->where('code', $normalizedCode)->lockForUpdate()->first();
                if (! $coupon) {
                    throw new RuntimeException('Invalid coupon code.');
                }
                if ($error = $coupon->isValidForAmount((float) $subtotal)) {
                    throw new RuntimeException($error);
                }
                $discountFloat = $coupon->calculateDiscount((float) $subtotal);
                $discountTotal = number_format($discountFloat, 4, '.', '');
                $coupon->increment('used_count');
            }

            $netSubtotal = max(0.0, (float) $subtotal - (float) $discountTotal);
            $city = is_array($customerData['shipping_address'] ?? null) ? ($customerData['shipping_address']['city'] ?? null) : null;
            $isPickup = $paymentMethod->driver === 'cash';
            $shippingCalc = $isPickup
                ? ['zone' => null, 'rate' => 0.0, 'free_shipping' => true]
                : $this->shipping->calculateForCity($city, $netSubtotal);
            $shippingTotal = number_format($shippingCalc['rate'], 4, '.', '');
            $grandTotal = number_format($netSubtotal + $shippingCalc['rate'], 4, '.', '');

            $currency = strtoupper(trim((string) $this->settings->get('currency', 'EGP'))) ?: 'EGP';

            $order = Order::query()->create([
                'order_number' => 'ORD-'.now()->format('Ymd').'-'.strtoupper(Str::random(6)),
                'user_id' => null,
                'customer_id' => Auth::guard('customer')->id(),
                'customer_name' => $customerData['customer_name'],
                'customer_email' => $customerData['customer_email'] ?? null,
                'customer_phone' => $customerData['customer_phone'],
                'shipping_address' => $customerData['shipping_address'] ?? null,
                'status' => 'pending',
                'payment_status' => 'unpaid',
                'payment_method_id' => $paymentMethod->id,
                'coupon_id' => $coupon?->id,
                'coupon_code' => $coupon?->code,
                'shipping_zone_id' => $shippingCalc['zone']?->id,
                'shipping_zone_name' => $isPickup ? 'Store Pickup' : $shippingCalc['zone']?->name,
                'subtotal' => $subtotal,
                'discount_total' => $discountTotal,
                'shipping_total' => $shippingTotal,
                'tax_total' => '0.0000',
                'grand_total' => $grandTotal,
                'currency' => $currency,
                'notes' => $customerData['notes'] ?? null,
                'idempotency_key' => $idempotencyKey,
            ]);

            foreach ($preparedItems as $line) {
                /** @var Product $p */
                $p = $line['product'];
                /** @var ProductVariation|null $v */
                $v = $line['variation'];

                OrderItem::query()->create([
                    'order_id' => $order->id,
                    'product_id' => $p->id,
                    'variation_id' => $v?->id,
                    'product_name' => $v ? "{$p->name} ({$v->name})" : $p->name,
                    'sku' => $v ? $v->sku : $p->sku,
                    'quantity' => $line['quantity'],
                    'unit_price' => $line['unit_price'],
                    'total_price' => $line['total_price'],
                ]);

                if ($p->track_inventory) {
                    $this->inventory->adjustStock(
                        $p,
                        -$line['quantity'],
                        'reservation',
                        $v,
                        "Reserved for order {$order->order_number}",
                        'Order',
                        $order->id
                    );
                }
            }

            Payment::query()->create([
                'order_id' => $order->id,
                'payment_method_id' => $paymentMethod->id,
                'amount' => $order->grand_total,
                'currency' => $order->currency,
                'status' => 'pending',
            ]);

            $this->audit->log('order.created', 'Order', $order->id, null, [
                'order_number' => $order->order_number,
                'grand_total' => $order->grand_total,
            ]);

            $this->notifyCustomer($order, true);

            return $order->load(['items', 'paymentMethod']);
        });
    }

    public function transitionStatus(Order $order, string $newStatus, ?string $paymentStatus = null, bool $restockOnRefund = true): Order
    {
        return DB::transaction(function () use ($order, $newStatus, $paymentStatus, $restockOnRefund) {
            $locked = Order::query()->with(['items.product', 'items.variation', 'payments', 'paymentMethod'])->lockForUpdate()->findOrFail($order->id);
            $oldStatus = $locked->status;

            if ($newStatus !== $oldStatus) {
                $allowed = self::allowedNextStatuses($oldStatus);
                if (! in_array($newStatus, $allowed, true)) {
                    throw new RuntimeException("Cannot transition order from '{$oldStatus}' to '{$newStatus}'.");
                }

                match ($newStatus) {
                    'cancelled' => $this->restoreOrderStock($locked, 'release', "Released from cancelled order {$locked->order_number}"),
                    'returned' => $this->restoreOrderStock($locked, 'return', "Returned from order {$locked->order_number}"),
                    'refunded' => $this->handleRefund($locked, $restockOnRefund),
                    default => null,
                };

                $locked->status = $newStatus;

                // Smart Automation: COD / Cash orders are automatically marked Paid upon Delivery
                if ($newStatus === 'delivered' && $locked->payment_status === 'unpaid' && in_array($locked->paymentMethod?->driver, ['cod', 'cash'], true)) {
                    $paymentStatus = 'paid';
                }
            }

            if ($paymentStatus !== null && $paymentStatus !== $locked->payment_status) {
                $locked->payment_status = $paymentStatus;
                $latestPayment = $locked->payments->sortByDesc('id')->first();
                if ($latestPayment && $paymentStatus === 'paid' && $latestPayment->status !== 'completed') {
                    $latestPayment->update(['status' => 'completed', 'paid_at' => now()]);
                }
            }

            $locked->save();

            $this->audit->log('order.status_updated', 'Order', $locked->id, [
                'status' => $oldStatus,
            ], [
                'status' => $locked->status,
                'payment_status' => $locked->payment_status,
            ]);

            if ($newStatus !== $oldStatus) {
                $this->notifyCustomer($locked, false);
            }

            return $locked;
        });
    }

    private function notifyCustomer(Order $order, bool $isNewOrder): void
    {
        if (! $order->customer_email) {
            return;
        }

        try {
            Notification::route('mail', $order->customer_email)
                ->notify(new OrderStatusNotification($order, $isNewOrder));
        } catch (\Throwable) {
            // Do not fail order placement/update if mail transport is not configured
        }
    }

    public function cancelOrder(Order $order): Order
    {
        return $this->transitionStatus($order, 'cancelled');
    }

    public function returnOrder(Order $order): Order
    {
        return $this->transitionStatus($order, 'returned');
    }

    private function handleRefund(Order $locked, bool $restockOnRefund): void
    {
        // Only restock if it wasn't already returned or cancelled
        if ($restockOnRefund && ! in_array($locked->status, ['returned', 'cancelled'], true)) {
            $this->restoreOrderStock($locked, 'return', "Restocked on refund of order {$locked->order_number}");
        }

        $locked->payment_status = 'refunded';
        foreach ($locked->payments as $payment) {
            if ($payment->status === 'completed') {
                $payment->update(['status' => 'refunded']);
            }
        }
    }

    private function restoreOrderStock(Order $locked, string $movementType, string $reason): void
    {
        foreach ($locked->items as $item) {
            if ($item->product && $item->product->track_inventory) {
                $this->inventory->adjustStock(
                    $item->product,
                    $item->quantity,
                    $movementType,
                    $item->variation,
                    $reason,
                    'Order',
                    $locked->id
                );
            }
        }
    }

    private function resolveUnitPrice(Product $product, ?ProductVariation $variation, int $qty): string
    {
        if ($variation && $variation->prices->isNotEmpty()) {
            $sale = $variation->prices->firstWhere('priceType.slug', 'sale');
            $reg = $variation->prices->firstWhere('priceType.slug', 'regular') ?? $variation->prices->first();

            return number_format((float) ($sale?->amount ?? $reg->amount), 4, '.', '');
        }

        $tier = $product->prices
            ->where('min_quantity', '<=', $qty)
            ->sortByDesc('min_quantity')
            ->first();

        if ($tier) {
            return number_format((float) $tier->amount, 4, '.', '');
        }

        $first = $product->prices->first();

        return $first ? number_format((float) $first->amount, 4, '.', '') : '0.0000';
    }
}
