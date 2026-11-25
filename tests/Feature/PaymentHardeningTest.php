<?php

use App\Models\AuditLog;
use App\Models\Order;
use App\Models\Payment;
use App\Models\PaymentMethod;
use App\Models\PriceType;
use App\Models\Product;
use App\Models\ProductPrice;
use App\Services\OrderService;
use App\Services\Payments\FawryGateway;
use App\Services\SettingsService;
use Database\Seeders\RbacSeeder;
use Database\Seeders\SettingsSeeder;
use Illuminate\Foundation\Http\Middleware\PreventRequestForgery;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Support\Facades\Http;

beforeEach(function () {
    $this->seed([RbacSeeder::class, SettingsSeeder::class]);
});

/**
 * Helper: Laravel's PreventRequestForgery middleware skips CSRF checks when
 * $app->runningUnitTests() is true. To verify real production CSRF behavior in
 * tests, we bind a subclass that forces runningUnitTests() => false while
 * preserving $neverVerify (configured by $middleware->validateCsrfTokens).
 */
function enableRealCsrfInTest(): void
{
    $enforced = new class(app(), app('encrypter')) extends ValidateCsrfToken
    {
        protected function runningUnitTests(): bool
        {
            return false;
        }
    };

    app()->instance(PreventRequestForgery::class, $enforced);
    app()->instance(ValidateCsrfToken::class, $enforced);
}

it('enforces CSRF on normal POST routes while excluding payment callbacks', function () {
    enableRealCsrfInTest();

    $fawry = PaymentMethod::query()->where('driver', 'fawry')->firstOrFail();
    $fawry->update([
        'is_active' => true,
        'config' => ['sandbox' => true, 'merchant_code' => 'M123', 'security_key' => 'SEC456'],
    ]);

    $order = Order::query()->create([
        'order_number' => 'ORD-CSRF-1',
        'customer_name' => 'Test User',
        'customer_phone' => '01012345678',
        'payment_method_id' => $fawry->id,
        'subtotal' => '100.0000',
        'grand_total' => '100.0000',
        'currency' => 'EGP',
    ]);
    Payment::query()->create([
        'order_id' => $order->id,
        'payment_method_id' => $fawry->id,
        'amount' => '100.0000',
        'currency' => 'EGP',
        'status' => 'pending',
    ]);

    // Normal POST route without CSRF token must be rejected with 419
    $this->post('/inquiries', [
        'name' => 'Test',
        'message' => 'Hello',
    ])->assertStatus(419);

    // Gateway callback POST route without CSRF token must NOT be blocked by CSRF (419)
    $sig = hash('sha256', 'FWR-CSRFORD-CSRF-1100.00100.00PAIDPAYATFAWRY998877SEC456');
    $this->postJson('/payments/callback/fawry', [
        'fawryRefNumber' => 'FWR-CSRF',
        'merchantRefNumber' => 'ORD-CSRF-1',
        'paymentAmount' => '100.00',
        'orderAmount' => '100.00',
        'orderStatus' => 'PAID',
        'paymentMethod' => 'PAYATFAWRY',
        'paymentRefrenceCode' => '998877',
        'messageSignature' => $sig,
    ])->assertOk();
});

it('does not change order state on paymentReturn when callback verification fails', function () {
    $fawry = PaymentMethod::query()->where('driver', 'fawry')->firstOrFail();
    $fawry->update([
        'is_active' => true,
        'config' => ['sandbox' => true, 'merchant_code' => 'M123', 'security_key' => 'SEC456'],
    ]);

    $order = Order::query()->create([
        'order_number' => 'ORD-RET-1',
        'customer_name' => 'Test User',
        'customer_phone' => '01012345678',
        'payment_method_id' => $fawry->id,
        'subtotal' => '100.0000',
        'grand_total' => '100.0000',
        'currency' => 'EGP',
    ]);

    $this->get('/payments/return/fawry?order=ORD-RET-1&orderStatus=PAID&messageSignature=forged')
        ->assertRedirect();

    expect($order->fresh()->payment_status)->toBe('unpaid');
    expect($order->fresh()->status)->toBe('pending');
});

