<?php

namespace Database\Factories;

use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/** @extends Factory<Product> */
class ProductFactory extends Factory
{
    protected $model = Product::class;

    public function definition(): array
    {
        $name = fake()->unique()->words(3, true);

        return [
            'name' => $name,
            'name_ar' => $name,
            'slug' => Str::slug($name).'-'.fake()->unique()->numerify('###'),
            'sku' => strtoupper(fake()->unique()->bothify('SKU-####-??')),
            'status' => 'published',
            'visibility' => 'public',
            'is_featured' => false,
            'has_variations' => false,
            'track_inventory' => true,
            'allow_backorder' => false,
            'allow_negative_stock' => false,
            'stock_quantity' => 25,
            'low_stock_threshold' => 5,
        ];
    }
}
