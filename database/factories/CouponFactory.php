<?php

namespace Database\Factories;

use App\Models\Coupon;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Coupon> */
class CouponFactory extends Factory
{
    protected $model = Coupon::class;

    public function definition(): array
    {
        return [
            'code' => strtoupper(fake()->unique()->bothify('PROMO###??')),
            'name' => fake()->words(2, true),
            'type' => 'fixed',
            'value' => '15.0000',
            'min_order_amount' => null,
            'max_discount_amount' => null,
            'usage_limit' => null,
            'usage_limit_per_customer' => null,
            'used_count' => 0,
            'starts_at' => null,
            'expires_at' => null,
            'is_active' => true,
        ];
    }
}
