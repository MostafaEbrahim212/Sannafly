<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class EssentialSeeder extends Seeder
{
    /**
     * Seed only essential system data required for production operation:
     * RBAC roles/permissions, neutral white-label settings, payment method definitions,
     * price types, and default shipping zones. No demo products, customers, or orders.
     */
    public function run(): void
    {
        $this->call([
            RbacSeeder::class,
            SettingsSeeder::class,
        ]);
    }
}
