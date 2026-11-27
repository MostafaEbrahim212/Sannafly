<?php

namespace App\Services;

use Database\Seeders\DemoCatalogSeeder;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schema;
use RuntimeException;

class DemoModeService
{
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
        $this->audit->log($enabled ? 'demo.enabled' : 'demo.disabled');
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
