<?php

namespace Database\Factories;

use App\Models\Product;
use App\Models\ProductVariation;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<ProductVariation> */
class ProductVariationFactory extends Factory
{
    protected $model = ProductVariation::class;

    public function definition(): array
    {
        return [
            'product_id' => Product::factory(),
            'sku' => strtoupper(fake()->unique()->bothify('VAR-####-??')),
            'combination_hash' => hash('sha256', fake()->unique()->uuid()),
            'name' => fake()->words(2, true),
            'stock_quantity' => 10,
            'low_stock_threshold' => 2,
            'status' => 'active',
            'is_default' => false,
        ];
    }
}
