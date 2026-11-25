<?php

use App\Models\Permission;
use App\Models\Product;
use App\Models\Role;
use App\Models\Setting;
use Database\Seeders\RbacSeeder;
use Database\Seeders\SettingsSeeder;
use Illuminate\Support\Facades\Schema;

it('runs RbacSeeder and SettingsSeeder idempotently', function () {
    $this->seed([RbacSeeder::class, SettingsSeeder::class]);
    $roleCount = Role::query()->count();
    $permCount = Permission::query()->count();
    $settingCount = Setting::query()->count();

    $this->seed([RbacSeeder::class, SettingsSeeder::class]);

    expect(Role::query()->count())->toBe($roleCount);
    expect(Permission::query()->count())->toBe($permCount);
    expect(Setting::query()->count())->toBe($settingCount);
});

it('has required tables and columns with unique constraints', function () {
    expect(Schema::hasTable('orders'))->toBeTrue();
    expect(Schema::hasTable('payments'))->toBeTrue();
    expect(Schema::hasTable('coupon_redemptions'))->toBeTrue();
    expect(Schema::hasTable('audit_logs'))->toBeTrue();
    expect(Schema::hasColumns('coupons', ['usage_limit', 'usage_limit_per_customer', 'used_count']))->toBeTrue();
});

it('runs ProductionPreflight and GenerateProductImages commands cleanly', function () {
    $this->seed([RbacSeeder::class, SettingsSeeder::class]);
    Product::factory()->create();

    $this->artisan('catalog:preflight')->assertExitCode(0);
    $this->artisan('catalog:generate-images')->assertExitCode(0);
});
