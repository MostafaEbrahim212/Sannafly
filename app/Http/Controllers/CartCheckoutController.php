<?php

namespace App\Http\Controllers;

use App\Models\Coupon;
use App\Models\Customer;
use App\Models\Order;
use App\Models\Payment;
use App\Models\PaymentMethod;
use App\Models\Product;
use App\Models\ProductVariation;
use App\Models\ShippingZone;
use App\Services\AuditLogger;
use App\Services\OrderService;
use App\Services\Payments\PaymentGatewayManager;
use App\Services\SettingsService;
use App\Support\Money;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

class CartCheckoutController extends Controller
{
    public function __construct(
        private readonly SettingsService $settings,
        private readonly OrderService $orderService,
        private readonly PaymentGatewayManager $gatewayManager,
        private readonly AuditLogger $audit,
    ) {}

    public function cart(Request $request): Response
    {
        if (! $this->settings->isEnabled('module_ecommerce') || ! $this->settings->isEnabled('module_cart')) {
            abort(404);
        }

        $cart = $request->session()->get('cart', []);
        /** @var Customer|null $customer */
        $customer = Auth::guard('customer')->user();

        $subtotal = collect($cart)->sum(fn ($item) => ((float) $item['unit_price']) * ((int) $item['quantity']));
        $couponCode = $request->session()->get('cart_coupon_code');
        $appliedCoupon = null;
        if ($couponCode) {
            $coupon = Coupon::query()->where('code', $couponCode)->first();
            if ($coupon && $coupon->isValidForAmount($subtotal) === null) {
                $appliedCoupon = [
                    'code' => $coupon->code,
                    'type' => $coupon->type,
                    'value' => (float) $coupon->value,
                    'discount_amount' => $coupon->calculateDiscount($subtotal),
                ];
            } else {
                $request->session()->forget('cart_coupon_code');
            }
        }

        return Inertia::render('Storefront/Cart', [
            'items' => array_values($cart),
            'savedAddresses' => $customer ? $customer->addresses()->get() : [],
            'paymentMethods' => PaymentMethod::query()
                ->where('is_active', true)
                ->where('is_visible', true)
                ->orderBy('sort_order')
                ->get(['id', 'name', 'name_ar', 'code', 'driver', 'description', 'description_ar', 'config'])
                ->filter(function (PaymentMethod $pm) {
                    $cfg = $pm->config ?? [];
                    if ($pm->driver === 'myfatoorah') {
                        return ! empty($cfg['api_key']);
                    }
                    if ($pm->driver === 'fawry') {
                        return ! empty($cfg['merchant_code']) && ! empty($cfg['security_key']);
                    }

                    return true;
                })
                ->map(function (PaymentMethod $pm) {
                    $cfg = $pm->config ?? [];

                    return [
                        'id' => $pm->id,
                        'name' => $pm->name,
                        'name_ar' => $pm->name_ar,
                        'code' => $pm->code,
                        'driver' => $pm->driver,
                        'description' => $pm->description,
                        'description_ar' => $pm->description_ar,
                        'public_meta' => match ($pm->driver) {
                            'bank_transfer' => [
                                'bank_name' => $cfg['bank_name'] ?? null,
                                'account_name' => $cfg['account_name'] ?? null,
                                'account_number' => $cfg['account_number'] ?? null,
                                'iban' => $cfg['iban'] ?? null,
                            ],
                            'cash' => [
                                'pickup_address' => $cfg['pickup_address'] ?? null,
                                'pickup_hours' => $cfg['pickup_hours'] ?? null,
                            ],
                            default => null,
                        },
                    ];
                })
                ->values(),
            'shippingZones' => ShippingZone::query()
                ->where('is_active', true)
                ->orderBy('sort_order')
                ->get(['id', 'name', 'name_ar', 'cities', 'rate', 'free_shipping_threshold', 'estimated_days', 'is_default']),
            'appliedCoupon' => $appliedCoupon,
            'idempotencyKey' => Str::uuid()->toString(),
        ]);
    }