it('creates orders with currency from settings (default EGP) and snapshots it against later changes', function () {
    $regular = PriceType::query()->where('slug', 'regular')->firstOrFail();
    $cod = PaymentMethod::query()->where('code', 'cod')->firstOrFail();

    $product = Product::query()->create([
        'name' => 'Coffee Mug',
        'slug' => 'coffee-mug',
        'sku' => 'MUG-01',
        'status' => 'published',
        'visibility' => 'public',
        'stock_quantity' => 10,
        'track_inventory' => true,
    ]);
    ProductPrice::query()->create([
        'product_id' => $product->id,
        'price_type_id' => $regular->id,
        'amount' => '100.0000',
        'currency' => 'EGP',
        'min_quantity' => 1,
    ]);

    /** @var SettingsService $settings */
    $settings = app(SettingsService::class);
    expect($settings->get('currency'))->toBe('EGP');

    /** @var OrderService $orders */
    $orders = app(OrderService::class);
    $order = $orders->placeOrder(
        ['customer_name' => 'Ali', 'customer_phone' => '01012345678'],
        [['product_id' => $product->id, 'quantity' => 1]],
        $cod->id
    );

    expect($order->currency)->toBe('EGP');
    expect($order->payments()->first()->currency)->toBe('EGP');

    // Changing settings later must NOT mutate existing order's currency snapshot
    $settings->set('currency', 'SAR', 'general', 'string', true);
    expect($order->fresh()->currency)->toBe('EGP');
});

it('refuses to initiate Fawry payment when order currency is not EGP', function () {
    Http::fake()->preventStrayRequests();

    $fawry = PaymentMethod::query()->where('driver', 'fawry')->firstOrFail();
    $fawry->update([
        'is_active' => true,
        'config' => ['sandbox' => true, 'merchant_code' => 'M123', 'security_key' => 'SEC456'],
    ]);

    $order = Order::query()->create([
        'order_number' => 'ORD-USD-1',
        'customer_name' => 'Ali',
        'customer_phone' => '01012345678',
        'payment_method_id' => $fawry->id,
        'subtotal' => '100.0000',
        'grand_total' => '100.0000',
        'currency' => 'USD',
    ]);

    /** @var FawryGateway $gateway */
    $gateway = app(FawryGateway::class);
    $result = $gateway->initiate($order, $fawry, 'http://localhost/return', 'http://localhost/callback');

    expect($result['success'])->toBeFalse();
    expect($result['error'])->toContain('EGP');
});

function makeFawryOrderWithPayment(string $orderNumber, string $grandTotal = '150.0000', string $status = 'pending', string $paymentStatus = 'unpaid', string $currency = 'EGP'): array
{
    $fawry = PaymentMethod::query()->where('driver', 'fawry')->firstOrFail();
    $fawry->update([
        'is_active' => true,
        'config' => ['sandbox' => true, 'merchant_code' => 'M123', 'security_key' => 'SEC456'],
    ]);

    $order = Order::query()->create([
        'order_number' => $orderNumber,
        'customer_name' => 'Mona',
        'customer_phone' => '01099999999',
        'payment_method_id' => $fawry->id,
        'status' => $status,
        'payment_status' => $paymentStatus,
        'subtotal' => $grandTotal,
        'grand_total' => $grandTotal,
        'currency' => $currency,
    ]);
    $payment = Payment::query()->create([
        'order_id' => $order->id,
        'payment_method_id' => $fawry->id,
        'amount' => $grandTotal,
        'currency' => $currency,
        'status' => $paymentStatus === 'paid' ? 'completed' : 'pending',
    ]);

    return [$fawry, $order, $payment];
}

function fawryCallbackPayload(string $orderNumber, string $paymentAmount, string $orderAmount, string $orderStatus = 'PAID'): array
{
    $sig = hash('sha256', "FWR-123{$orderNumber}{$paymentAmount}{$orderAmount}{$orderStatus}PAYATFAWRY998877SEC456");

    return [
        'fawryRefNumber' => 'FWR-123',
        'merchantRefNumber' => $orderNumber,
        'paymentAmount' => $paymentAmount,
        'orderAmount' => $orderAmount,
        'orderStatus' => $orderStatus,
        'paymentMethod' => 'PAYATFAWRY',
        'paymentRefrenceCode' => '998877',
        'messageSignature' => $sig,
    ];
}

