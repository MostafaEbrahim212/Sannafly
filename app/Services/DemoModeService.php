<?php

namespace App\Services;

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\DemoCatalogSeeder;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use RuntimeException;

class DemoModeService
{
    public const DEMO_EMAIL = 'demo@example.com';

    public function __construct(
        private readonly SettingsService $settings,
        private readonly AuditLogger $audit,
    ) {}

    public function isEnabled(): bool
    {
        if (filter_var(env('APP_DEMO_MODE', false), FILTER_VALIDATE_BOOLEAN)) {
            return true;
        }

        if (! Schema::hasTable('settings')) {
            return false;
        }

        return $this->settings->isEnabled('demo_mode_enabled', false);
    }

    public function setEnabled(bool $enabled): void
    {
        $this->settings->set('demo_mode_enabled', $enabled, 'system', 'boolean', true);
        if ($enabled) {
            $this->ensureDemoAccount();
        }
        $this->audit->log($enabled ? 'demo.enabled' : 'demo.disabled');
    }

    /**
     * Create or sync a restricted Demo Reviewer account with read/preview permissions only.
     * Never grants access to system backups, license, support secrets, payment keys, or user management.
     */
    public function ensureDemoAccount(): User
    {
        $role = Role::query()->firstOrCreate(
            ['slug' => 'demo-reviewer'],
            ['name' => 'Demo Reviewer', 'is_system' => true]
        );

        $allowedSlugs = [
            'dashboard.access',
            'products.view',
            'categories.view',
            'inventory.view',
            'orders.view',
            'reports.view',
            'audit_logs.view',
            'system.audit_logs.view',
            'customizer.themes.view',
        ];

        $permIds = Permission::query()->whereIn('slug', $allowedSlugs)->pluck('id')->all();
        $role->permissions()->sync($permIds);

        $user = User::query()->firstOrCreate(
            ['email' => self::DEMO_EMAIL],
            [
                'name' => 'Demo Reviewer',
                'status' => 'active',
                'email_verified_at' => now(),
                'password' => Hash::make(Str::random(32)),
            ]
        );

        $user->roles()->sync([$role->id]);

        return $user;
    }

    /**
     * Reset demo catalog data ONLY when Demo Mode is explicitly active.
     */
    public function resetDemoData(): void
    {
        if (! $this->isEnabled()) {
            throw new RuntimeException('Demo reset is strictly blocked when Demo Mode is disabled.');
        }

        Artisan::call('db:seed', [
            '--class' => DemoCatalogSeeder::class,
            '--force' => true,
        ]);

        $this->settings->set('demo_last_reset_at', now()->toIso8601String(), 'system', 'string', true);
        $this->audit->log('demo.reset');
    }
}
