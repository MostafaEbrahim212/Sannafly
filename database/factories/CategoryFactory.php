<?php

namespace Database\Factories;

use App\Models\Category;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/** @extends Factory<Category> */
class CategoryFactory extends Factory
{
    protected $model = Category::class;

    public function definition(): array
    {
        $name = fake()->unique()->words(2, true);

        return [
            'name' => $name,
            'name_ar' => $name,
            'slug' => Str::slug($name).'-'.fake()->unique()->numerify('###'),
            'is_visible' => true,
            'sort_order' => 0,
        ];
    }
}
