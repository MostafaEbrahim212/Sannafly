<?php

namespace Database\Factories;

use App\Models\PaymentMethod;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<PaymentMethod> */
class PaymentMethodFactory extends Factory
{
    protected $model = PaymentMethod::class;

    public function definition(): array
    {
        return [
            'name' => 'Cash on Delivery',
            'name_ar' => 'الدفع عند الاستلام',
            'code' => fake()->unique()->slug(2),
            'driver' => 'cod',
            'is_active' => true,
            'is_visible' => true,
            'sort_order' => 1,
            'config' => [],
        ];
    }
}
