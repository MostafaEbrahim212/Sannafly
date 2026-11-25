<?php

use App\Models\Order;
use App\Models\Payment;
use App\Models\PaymentMethod;
use App\Services\Payments\FawryGateway;
use App\Services\Payments\MyFatoorahGateway;
use App\Services\Payments\PaymentGatewayManager;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;

uses(RefreshDatabase::class);

it('resolves supported drivers and rejects unknown payment drivers', function () {
    /** @var PaymentGatewayManager $manager */
    $manager = app(PaymentGatewayManager::class);

    expect($manager->resolve(new PaymentMethod(['driver' => 'fawry'])))->toBeInstanceOf(FawryGateway::class);
    expect($manager->resolve(new PaymentMethod(['driver' => 'myfatoorah'])))->toBeInstanceOf(MyFatoorahGateway::class);
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
