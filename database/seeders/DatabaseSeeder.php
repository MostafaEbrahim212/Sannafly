<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            EssentialSeeder::class,
        ]);

        if (filter_var(env('APP_SEED_DEMO', false), FILTER_VALIDATE_BOOLEAN)) {
            $this->call([
                DemoCatalogSeeder::class,
            ]);
        }
    }
}
