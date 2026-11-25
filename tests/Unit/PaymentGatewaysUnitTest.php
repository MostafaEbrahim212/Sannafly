<?php

use App\Models\Order;
use App\Models\Payment;
use App\Models\PaymentMethod;
use App\Services\Payments\FawryGateway;
use App\Services\Payments\KashierGateway;
use App\Services\Payments\MyFatoorahGateway;
use App\Services\Payments\PaymentGatewayManager;
use App\Services\Payments\PaymobGateway;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;

uses(RefreshDatabase::class);

it('resolves supported drivers and rejects unknown payment drivers', function () {
    /** @var PaymentGatewayManager $manager */
    $manager = app(PaymentGatewayManager::class);

    expect($manager->resolve(new PaymentMethod(['driver' => 'fawry'])))->toBeInstanceOf(FawryGateway::class);
    expect($manager->resolve(new PaymentMethod(['driver' => 'myfatoorah'])))->toBeInstanceOf(MyFatoorahGateway::class);
    expect($manager->resolve(new PaymentMethod(['driver' => 'paymob'])))->toBeInstanceOf(PaymobGateway::class);
    expect($manager->resolve(new PaymentMethod(['driver' => 'kashier'])))->toBeInstanceOf(KashierGateway::class);
    expect($manager->resolve(new PaymentMethod(['driver' => 'cod'])))->toBeNull();
    expect(fn () => $manager->resolve(new PaymentMethod(['driver' => 'crypto'])))->toThrow(InvalidArgumentException::class);
});

it('handles Fawry initiation errors, 5xx responses, and refund feature flag', function () {
    Http::fake([
        'https://atfawry.fawrystaging.com/ECommerceWeb/Fawry/payments/charge' => Http::response(['statusDescription' => 'Server error'], 500),
        'https://atfawry.fawrystaging.com/ECommerceWeb/Fawry/payments/refund' => Http::response(['statusCode' => 200, 'fawryRefNumber' => 'REF-1']),
    ])->preventStrayRequests();

    $fawry = PaymentMethod::factory()->create([
        'driver' => 'fawry',
        'config' => ['sandbox' => true, 'merchant_code' => 'M1', 'security_key' => 'K1', 'auto_refund' => false],
    ]);
    $order = Order::factory()->create(['payment_method_id' => $fawry->id, 'currency' => 'EGP', 'grand_total' => '100.0000']);
    Payment::query()->create([
        'order_id' => $order->id,
        'payment_method_id' => $fawry->id,
        'transaction_reference' => 'FWR-99',
        'amount' => '100.0000',
        'currency' => 'EGP',
        'status' => 'completed',
    ]);

    /** @var FawryGateway $gateway */
    $gateway = app(FawryGateway::class);
    $init = $gateway->initiate($order, $fawry, 'http://localhost/r', 'http://localhost/c');
    expect($init['success'])->toBeFalse();

    $refundDisabled = $gateway->refund($order, $fawry, '100.0000');
    expect($refundDisabled['success'])->toBeFalse();

    $fawry->update(['config' => ['sandbox' => true, 'merchant_code' => 'M1', 'security_key' => 'K1', 'auto_refund' => true]]);
    $refundEnabled = $gateway->refund($order, $fawry, '100.0000');
    expect($refundEnabled['success'])->toBeTrue();
    expect($refundEnabled['refund_id'])->toBe('REF-1');
});

it('handles MyFatoorah malformed JSON, missing credentials, and refund API', function () {
    Http::fake([
        'https://apitest.myfatoorah.com/v2/GetPaymentStatus' => Http::response('not-json', 502),
        'https://apitest.myfatoorah.com/v2/MakeRefund' => Http::response(['IsSuccess' => true, 'Data' => ['RefundId' => 777]]),
    ])->preventStrayRequests();

    $mf = PaymentMethod::factory()->create([
        'driver' => 'myfatoorah',
        'config' => ['sandbox' => true, 'country' => 'EGY', 'api_key' => 'key-1', 'auto_refund' => true],
    ]);
    $order = Order::factory()->create(['payment_method_id' => $mf->id, 'currency' => 'EGP', 'grand_total' => '100.0000']);
    Payment::query()->create([
        'order_id' => $order->id,
        'payment_method_id' => $mf->id,
        'transaction_reference' => 'INV-55',
        'amount' => '100.0000',
        'currency' => 'EGP',
        'status' => 'completed',
    ]);

    /** @var MyFatoorahGateway $gateway */
    $gateway = app(MyFatoorahGateway::class);
    $verify = $gateway->verifyCallback(['paymentId' => '123'], $mf);
    expect($verify['verified'])->toBeFalse();

    $refund = $gateway->refund($order, $mf, '100.0000');
    expect($refund['success'])->toBeTrue();
    expect($refund['refund_id'])->toBe('777');
});

