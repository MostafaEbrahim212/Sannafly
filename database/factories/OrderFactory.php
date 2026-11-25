<?php

namespace Database\Factories;

use App\Models\Order;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/** @extends Factory<Order> */
class OrderFactory extends Factory
{
    protected $model = Order::class;

    public function definition(): array
    {
        return [
            'order_number' => 'ORD-'.now()->format('Ymd').'-'.strtoupper(Str::random(10)),
            'customer_name' => fake()->name(),
            'customer_email' => fake()->safeEmail(),
            'customer_phone' => '010'.fake()->numerify('########'),
            'shipping_address' => ['city' => 'Cairo', 'street' => '123 Nile St'],
            'status' => 'pending',
            'payment_status' => 'unpaid',
            'subtotal' => '100.0000',
            'discount_total' => '0.0000',
            'shipping_total' => '0.0000',
            'tax_total' => '0.0000',
            'grand_total' => '100.0000',
            'currency' => 'EGP',
        ];
    }
}