    public function addToCart(Request $request): RedirectResponse
    {
        if (! $this->settings->isEnabled('module_ecommerce') || ! $this->settings->isEnabled('module_cart')) {
            abort(404);
        }

        $data = $request->validate([
            'product_id' => ['required', 'integer', 'exists:products,id'],
            'variation_id' => ['nullable', 'integer', 'exists:product_variations,id'],
            'quantity' => ['required', 'integer', 'min:1', 'max:1000'],
        ]);

        $product = Product::query()->with([
            'images' => fn ($q) => $q->whereNull('variation_id')->orderByDesc('is_main')->orderBy('sort_order'),
            'prices.priceType',
        ])->findOrFail($data['product_id']);
        $variation = ! empty($data['variation_id'])
            ? ProductVariation::query()->where('product_id', $product->id)->with(['prices.priceType', 'images'])->findOrFail($data['variation_id'])
            : null;

        $price = $variation?->prices->first()?->amount ?? $product->prices->firstWhere('priceType.slug', 'sale')?->amount ?? $product->prices->first()?->amount ?? '0.00';
        $varImg = $variation?->images->first();
        $baseImg = $product->images->firstWhere('is_main', true) ?? $product->images->first();
        $image = $varImg?->thumbnail_path ?? $varImg?->path ?? $baseImg?->thumbnail_path ?? $baseImg?->path;

        $key = $product->id.'-'.($variation?->id ?? '0');
        $cart = $request->session()->get('cart', []);

        if (isset($cart[$key])) {
            $cart[$key]['quantity'] += (int) $data['quantity'];
        } else {
            $cart[$key] = [
                'key' => $key,
                'product_id' => $product->id,
                'variation_id' => $variation?->id,
                'name' => $variation ? "{$product->name} ({$variation->name})" : $product->name,
                'sku' => $variation ? $variation->sku : $product->sku,
                'unit_price' => (float) $price,
                'quantity' => (int) $data['quantity'],
                'image' => $image,
            ];
        }

        $request->session()->put('cart', $cart);

        return back()->with('success', __('Added to cart.'));
    }

    public function removeFromCart(Request $request, string $key): RedirectResponse
    {
        $cart = $request->session()->get('cart', []);
        unset($cart[$key]);
        $request->session()->put('cart', $cart);

        return back()->with('success', __('Item removed from cart.'));
    }

    public function updateCartQuantity(Request $request, string $key): RedirectResponse
    {
        $data = $request->validate([
            'quantity' => ['required', 'integer', 'min:1', 'max:1000'],
        ]);

        $cart = $request->session()->get('cart', []);
        if (isset($cart[$key])) {
            $cart[$key]['quantity'] = (int) $data['quantity'];
            $request->session()->put('cart', $cart);
        }

        return back();
    }

