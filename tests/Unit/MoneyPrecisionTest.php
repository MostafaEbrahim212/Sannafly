<?php

use App\Models\Coupon;
use App\Models\ShippingZone;
use App\Support\Money;

it('computes awkward percent coupons and totals with zero floating-point drift', function () {
    $coupon = new Coupon([
        'code' => 'THIRD',
        'type' => 'percent',
        'value' => '33.3300',
        'is_active' => true,
    ]);

    // 3 items * 19.99 = 59.9700
    $subtotal = Money::mul('19.99', '3');
    expect($subtotal)->toBe('59.9700');

    // 33.33% of 59.9700 = 19.988001 -> half-up 4 decimals = 19.9880
    $discount = $coupon->calculateDiscount($subtotal);
    expect($discount)->toBe('19.9880');

    // 0.1 + 0.2 must be 0.3000 exactly
    expect(Money::add('0.1', '0.2'))->toBe('0.3000');
});

it('maintains exact subtotal - discount + shipping == grand_total invariant across random carts', function () {
    mt_srand(42);

    for ($i = 0; $i < 25; $i++) {
        $subtotal = '0.0000';
        $itemCount = mt_rand(1, 5);
        for ($j = 0; $j < $itemCount; $j++) {
            $price = number_format(mt_rand(100, 99999) / 100, 2, '.', '');
            $qty = (string) mt_rand(1, 7);
            $subtotal = Money::add($subtotal, Money::mul($price, $qty));
        }

        $coupon = new Coupon([
            'code' => 'RND',
            'type' => $i % 2 === 0 ? 'percent' : 'fixed',
            'value' => $i % 2 === 0 ? (string) mt_rand(1, 50) : (string) mt_rand(1, 200),
            'max_discount_amount' => $i % 3 === 0 ? '50.0000' : null,
            'is_active' => true,
        ]);

        $discount = $coupon->calculateDiscount($subtotal);
        expect(Money::comp($discount, $subtotal))->toBeLessThanOrEqual(0);

        $net = Money::max('0.0000', Money::sub($subtotal, $discount));

        $zone = new ShippingZone([
            'rate' => '35.5000',
            'free_shipping_threshold' => '500.0000',
        ]);
        $shipping = $zone->calculateRate($net);
        $grandTotal = Money::add($net, $shipping);

        expect(Money::add(Money::sub($subtotal, $discount), $shipping))->toBe($grandTotal);
    }
});
