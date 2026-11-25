<?php

use App\Models\Coupon;
use App\Models\ShippingZone;
use App\Services\ShippingService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

afterEach(function () {
    Carbon::setTestNow();
});

it('validates every branch of Coupon::isValidForAmount', function () {
    Carbon::setTestNow('2026-11-25 12:00:00');

    $inactive = new Coupon(['is_active' => false]);
    expect($inactive->isValidForAmount('100'))->toBe('This coupon is currently inactive.');

    $notStarted = new Coupon(['is_active' => true, 'starts_at' => now()->addDay()]);
    expect($notStarted->isValidForAmount('100'))->toBe('This coupon is not active yet.');

    $expired = new Coupon(['is_active' => true, 'expires_at' => now()->subMinute()]);
    expect($expired->isValidForAmount('100'))->toBe('This coupon has expired.');

    $limitReached = new Coupon(['is_active' => true, 'usage_limit' => 5, 'used_count' => 5]);
    expect($limitReached->isValidForAmount('100'))->toBe('This coupon has reached its usage limit.');

    $belowMin = new Coupon(['is_active' => true, 'min_order_amount' => '200.0000']);
    expect($belowMin->isValidForAmount('199.9900'))->toContain('200.00');

    $valid = new Coupon(['is_active' => true, 'min_order_amount' => '200.0000', 'usage_limit' => 5, 'used_count' => 4]);
    expect($valid->isValidForAmount('200.0000'))->toBeNull();
});

it('calculates fixed, percent, capped, and zero/exceeding discounts accurately', function () {
    $zeroSub = new Coupon(['type' => 'fixed', 'value' => '20.0000']);
    expect($zeroSub->calculateDiscount('0'))->toBe('0.0000');

    $fixedExceeds = new Coupon(['type' => 'fixed', 'value' => '150.0000']);
    expect($fixedExceeds->calculateDiscount('100.0000'))->toBe('100.0000');

    $percentCapped = new Coupon(['type' => 'percent', 'value' => '50.0000', 'max_discount_amount' => '30.0000']);
    expect($percentCapped->calculateDiscount('100.0000'))->toBe('30.0000');
});

it('matches shipping zones by English/Arabic city names and applies free-shipping threshold', function () {
    $cairo = ShippingZone::factory()->create([
        'name' => 'Greater Cairo',
        'cities' => ['Cairo', 'القاهرة', 'Giza'],
        'rate' => '40.0000',
        'free_shipping_threshold' => '500.0000',
        'is_default' => false,
    ]);
    ShippingZone::factory()->create([
        'name' => 'Other Governorates',
        'cities' => ['Alexandria'],
        'rate' => '75.0000',
        'free_shipping_threshold' => null,
        'is_default' => true,
    ]);

    /** @var ShippingService $shipping */
    $shipping = app(ShippingService::class);

    $resAr = $shipping->calculateForCity('القاهرة', '250.0000');
    expect($resAr['zone']->id)->toBe($cairo->id);
    expect($resAr['rate'])->toBe('40.0000');
    expect($resAr['free_shipping'])->toBeFalse();

    $resFree = $shipping->calculateForCity('cairo', '500.0000');
    expect($resFree['rate'])->toBe('0.0000');
    expect($resFree['free_shipping'])->toBeTrue();

    $resFallback = $shipping->calculateForCity('Aswan', '200.0000');
    expect($resFallback['rate'])->toBe('75.0000');
});
