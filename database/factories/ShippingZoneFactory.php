<?php

namespace Database\Factories;

use App\Models\ShippingZone;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<ShippingZone> */
class ShippingZoneFactory extends Factory
{
    protected $model = ShippingZone::class;

    public function definition(): array
    {
        return [
            'name' => fake()->city(),
            'name_ar' => fake()->city(),
            'cities' => ['Cairo', 'Giza'],
            'rate' => '50.0000',
            'free_shipping_threshold' => '1000.0000',
            'estimated_days' => '2-3 days',
            'is_default' => false,
            'is_active' => true,
            'sort_order' => 0,
        ];
    }
}