it('initiates and verifies Paymob payment and HMAC callback', function () {
    Http::fake([
        'https://accept.paymob.com/api/auth/tokens' => Http::response(['token' => 'auth-tok-1']),
        'https://accept.paymob.com/api/ecommerce/orders' => Http::response(['id' => 889900]),
        'https://accept.paymob.com/api/acceptance/payment_keys' => Http::response(['token' => 'pay-tok-2']),
    ])->preventStrayRequests();

    $paymob = PaymentMethod::factory()->create([
        'driver' => 'paymob',
        'config' => ['sandbox' => true, 'api_key' => 'pm-key', 'integration_id' => '12345', 'iframe_id' => '67890', 'hmac_secret' => 'hmac-sec'],
    ]);
    $order = Order::factory()->create(['order_number' => 'ORD-PM-1', 'payment_method_id' => $paymob->id, 'currency' => 'EGP', 'grand_total' => '250.0000']);

    /** @var PaymobGateway $gateway */
    $gateway = app(PaymobGateway::class);
    $init = $gateway->initiate($order, $paymob, 'http://localhost/r', 'http://localhost/c');
    expect($init['success'])->toBeTrue();
    expect($init['redirect_url'])->toBe('https://accept.paymob.com/api/acceptance/iframes/67890?payment_token=pay-tok-2');

    $obj = [
        'amount_cents' => 25000,
        'created_at' => '2026-11-25T18:00:00',
        'currency' => 'EGP',
        'error_occured' => false,
        'has_parent_transaction' => false,
        'id' => 9911,
        'integration_id' => 12345,
        'is_3d_secure' => true,
        'is_auth' => false,
        'is_capture' => false,
        'is_refunded' => false,
        'is_standalone_payment' => true,
        'is_voided' => false,
        'order' => ['id' => 889900, 'merchant_order_id' => 'ORD-PM-1'],
        'owner' => 1,
        'pending' => false,
        'source_data' => ['pan' => '2346', 'sub_type' => 'MasterCard', 'type' => 'card'],
        'success' => true,
    ];
    $concat = '25000'.'2026-11-25T18:00:00'.'EGP'.'false'.'false'.'9911'.'12345'.'true'.'false'.'false'.'false'.'true'.'false'.'889900'.'1'.'false'.'2346'.'MasterCard'.'card'.'true';
    $hmac = hash_hmac('sha512', $concat, 'hmac-sec');

    $verify = $gateway->verifyCallback(['obj' => $obj, 'hmac' => $hmac], $paymob);
    expect($verify['verified'])->toBeTrue();
    expect($verify['status'])->toBe('completed');
    expect($verify['amount'])->toBe('250.00');
    expect($verify['currency'])->toBe('EGP');
    expect($verify['order_number'])->toBe('ORD-PM-1');

    $bad = $gateway->verifyCallback(['obj' => $obj, 'hmac' => 'forged'], $paymob);
    expect($bad['verified'])->toBeFalse();
});

it('initiates and verifies Kashier payment and signature callback', function () {
    $kashier = PaymentMethod::factory()->create([
        'driver' => 'kashier',
        'config' => ['sandbox' => true, 'merchant_id' => 'MID-123', 'api_key' => 'kashier-sec'],
    ]);
    $order = Order::factory()->create(['order_number' => 'ORD-KSH-1', 'payment_method_id' => $kashier->id, 'currency' => 'EGP', 'grand_total' => '300.0000']);

    /** @var KashierGateway $gateway */
    $gateway = app(KashierGateway::class);
    $init = $gateway->initiate($order, $kashier, 'http://localhost/payments/return/kashier', 'http://localhost/payments/callback/kashier');
    expect($init['success'])->toBeTrue();
    expect($init['redirect_url'])->toContain('https://payments.kashier.io/?');
    expect($init['redirect_url'])->toContain('merchantId=MID-123');

    $params = [
        'paymentStatus' => 'SUCCESS',
        'merchantOrderId' => 'ORD-KSH-1',
        'transactionId' => 'TX-55',
        'amount' => '300.00',
        'currency' => 'EGP',
    ];
    $qs = 'paymentStatus=SUCCESS&merchantOrderId=ORD-KSH-1&transactionId=TX-55&amount=300.00&currency=EGP';
    $params['signature'] = hash_hmac('sha256', $qs, 'kashier-sec', false);

    $verify = $gateway->verifyCallback($params, $kashier);
    expect($verify['verified'])->toBeTrue();
    expect($verify['status'])->toBe('completed');
    expect($verify['amount'])->toBe('300.00');
    expect($verify['currency'])->toBe('EGP');

    $bad = $gateway->verifyCallback([...$params, 'signature' => 'bad'], $kashier);
    expect($bad['verified'])->toBeFalse();
});
