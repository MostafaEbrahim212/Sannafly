<?php

use App\Models\Customer;
use App\Models\Permission;
use App\Models\Product;
use App\Models\Role;
use App\Models\User;
use App\Services\DatabaseBackupService;
use App\Services\InstallerService;
use App\Services\SettingsService;
use Database\Seeders\EssentialSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;

uses(RefreshDatabase::class);

it('seeds neutral white-label defaults without demo products in EssentialSeeder', function (): void {
    $this->seed(EssentialSeeder::class);

    $settings = app(SettingsService::class);
    expect($settings->get('site_name'))->toBe('MyStore')
        ->and($settings->get('currency'))->toBe('EGP')
        ->and(Product::query()->count())->toBe(0);
});

it('runs web installer flow, creates owner account, and locks /install permanently', function (): void {
    $lockPath = app(InstallerService::class)->lockFilePath();
    @unlink($lockPath);

    $this->get('/install')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Installer/Index')
            ->has('requirements.items')
        );

    $this->postJson('/install/run', [
        'app_name' => 'Acme Store',
        'locale' => 'en',
        'timezone' => 'Africa/Cairo',
        'currency' => 'EGP',
        'seed_demo' => false,
    ])->assertOk()->assertJsonPath('ok', true);

    $this->postJson('/install/owner', [
        'name' => 'Store Owner',
        'email' => 'owner@example.com',
        'password' => 'StrongPass123!',
        'password_confirmation' => 'StrongPass123!',
    ])->assertOk()->assertJsonPath('ok', true);

    expect(file_exists($lockPath))->toBeTrue();
    expect(User::query()->where('email', 'owner@example.com')->exists())->toBeTrue();

    // Installer must be locked (404) after completion
    $this->get('/install')->assertNotFound();
    $this->postJson('/install/owner', [
        'name' => 'Attacker',
        'email' => 'attacker@example.com',
        'password' => 'StrongPass123!',
        'password_confirmation' => 'StrongPass123!',
    ])->assertNotFound();

    @unlink($lockPath);
});

it('manages commercial license activation, deactivation, diagnostics report, and SQL backup restore', function (): void {
    $admin = User::factory()->create(['status' => 'active']);
    $role = Role::create(['name' => 'Owner', 'slug' => 'super-admin', 'is_system' => true]);
    $perm = Permission::firstOrCreate(['slug' => 'dashboard.access'], ['name' => 'dashboard.access', 'group' => 'dashboard']);
    $managePerm = Permission::firstOrCreate(['slug' => 'settings.manage'], ['name' => 'settings.manage', 'group' => 'settings']);
    $role->permissions()->sync([$perm->id, $managePerm->id]);
    $admin->roles()->sync([$role->id]);

    $this->actingAs($admin, 'web')
        ->get('/admin/license')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('Admin/License/Index'));

    // Invalid key rejected
    $this->actingAs($admin, 'web')
        ->post('/admin/license/activate', ['license_key' => 'bad', 'type' => 'single'])
        ->assertRedirect()
        ->assertSessionHas('error');

    // Valid key activated
    $this->actingAs($admin, 'web')
        ->post('/admin/license/activate', ['license_key' => 'CFLW-2026-ABCD-1234', 'type' => 'lifetime'])
        ->assertRedirect()
        ->assertSessionHas('success');

    $this->actingAs($admin, 'web')
        ->get('/admin/system-tools/diagnostics/download')
        ->assertOk()
        ->assertJsonStructure(['generated_at', 'product', 'environment', 'license', 'requirements']);

    $this->actingAs($admin, 'web')
        ->post('/admin/license/deactivate')
        ->assertRedirect();

    // Backup & Restore
    $backup = app(DatabaseBackupService::class)->createBackup(false);
    $this->actingAs($admin, 'web')
        ->post('/admin/system-tools/backup/restore', ['file' => $backup['name']])
        ->assertRedirect()
        ->assertSessionHas('success');

    app(DatabaseBackupService::class)->deleteBackup($backup['name']);
});

it('allows customer to export personal data and anonymize account', function (): void {
    $customer = Customer::factory()->create([
        'email' => 'privacy@example.com',
        'password' => Hash::make('SecretPass123!'),
        'status' => 'active',
    ]);

    $this->actingAs($customer, 'customer')
        ->get('/profile/export-data')
        ->assertOk()
        ->assertJsonPath('profile.email', 'privacy@example.com');

    $this->actingAs($customer, 'customer')
        ->post('/profile/anonymize', ['password' => 'SecretPass123!'])
        ->assertRedirect('/');

    $trashed = Customer::withTrashed()->find($customer->id);
    expect($trashed)->not->toBeNull()
        ->and($trashed->name)->toBe('Deleted Customer')
        ->and($trashed->status)->toBe('inactive')
        ->and($trashed->deleted_at)->not->toBeNull();
});