    public function applyCoupon(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'code' => ['required', 'string', 'max:64'],
        ]);

        $code = strtoupper(trim($data['code']));
        $coupon = Coupon::query()->where('code', $code)->first();

        if (! $coupon) {
            return back()->with('error', __('Invalid coupon code.'));
        }

        $cart = $request->session()->get('cart', []);
        $subtotal = collect($cart)->sum(fn ($item) => ((float) $item['unit_price']) * ((int) $item['quantity']));

        if ($error = $coupon->isValidForAmount($subtotal)) {
            return back()->with('error', __($error));
        }

        $request->session()->put('cart_coupon_code', $coupon->code);

        return back()->with('success', __('Coupon :code applied!', ['code' => $coupon->code]));
    }

    public function removeCoupon(Request $request): RedirectResponse
    {
        $request->session()->forget('cart_coupon_code');

        return back()->with('success', __('Coupon removed.'));
    }

    public function checkout(Request $request): SymfonyResponse
    {
        if (! $this->settings->isEnabled('module_ecommerce') || ! $this->settings->isEnabled('module_checkout')) {
            abort(404);
        }

        $customer = Auth::guard('customer')->user();
        if (! $this->settings->isEnabled('module_guest_checkout', true) && ! $customer) {
            return redirect()->route('login')->with('error', __('Please sign in to complete your order.'));
        }

        $data = $request->validate([
            'customer_name' => ['required', 'string', 'max:150'],
            'customer_email' => ['nullable', 'email', 'max:150'],
            'customer_phone' => ['required', 'string', 'max:30'],
            'shipping_address' => ['required', 'array'],
            'shipping_address.city' => ['required', 'string', 'max:100'],
            'shipping_address.area' => ['nullable', 'string', 'max:100'],
            'shipping_address.street' => ['required', 'string', 'max:255'],
            'shipping_address.building' => ['nullable', 'string', 'max:60'],
            'shipping_address.floor' => ['nullable', 'string', 'max:30'],
            'shipping_address.apartment' => ['nullable', 'string', 'max:30'],
            'payment_method_id' => ['required', 'integer', 'exists:payment_methods,id'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'save_address' => ['nullable', 'boolean'],
            'idempotency_key' => ['nullable', 'string', 'max:100'],
        ]);

        $cart = array_values($request->session()->get('cart', []));
        $couponCode = $request->input('coupon_code') ?: $request->session()->get('cart_coupon_code');

        try {
            $order = $this->orderService->placeOrder(
                $data,
                $cart,
                (int) $data['payment_method_id'],
                $data['idempotency_key'] ?? null,
                $couponCode ?: null
            );
        } catch (\RuntimeException $e) {
            return back()->with('error', $e->getMessage());
        }

        if ($customer && ! empty($data['save_address'])) {
            $customer->addresses()->create([
                'label' => 'Checkout',
                'recipient_name' => $data['customer_name'],
                'phone' => $data['customer_phone'],
                'city' => $data['shipping_address']['city'],
                'area' => $data['shipping_address']['area'] ?? null,
                'street' => $data['shipping_address']['street'],
                'building' => $data['shipping_address']['building'] ?? null,
                'floor' => $data['shipping_address']['floor'] ?? null,
                'apartment' => $data['shipping_address']['apartment'] ?? null,
                'is_default' => ! $customer->addresses()->exists(),
            ]);
        }

        $request->session()->forget(['cart', 'cart_coupon_code']);

        $method = $order->paymentMethod;
        $gateway = $method ? $this->gatewayManager->resolve($method) : null;

        if ($gateway && $method) {
            $result = $gateway->initiate(
                $order,
                $method,
                route('payments.return', ['driver' => $method->driver, 'order' => $order->order_number]),
                route('payments.callback', ['driver' => $method->driver])
            );

            if ($result['success']) {
                $payment = $order->payments()->latest()->first();
                if ($payment) {
                    $payment->update([
                        'transaction_reference' => $result['transaction_id'] ?? $result['reference_number'] ?? null,
                        'payload' => $result['raw'] ?? null,
                    ]);
                }

                if (! empty($result['redirect_url'])) {
                    return Inertia::location($result['redirect_url']);
                }

                return redirect()->route('orders.confirmation', $order->order_number)
                    ->with('success', $result['reference_number']
                        ? __('Order placed! Fawry Reference: :ref', ['ref' => $result['reference_number']])
                        : __('Order placed!'));
            }

            return redirect()->route('orders.confirmation', $order->order_number)
                ->with('error', $result['error'] ?? __('Online payment could not be initiated.'));
        }

        return redirect()->route('orders.confirmation', $order->order_number)->with('success', __('Order placed successfully!'));
    }

    public function paymentReturn(Request $request, string $driver): RedirectResponse
    {
        $method = PaymentMethod::query()->where('driver', $driver)->firstOrFail();
        $gateway = $this->gatewayManager->resolve($method);

        if ($gateway) {
            $verified = $gateway->verifyCallback($request->all(), $method);
            if ($verified['verified'] && ! empty($verified['order_number'])) {
                $outcome = $this->applyPaymentOutcome(
                    $verified['order_number'],
                    $verified['status'],
                    $verified['transaction_id'] ?? null,
                    $verified['amount'] ?? null,
                    $verified['currency'] ?? null,
                    $verified['raw'] ?? []
                );

                $isConfirmed = $outcome === 'paid';

                return redirect()->route('orders.confirmation', $verified['order_number'])
                    ->with($isConfirmed ? 'success' : 'error',
                        $isConfirmed ? __('Payment confirmed!') : __('Payment was not completed.'));
            }
        }

        $orderNumber = $request->string('order')->toString();

        return $orderNumber
            ? redirect()->route('orders.confirmation', $orderNumber)
            : redirect('/');
    }

    public function paymentCallback(Request $request, string $driver): JsonResponse
    {
        $method = PaymentMethod::query()->where('driver', $driver)->firstOrFail();
        $gateway = $this->gatewayManager->resolve($method);

        if (! $gateway) {
            return response()->json(['status' => 'ignored'], 400);
        }

        $verified = $gateway->verifyCallback($request->all(), $method);
        if (! $verified['verified'] || empty($verified['order_number'])) {
            return response()->json(['status' => 'invalid_signature'], 403);
        }

        $outcome = $this->applyPaymentOutcome(
            $verified['order_number'],
            $verified['status'],
            $verified['transaction_id'] ?? null,
            $verified['amount'] ?? null,
            $verified['currency'] ?? null,
            $verified['raw'] ?? []
        );

        // Return 200 even on terminal mismatches/out-of-order callbacks to stop gateways from endlessly retrying.
        return response()->json(['status' => $outcome === 'amount_mismatch' || $outcome === 'needs_review' ? 'flagged_for_review' : 'ok']);
    }

    public function confirmation(string $orderNumber): Response
    {
        $order = Order::query()
            ->where('order_number', $orderNumber)
            ->with(['items', 'paymentMethod:id,name,name_ar,driver,config', 'payments'])
            ->firstOrFail();

        $cfg = $order->paymentMethod?->config ?? [];
        $paymentMeta = match ($order->paymentMethod?->driver) {
            'bank_transfer' => [
                'bank_name' => $cfg['bank_name'] ?? null,
                'account_name' => $cfg['account_name'] ?? null,
                'account_number' => $cfg['account_number'] ?? null,
                'iban' => $cfg['iban'] ?? null,
            ],
            'cash' => [
                'pickup_address' => $cfg['pickup_address'] ?? null,
                'pickup_hours' => $cfg['pickup_hours'] ?? null,
            ],
            default => null,
        };

        if ($order->paymentMethod) {
            $order->paymentMethod->makeHidden('config');
        }

        return Inertia::render('Storefront/OrderConfirmation', [
            'order' => $order,
            'paymentMeta' => $paymentMeta,
        ]);
    }

    public function trackOrder(Request $request): Response
    {
        $order = null;
        $notFound = false;

        if ($request->filled('order_number') && $request->filled('phone')) {
            $orderNumber = trim($request->string('order_number')->toString());
            $phone = preg_replace('/\s+/', '', $request->string('phone')->toString());

            $order = Order::query()
                ->where('order_number', $orderNumber)
                ->with(['items', 'paymentMethod:id,name,name_ar'])
                ->first();

            if ($order) {
                $storedPhone = preg_replace('/\s+/', '', (string) $order->customer_phone);
                if ($storedPhone !== $phone) {
                    $order = null;
                }
            }

            if (! $order) {
                $notFound = true;
            }
        }

        return Inertia::render('Storefront/TrackOrder', [
            'order' => $order,
            'notFound' => $notFound,
            'filters' => (object) $request->only(['order_number', 'phone']),
        ]);
    }

    private function applyPaymentOutcome(
        string $orderNumber,
        string $status,
        ?string $transactionId,
        ?string $paidAmount,
        ?string $paidCurrency,
        array $raw
    ): string {
        return DB::transaction(function () use ($orderNumber, $status, $transactionId, $paidAmount, $paidCurrency, $raw): string {
            $order = Order::query()->where('order_number', $orderNumber)->lockForUpdate()->first();
            if (! $order) {
                return 'ignored';
            }

            /** @var Payment|null $payment */
            $payment = $order->payments()->latest()->lockForUpdate()->first();
            if (($payment && $payment->status === 'completed') || $order->payment_status === 'paid') {
                // Out-of-order failed callback after payment already completed must NEVER cancel or unpay.
                if ($status === 'failed') {
                    $this->audit->log('payment.out_of_order_ignored', 'Order', $order->id, null, [
                        'incoming_status' => $status,
                        'transaction_reference' => $transactionId,
                    ]);
                }

                return 'paid';
            }

            if ($status === 'completed') {
                $expectedAmount = Money::toGateway((string) $order->grand_total);
                $receivedAmount = $paidAmount !== null ? Money::toGateway($paidAmount) : null;
                $expectedCurrency = strtoupper((string) $order->currency);
                $receivedCurrency = $paidCurrency !== null ? strtoupper(trim($paidCurrency)) : null;

                $amountMatches = $receivedAmount !== null && bccomp($receivedAmount, $expectedAmount, Money::GATEWAY_SCALE) === 0;
                $currencyMatches = $receivedCurrency !== null && $receivedCurrency === $expectedCurrency;

                if (! $amountMatches || ! $currencyMatches) {
                    if ($payment) {
                        $payment->update([
                            'status' => 'amount_mismatch',
                            'transaction_reference' => $transactionId ?: $payment->transaction_reference,
                            'payload' => $raw,
                        ]);
                    }
                    $order->update(['payment_status' => 'amount_mismatch']);

                    $this->audit->log('payment.amount_mismatch', 'Order', $order->id, null, [
                        'expected_amount' => $expectedAmount,
                        'received_amount' => $receivedAmount,
                        'expected_currency' => $expectedCurrency,
                        'received_currency' => $receivedCurrency,
                        'transaction_reference' => $transactionId,
                    ]);

                    return 'amount_mismatch';
                }

                if ($order->status === 'cancelled') {
                    if ($payment) {
                        $payment->update([
                            'status' => 'needs_review',
                            'transaction_reference' => $transactionId ?: $payment->transaction_reference,
                            'payload' => $raw,
                        ]);
                    }
                    $order->update(['payment_status' => 'needs_review']);

                    $this->audit->log('payment.completed_after_cancel', 'Order', $order->id, null, [
                        'transaction_reference' => $transactionId,
                        'amount' => $receivedAmount,
                        'currency' => $receivedCurrency,
                    ]);

                    return 'needs_review';
                }
            }

            if ($payment) {
                $payment->update([
                    'status' => $status,
                    'transaction_reference' => $transactionId ?: $payment->transaction_reference,
                    'payload' => $raw,
                    'paid_at' => $status === 'completed' ? now() : null,
                ]);
            }

            if ($status === 'completed') {
                $order->update([
                    'payment_status' => 'paid',
                    'status' => $order->status === 'pending' ? 'confirmed' : $order->status,
                ]);
            } elseif ($status === 'failed') {
                $order->update(['payment_status' => 'failed']);
                if ($order->status === 'pending') {
                    $this->orderService->cancelOrder($order);
                }
            }

            $this->audit->log('payment.callback_'.$status, 'Order', $order->id, null, [
                'transaction_reference' => $transactionId,
            ]);

            return $status === 'completed' ? 'paid' : $status;
        });
    }
}
