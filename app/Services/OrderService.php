<?php

namespace App\Services;

use App\Models\Coupon;
use App\Models\CouponRedemption;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\PaymentMethod;
use App\Models\Product;
use App\Models\ProductVariation;
use App\Notifications\OrderStatusNotification;
use App\Services\Payments\PaymentGatewayManager;
use App\Support\Money;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
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
        'shipped' => ['delivered', 'returned'],
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
        private readonly PaymentGatewayManager $gatewayManager,
    ) {}

    public static function allowedNextStatuses(string $currentStatus): array
    {
        return self::ALLOWED_TRANSITIONS[$currentStatus] ?? [];
    }

    public function placeOrder(
        array $customerData,
        array $cartItems,
        int $paymentMethodId,
        ?string $idempotencyKey = null,
        ?string $couponCode = null,
        ?string $actorScope = null,
    ): Order {
        $scopedKey = null;
        if ($idempotencyKey !== null && trim($idempotencyKey) !== '') {
            $scope = $actorScope ?? $this->resolveActorScope();
            $scopedKey = hash('sha256', $scope.'|'.trim($idempotencyKey));

            $existing = $this->findExistingByScopedKey($scopedKey);
            if ($existing) {
                return $existing->load(['items', 'paymentMethod']);
            }
        }

        if (empty($cartItems)) {
            throw new RuntimeException('Cart is empty.');
        }

        try {
            return DB::transaction(function () use ($customerData, $cartItems, $paymentMethodId, $scopedKey, $couponCode) {
                $paymentMethod = PaymentMethod::query()->where('is_active', true)->findOrFail($paymentMethodId);

                // Sort items by (product_id, variation_id) to acquire row locks in deterministic order and avoid deadlocks
                usort($cartItems, fn ($a, $b) => [$a['product_id'], $a['variation_id'] ?? 0] <=> [$b['product_id'], $b['variation_id'] ?? 0]);

                $subtotal = '0.0000';
                $preparedItems = [];

                foreach ($cartItems as $item) {
                    $qty = (int) ($item['quantity'] ?? 0);
                    if ($qty < 1 || $qty > 1000) {
                        throw new RuntimeException('Invalid item quantity.');
                    }

                    $product = Product::query()->with(['prices.priceType'])->lockForUpdate()->findOrFail($item['product_id']);
                    if (! $product->isPurchasable()) {
                        throw new RuntimeException("Product {$product->name} is not available for purchase.");
                    }

                    $variation = ! empty($item['variation_id'])
                        ? ProductVariation::query()->where('product_id', $product->id)->with('prices.priceType')->lockForUpdate()->findOrFail($item['variation_id'])
                        : null;

                    if ($variation && ! $variation->isPurchasable()) {
                        throw new RuntimeException("Variation {$variation->name} is not available for purchase.");
                    }

                    if (! $product->hasAvailableStock($qty, $variation)) {
                        throw new RuntimeException("Insufficient stock for {$product->name}.");
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
                $customerId = Auth::guard('customer')->id();
                $normalizedPhone = preg_replace('/\D+/', '', (string) ($customerData['customer_phone'] ?? '')) ?: null;

                if ($couponCode) {
                    $normalizedCode = strtoupper(trim($couponCode));
                    $coupon = Coupon::query()->where('code', $normalizedCode)->lockForUpdate()->first();
                    if (! $coupon) {
                        throw new RuntimeException('Invalid coupon code.');
                    }
                    if ($error = $coupon->isValidForAmount($subtotal)) {
                        throw new RuntimeException($error);
                    }
                    if ($coupon->usage_limit_per_customer !== null) {
                        $usedByCustomer = CouponRedemption::query()
                            ->where('coupon_id', $coupon->id)
                            ->where(function ($q) use ($customerId, $normalizedPhone) {
                                if ($customerId) {
                                    $q->where('customer_id', $customerId);
                                } elseif ($normalizedPhone) {
                                    $q->where('customer_phone', $normalizedPhone);
                                }
                            })
                            ->count();

                        if ($usedByCustomer >= $coupon->usage_limit_per_customer) {
                            throw new RuntimeException('You have reached the usage limit for this coupon.');
                        }
                    }
                    $discountTotal = $coupon->calculateDiscount($subtotal);
                    $coupon->increment('used_count');
                }

                $netSubtotal = Money::max('0.0000', Money::sub($subtotal, $discountTotal));
                $city = is_array($customerData['shipping_address'] ?? null) ? ($customerData['shipping_address']['city'] ?? null) : null;
                $isPickup = $paymentMethod->driver === 'cash';
                $shippingCalc = $isPickup
                    ? ['zone' => null, 'rate' => '0.0000', 'free_shipping' => true]
                    : $this->shipping->calculateForCity($city, $netSubtotal);
                $shippingTotal = Money::normalize($shippingCalc['rate']);
                $grandTotal = Money::add($netSubtotal, $shippingTotal);

                $currency = strtoupper(trim((string) $this->settings->get('currency', 'EGP'))) ?: 'EGP';

                $order = Order::query()->create([
                    'order_number' => $this->generateUniqueOrderNumber(),
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
                    'idempotency_key' => $scopedKey,
                ]);

                if ($coupon) {
                    CouponRedemption::query()->create([
                        'coupon_id' => $coupon->id,
                        'customer_id' => $customerId,
                        'customer_phone' => $normalizedPhone,
                        'order_id' => $order->id,
                        'created_at' => now(),
                    ]);
                }

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
        } catch (UniqueConstraintViolationException $e) {
            if ($scopedKey !== null) {
                $existing = $this->findExistingByScopedKey($scopedKey);
                if ($existing) {
                    return $existing->load(['items', 'paymentMethod']);
                }
            }

            throw $e;
        }
    }

    protected function findExistingByScopedKey(string $scopedKey): ?Order
    {
        return Order::query()->where('idempotency_key', $scopedKey)->first();
    }

    private function generateUniqueOrderNumber(): string
    {
        do {
            $candidate = 'ORD-'.now()->format('Ymd').'-'.strtoupper(Str::random(10));
        } while (Order::withTrashed()->where('order_number', $candidate)->exists());

        return $candidate;
    }

    private function resolveActorScope(): string
    {
        if ($customerId = Auth::guard('customer')->id()) {
            return 'customer:'.$customerId;
        }

        if (request()->hasSession()) {
            return 'session:'.request()->session()->getId();
        }

        return 'cli';
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
                    'cancelled' => $this->handleCancellation($locked),
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
        } catch (\Throwable $e) {
            Log::warning('Failed to dispatch order status notification.', [
                'order_id' => $order->id,
                'order_number' => $order->order_number,
                'error' => $e->getMessage(),
            ]);
        }
    }

    public function cancelOrder(Order $order): Order
    {
        return $this->transitionStatus($order, 'cancelled');
    }

    /**
     * Prepare an unpaid or failed-payment order for a fresh payment attempt (optionally switching payment method).
     */
    public function preparePaymentRetry(Order $order, ?int $paymentMethodId = null): Payment
    {
        return DB::transaction(function () use ($order, $paymentMethodId): Payment {
            $locked = Order::query()
                ->whereKey($order->id)
                ->with(['items', 'paymentMethod'])
                ->lockForUpdate()
                ->firstOrFail();

            if ($locked->payment_status === 'paid') {
                throw new RuntimeException(__('This order has already been paid.'));
            }

            $canRetryPending = $locked->status === 'pending' && in_array($locked->payment_status, ['unpaid', 'failed'], true);
            $canRetryCancelled = $locked->status === 'cancelled' && $locked->payment_status === 'failed';

            if (! $canRetryPending && ! $canRetryCancelled) {
                throw new RuntimeException(__('This order is not eligible for payment retry.'));
            }

            $targetMethod = $locked->paymentMethod;
            if ($paymentMethodId !== null && $paymentMethodId !== (int) $locked->payment_method_id) {
                $targetMethod = PaymentMethod::query()->where('is_active', true)->find($paymentMethodId);
                if (! $targetMethod) {
                    throw new RuntimeException(__('Selected payment method is not available.'));
                }

                $netSubtotal = Money::sub((string) $locked->subtotal, (string) $locked->discount_total);
                $shippingTotal = (string) $locked->shipping_total;
                $shippingZoneName = $locked->shipping_zone_name;
                $shippingZoneId = $locked->shipping_zone_id;

                if ($targetMethod->driver === 'cash') {
                    $shippingTotal = '0.0000';
                    $shippingZoneName = 'Store Pickup';
                    $shippingZoneId = null;
                } elseif ($locked->paymentMethod?->driver === 'cash') {
                    $city = (string) ($locked->shipping_address['city'] ?? '');
                    if ($city !== '') {
                        $shippingCalc = $this->shipping->calculateForCity($city, $netSubtotal);
                        $shippingTotal = Money::normalize($shippingCalc['rate']);
                        $shippingZoneId = $shippingCalc['zone']?->id;
                        $shippingZoneName = $shippingCalc['zone']?->name;
                    }
                }

                $grandTotal = Money::add(Money::add($netSubtotal, $shippingTotal), (string) $locked->tax_total);

                $locked->update([
                    'payment_method_id' => $targetMethod->id,
                    'shipping_zone_id' => $shippingZoneId,
                    'shipping_zone_name' => $shippingZoneName,
                    'shipping_total' => $shippingTotal,
                    'grand_total' => $grandTotal,
                ]);
                $locked->setRelation('paymentMethod', $targetMethod);
            }

            if (! $targetMethod) {
                throw new RuntimeException(__('Payment method is not available.'));
            }

            if ($canRetryCancelled) {
                foreach ($locked->items as $item) {
                    $product = Product::query()->whereKey($item->product_id)->lockForUpdate()->first();
                    $variation = $item->variation_id
                        ? ProductVariation::query()->whereKey($item->variation_id)->lockForUpdate()->first()
                        : null;

                    if (! $product || ! $product->hasAvailableStock((int) $item->quantity, $variation)) {
                        throw new RuntimeException(__('Insufficient stock for :product.', ['product' => $item->product_name]));
                    }

                    if ($product->track_inventory) {
                        $this->inventory->adjustStock(
                            $product,
                            -(int) $item->quantity,
                            'reservation',
                            $variation,
                            "Re-reserved for payment retry on order {$locked->order_number}",
                            'Order',
                            $locked->id
                        );
                    }
                }

                if ($locked->coupon_id) {
                    $coupon = Coupon::query()->whereKey($locked->coupon_id)->lockForUpdate()->first();
                    if ($coupon) {
                        if ($coupon->max_uses !== null && $coupon->used_count >= $coupon->max_uses) {
                            throw new RuntimeException(__('Coupon usage limit has been reached.'));
                        }
                        $coupon->increment('used_count');
                        $normalizedPhone = preg_replace('/\D+/', '', (string) $locked->customer_phone) ?: null;
                        CouponRedemption::query()->firstOrCreate(
                            ['order_id' => $locked->id, 'coupon_id' => $coupon->id],
                            [
                                'customer_id' => $locked->customer_id,
                                'customer_phone' => $normalizedPhone,
                                'created_at' => now(),
                            ]
                        );
                    }
                }

                $locked->update([
                    'status' => 'pending',
                    'payment_status' => 'unpaid',
                ]);
            }

            $payment = Payment::query()->create([
                'order_id' => $locked->id,
                'payment_method_id' => $targetMethod->id,
                'amount' => $locked->grand_total,
                'currency' => $locked->currency,
                'status' => 'pending',
            ]);

            $this->audit->log('payment.retry_initiated', 'Order', $locked->id, null, [
                'order_number' => $locked->order_number,
                'payment_id' => $payment->id,
                'payment_method_id' => $targetMethod->id,
                'driver' => $targetMethod->driver,
                'was_cancelled' => $canRetryCancelled,
            ]);

            return $payment;
        });
    }

    public function returnOrder(Order $order): Order
    {
        return $this->transitionStatus($order, 'returned');
    }

    private function handleCancellation(Order $locked): void
    {
        $this->restoreOrderStock($locked, 'release', "Released from cancelled order {$locked->order_number}");
        $this->releaseCoupon($locked);

        if ($locked->payment_status === 'paid' && $this->isOnlineGateway($locked)) {
            $locked->payment_status = 'refund_pending';
            $this->audit->log('order.refund_pending', 'Order', $locked->id, null, [
                'reason' => 'Paid online order cancelled',
                'grand_total' => $locked->grand_total,
                'currency' => $locked->currency,
            ]);
            $this->scheduleAutoRefundAfterCommit($locked);
        }
    }

    private function releaseCoupon(Order $locked): void
    {
        if (! $locked->coupon_id) {
            return;
        }

        CouponRedemption::query()->where('order_id', $locked->id)->delete();

        $coupon = Coupon::query()->whereKey($locked->coupon_id)->lockForUpdate()->first();
        if ($coupon && $coupon->used_count > 0) {
            $coupon->decrement('used_count');
        }
    }

    private function isOnlineGateway(Order $order): bool
    {
        return in_array($order->paymentMethod?->driver, ['fawry', 'myfatoorah', 'paymob', 'kashier'], true);
    }

    private function scheduleAutoRefundAfterCommit(Order $order): void
    {
        $method = $order->paymentMethod;
        if (! $method || empty($method->config['auto_refund'])) {
            return;
        }

        $orderId = $order->id;
        DB::afterCommit(function () use ($orderId): void {
            $fresh = Order::query()->with(['paymentMethod', 'payments'])->find($orderId);
            if (! $fresh || ! $fresh->paymentMethod || $fresh->payment_status !== 'refund_pending') {
                return;
            }

            $gateway = $this->gatewayManager->resolve($fresh->paymentMethod);
            if (! $gateway) {
                return;
            }

            $result = $gateway->refund($fresh, $fresh->paymentMethod, (string) $fresh->grand_total, "Cancelled order {$fresh->order_number}");
            if ($result['success']) {
                DB::transaction(function () use ($fresh, $result): void {
                    $locked = Order::query()->with('payments')->lockForUpdate()->find($fresh->id);
                    if (! $locked || $locked->payment_status !== 'refund_pending') {
                        return;
                    }
                    $locked->update(['payment_status' => 'refunded']);
                    foreach ($locked->payments as $payment) {
                        if ($payment->status === 'completed') {
                            $payment->update(['status' => 'refunded']);
                        }
                    }
                    $this->audit->log('order.refunded', 'Order', $locked->id, null, [
                        'refund_id' => $result['refund_id'] ?? null,
                    ]);
                });
            }
        });
    }

    private function handleRefund(Order $locked, bool $restockOnRefund): void
    {
        // Only restock if it wasn't already returned or cancelled
        if ($restockOnRefund && ! in_array($locked->status, ['returned', 'cancelled'], true)) {
            $this->restoreOrderStock($locked, 'return', "Restocked on refund of order {$locked->order_number}");
        }

        if ($locked->payment_status === 'paid' && $this->isOnlineGateway($locked) && ! empty($locked->paymentMethod?->config['auto_refund'])) {
            $locked->payment_status = 'refund_pending';
            $this->audit->log('order.refund_pending', 'Order', $locked->id, null, [
                'reason' => 'Online refund initiated',
                'grand_total' => $locked->grand_total,
            ]);
            $this->scheduleAutoRefundAfterCommit($locked);

            return;
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

            return Money::normalize((string) ($sale?->amount ?? $reg->amount));
        }

        $tier = $product->prices
            ->where('min_quantity', '<=', $qty)
            ->sortByDesc('min_quantity')
            ->first();

        if ($tier) {
            return Money::normalize((string) $tier->amount);
        }

        $first = $product->prices->first();

        return $first ? Money::normalize((string) $first->amount) : '0.0000';
    }
}
