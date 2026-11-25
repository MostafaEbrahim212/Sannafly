<?php

use App\Models\Order;
use App\Models\Payment;
use App\Models\PaymentMethod;
use App\Models\User;
use App\Services\Payments\FawryGateway;
use App\Services\Payments\MyFatoorahGateway;
use Database\Seeders\RbacSeeder;
use Database\Seeders\SettingsSeeder;
use Illuminate\Support\Facades\Http;

beforeEach(function () {
    $this->seed([RbacSeeder::class, SettingsSeeder::class]);
    $this->admin = User::query()->where('email', 'admin@catalogflow.test')->firstOrFail();
});

it('seeds myfatoorah and fawry with sandbox enabled and never exposes secrets to frontend', function () {
    $mf = PaymentMethod::query()->where('driver', 'myfatoorah')->firstOrFail();
    $fawry = PaymentMethod::query()->where('driver', 'fawry')->firstOrFail();

    expect($mf->config['sandbox'])->toBeTrue();
    expect($fawry->config['sandbox'])->toBeTrue();

    $this->actingAs($this->admin)->put("/admin/payment-methods/{$mf->id}", [
        'name' => $mf->name,
        'sandbox' => true,
        'country' => 'EGY',
        'api_key' => 'super-secret-mf-token',
        'is_active' => true,
    ])->assertRedirect();

    $response = $this->actingAs($this->admin)->get('/admin/payment-methods');
    $response->assertOk();
    expect($response->getContent())->not->toContain('super-secret-mf-token');
});

it('initiates and verifies myfatoorah sandbox payment', function () {
    Http::fake([
        'https://apitest.myfatoorah.com/v2/SendPayment' => Http::response([
            'IsSuccess' => true,
            'Data' => ['InvoiceId' => 987654, 'InvoiceURL' => 'https://demo.myfatoorah.com/pay/987654'],
        ]),
        'https://apitest.myfatoorah.com/v2/GetPaymentStatus' => Http::response([
            'IsSuccess' => true,
            'Data' => ['InvoiceId' => 987654, 'InvoiceStatus' => 'Paid', 'CustomerReference' => 'ORD-MF-1'],
        ]),
    ]);

    $mf = PaymentMethod::query()->where('driver', 'myfatoorah')->firstOrFail();
    $mf->update(['is_active' => true, 'config' => ['sandbox' => true, 'country' => 'EGY', 'api_key' => 'test-key']]);

    $order = Order::query()->create([
        'order_number' => 'ORD-MF-1',
        'customer_name' => 'Ali',
        'customer_phone' => '01012345678',
        'payment_method_id' => $mf->id,
        'subtotal' => '200.0000',
        'grand_total' => '200.0000',
        'currency' => 'EGP',
    ]);

    /** @var MyFatoorahGateway $gateway */
    $gateway = app(MyFatoorahGateway::class);
    $init = $gateway->initiate($order, $mf, 'http://localhost/return', 'http://localhost/callback');
    expect($init['success'])->toBeTrue();
    expect($init['redirect_url'])->toBe('https://demo.myfatoorah.com/pay/987654');

    $verify = $gateway->verifyCallback(['paymentId' => '112233'], $mf);
    expect($verify['verified'])->toBeTrue();
    expect($verify['status'])->toBe('completed');
    expect($verify['order_number'])->toBe('ORD-MF-1');
});

it('verifies fawry callback signature and handles duplicate callbacks idempotently', function () {
    Http::fake([
        'https://atfawry.fawrystaging.com/ECommerceWeb/Fawry/payments/charge' => Http::response([
            'statusCode' => 200,
            'referenceNumber' => '9988776655',
            'fawryRefNumber' => 'FWR-123',
        ]),
    ]);

    $fawry = PaymentMethod::query()->where('driver', 'fawry')->firstOrFail();
    $fawry->update([
        'is_active' => true,
        'config' => ['sandbox' => true, 'merchant_code' => 'M123', 'security_key' => 'SEC456'],
    ]);

    $order = Order::query()->create([
        'order_number' => 'ORD-FWR-1',
        'customer_name' => 'Mona',
        'customer_phone' => '01099999999',
        'payment_method_id' => $fawry->id,
        'subtotal' => '150.0000',
        'grand_total' => '150.0000',
        'currency' => 'EGP',
    ]);
    Payment::query()->create([
        'order_id' => $order->id,
        'payment_method_id' => $fawry->id,
        'amount' => '150.0000',
        'currency' => 'EGP',
        'status' => 'pending',
    ]);

    /** @var FawryGateway $gateway */
    $gateway = app(FawryGateway::class);
    $init = $gateway->initiate($order, $fawry, 'http://localhost/return', 'http://localhost/callback');
    expect($init['success'])->toBeTrue();
    expect($init['reference_number'])->toBe('9988776655');

    $sig = hash('sha256', 'FWR-123ORD-FWR-1150.00150.00PAIDPAYATFAWRY9988776655SEC456');
    $payload = [
        'fawryRefNumber' => 'FWR-123',
        'merchantRefNumber' => 'ORD-FWR-1',
        'paymentAmount' => '150.00',
        'orderAmount' => '150.00',
        'orderStatus' => 'PAID',
        'paymentMethod' => 'PAYATFAWRY',
        'paymentRefrenceCode' => '9988776655',
        'messageSignature' => $sig,
    ];

    $this->postJson('/payments/callback/fawry', $payload)->assertOk();
    expect($order->fresh()->payment_status)->toBe('paid');

    // Duplicate callback should be idempotent
    $this->postJson('/payments/callback/fawry', $payload)->assertOk();
    expect($order->fresh()->payment_status)->toBe('paid');

    // Invalid signature must be rejected
    $this->postJson('/payments/callback/fawry', [...$payload, 'messageSignature' => 'bad'])->assertForbidden();
});