it('rejects underpaid Fawry callback, sets amount_mismatch, and writes audit log', function () {
    [, $order, $payment] = makeFawryOrderWithPayment('ORD-UNDER-1', '150.0000');

    $this->postJson('/payments/callback/fawry', fawryCallbackPayload('ORD-UNDER-1', '100.00', '100.00', 'PAID'))
        ->assertOk();

    expect($order->fresh()->payment_status)->toBe('amount_mismatch');
    expect($order->fresh()->status)->toBe('pending');
    expect($payment->fresh()->status)->toBe('amount_mismatch');
    expect(AuditLog::query()->where('action', 'payment.amount_mismatch')->where('resource_id', (string) $order->id)->exists())->toBeTrue();
});

it('rejects overpaid Fawry callback and flags amount_mismatch', function () {
    [, $order, $payment] = makeFawryOrderWithPayment('ORD-OVER-1', '150.0000');

    $this->postJson('/payments/callback/fawry', fawryCallbackPayload('ORD-OVER-1', '200.00', '200.00', 'PAID'))
        ->assertOk();

    expect($order->fresh()->payment_status)->toBe('amount_mismatch');
    expect($order->fresh()->status)->toBe('pending');
    expect($payment->fresh()->status)->toBe('amount_mismatch');
});

it('rejects MyFatoorah callback with wrong currency and flags amount_mismatch', function () {
    $mf = PaymentMethod::query()->where('driver', 'myfatoorah')->firstOrFail();
    $mf->update(['is_active' => true, 'config' => ['sandbox' => true, 'country' => 'EGY', 'api_key' => 'test-key']]);

    $order = Order::query()->create([
        'order_number' => 'ORD-MF-CURR',
        'customer_name' => 'Ali',
        'customer_phone' => '01012345678',
        'payment_method_id' => $mf->id,
        'subtotal' => '200.0000',
        'grand_total' => '200.0000',
        'currency' => 'EGP',
    ]);
    $payment = Payment::query()->create([
        'order_id' => $order->id,
        'payment_method_id' => $mf->id,
        'amount' => '200.0000',
        'currency' => 'EGP',
        'status' => 'pending',
    ]);

    Http::fake([
        'https://apitest.myfatoorah.com/v2/GetPaymentStatus' => Http::response([
            'IsSuccess' => true,
            'Data' => [
                'InvoiceId' => 987654,
                'InvoiceStatus' => 'Paid',
                'CustomerReference' => 'ORD-MF-CURR',
                'InvoiceValue' => 200.00,
                'DisplayCurrencyIso' => 'USD',
            ],
        ]),
    ]);

    $this->postJson('/payments/callback/myfatoorah', ['paymentId' => '112233'])->assertOk();

    expect($order->fresh()->payment_status)->toBe('amount_mismatch');
    expect($payment->fresh()->status)->toBe('amount_mismatch');
    expect(AuditLog::query()->where('action', 'payment.amount_mismatch')->where('resource_id', (string) $order->id)->exists())->toBeTrue();
});

it('does not cancel a paid order when a late failed callback arrives', function () {
    [, $order, $payment] = makeFawryOrderWithPayment('ORD-OOO-1', '150.0000', 'confirmed', 'paid');

    $this->postJson('/payments/callback/fawry', fawryCallbackPayload('ORD-OOO-1', '150.00', '150.00', 'FAILED'))
        ->assertOk();

    expect($order->fresh()->payment_status)->toBe('paid');
    expect($order->fresh()->status)->toBe('confirmed');
    expect($payment->fresh()->status)->toBe('completed');
});

it('does not silently confirm a cancelled order when a late completed callback arrives', function () {
    [, $order, $payment] = makeFawryOrderWithPayment('ORD-OOO-2', '150.0000', 'cancelled', 'unpaid');

    $this->postJson('/payments/callback/fawry', fawryCallbackPayload('ORD-OOO-2', '150.00', '150.00', 'PAID'))
        ->assertOk();

    expect($order->fresh()->status)->toBe('cancelled');
    expect($order->fresh()->payment_status)->toBe('needs_review');
    expect($payment->fresh()->status)->toBe('needs_review');
    expect(AuditLog::query()->where('action', 'payment.completed_after_cancel')->where('resource_id', (string) $order->id)->exists())->toBeTrue();
});
