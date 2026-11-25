<?php

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
