<?php

use App\Models\Order;
use App\Models\PaymentMethod;
use App\Models\PriceType;
use App\Models\Product;
use App\Models\ProductPrice;
use App\Services\OrderService;
use Database\Seeders\RbacSeeder;
use Database\Seeders\SettingsSeeder;
use Illuminate\Support\Facades\Http;

beforeEach(function () {
    $this->seed([RbacSeeder::class, SettingsSeeder::class]);
});

$allStatuses = array_keys(OrderService::ALLOWED_TRANSITIONS);
$transitionPairs = [];
foreach ($allStatuses as $from) {
    foreach ($allStatuses as $to) {
        if ($from === $to) {
            continue;
        }
        $allowed = in_array($to, OrderService::ALLOWED_TRANSITIONS[$from], true);
        $transitionPairs["{$from} -> {$to}"] = [$from, $to, $allowed];
    }
}

it('enforces the exact 8x8 order status transition state machine', function (string $from, string $to, bool $allowed) {
    $cod = PaymentMethod::query()->where('code', 'cod')->firstOrFail();
    $order = Order::factory()->create([
        'status' => $from,
        'payment_status' => $from === 'delivered' ? 'paid' : 'unpaid',
        'payment_method_id' => $cod->id,
    ]);

    /** @var OrderService $service */
    $service = app(OrderService::class);

    if ($allowed) {
        $updated = $service->transitionStatus($order, $to);
        expect($updated->status)->toBe($to);
    } else {
        expect(fn () => $service->transitionStatus($order, $to))
            ->toThrow(RuntimeException::class);
    }
})->with($transitionPairs);

it('auto-marks COD and cash orders as paid upon delivery', function (string $code) {
    $pm = PaymentMethod::query()->where('code', $code)->firstOrFail();
    $order = Order::factory()->create([
        'status' => 'shipped',
        'payment_status' => 'unpaid',
        'payment_method_id' => $pm->id,
    ]);

    /** @var OrderService $service */
    $service = app(OrderService::class);
    $delivered = $service->transitionStatus($order, 'delivered');

    expect($delivered->status)->toBe('delivered');
    expect($delivered->payment_status)->toBe('paid');
})->with(['cod', 'cash']);

it('completes end-to-end checkout journeys for offline and online payment drivers', function (string $driver) {
    Http::fake([
        'https://atfawry.fawrystaging.com/ECommerceWeb/Fawry/payments/charge' => Http::response([
            'statusCode' => 200,
            'referenceNumber' => '99112233',
            'fawryRefNumber' => 'FWR-E2E',
        ]),
        'https://apitest.myfatoorah.com/v2/SendPayment' => Http::response([
            'IsSuccess' => true,
            'Data' => ['InvoiceId' => 555666, 'InvoiceURL' => 'https://demo.myfatoorah.com/pay/555666'],
        ]),
    ])->preventStrayRequests();

    $pm = PaymentMethod::query()->where('driver', $driver)->firstOrFail();
    if ($driver === 'fawry') {
        $pm->update(['is_active' => true, 'config' => ['sandbox' => true, 'merchant_code' => 'M1', 'security_key' => 'K1']]);
    } elseif ($driver === 'myfatoorah') {
        $pm->update(['is_active' => true, 'config' => ['sandbox' => true, 'country' => 'EGY', 'api_key' => 'KEY1']]);
    }

    $regular = PriceType::query()->where('slug', 'regular')->firstOrFail();
    $product = Product::factory()->create(['stock_quantity' => 10]);
    ProductPrice::query()->create([
        'product_id' => $product->id,
        'price_type_id' => $regular->id,
        'amount' => '150.0000',
        'currency' => 'EGP',
        'min_quantity' => 1,
    ]);

    $this->post('/cart/add', ['product_id' => $product->id, 'quantity' => 2])->assertRedirect();

    $response = $this->post('/checkout', [
        'customer_name' => 'E2E Buyer',
        'customer_phone' => '01012345678',
        'shipping_address' => ['city' => 'Cairo', 'street' => '10 Tahrir Sq'],
        'payment_method_id' => $pm->id,
    ]);

    expect($response->getStatusCode())->toBeIn([302, 409]);
    expect(Order::query()->count())->toBe(1);
    expect($product->fresh()->stock_quantity)->toBe(8);
})->with(['cod', 'cash', 'bank_transfer', 'fawry', 'myfatoorah']);
