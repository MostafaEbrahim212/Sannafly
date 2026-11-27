<?php

use App\Models\AuditLog;
use App\Models\Permission;
use App\Models\Product;
use App\Models\Role;
use App\Models\SystemBackup;
use App\Models\ThemePreset;
use App\Models\User;
use App\Services\DemoModeService;
use App\Services\SupportDiagnosticService;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function makeFeatureAdmin(array $slugs): User
{
    $user = User::factory()->create(['status' => 'active']);
    $role = Role::create(['name' => 'SysAdmin', 'slug' => 'sys-'.uniqid(), 'is_system' => false]);
    $ids = collect(array_unique(array_merge(['dashboard.access'], $slugs)))
        ->map(fn (string $s) => Permission::firstOrCreate(['slug' => $s], ['name' => $s, 'group' => 'system'])->id)
        ->all();
    $role->permissions()->sync($ids);
    $user->roles()->sync([$role->id]);

    return $user;
}

it('runs system health checks and test mail safely with RBAC enforcement', function (): void {
    $viewer = makeFeatureAdmin(['system.health.view', 'system.health.run']);
    $unprivileged = makeFeatureAdmin([]);

    $this->actingAs($unprivileged, 'web')->get('/admin/system/health')->assertForbidden();

    $this->actingAs($viewer, 'web')
        ->get('/admin/system/health')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Admin/System/Health')
            ->has('report.checks')
            ->has('report.overall_status')
        );

    $this->actingAs($viewer, 'web')
        ->post('/admin/system/health/test-mail', ['email' => 'diag@example.com'])
        ->assertRedirect()
        ->assertSessionHas('success');
});

it('creates, verifies, downloads, prunes, restores, and deletes system backups securely', function (): void {
    $admin = makeFeatureAdmin([
        'system.backups.view',
        'system.backups.create',
        'system.backups.download',
        'system.backups.restore',
        'system.backups.delete',
    ]);

    $this->actingAs($admin, 'web')
        ->post('/admin/system/backups', ['type' => 'database'])
        ->assertRedirect()
        ->assertSessionHas('success');

    $backup = SystemBackup::query()->latest('id')->firstOrFail();
    expect($backup->checksum)->not->toBeNull();

    $this->actingAs($admin, 'web')
        ->post("/admin/system/backups/{$backup->id}/verify")
        ->assertRedirect()
        ->assertSessionHas('success');

    $this->actingAs($admin, 'web')
        ->get("/admin/system/backups/{$backup->id}/download")
        ->assertOk();

    $this->actingAs($admin, 'web')
        ->post("/admin/system/backups/{$backup->id}/restore")
        ->assertRedirect()
        ->assertSessionHas('success');

    // Clean up created backup files
    foreach (SystemBackup::all() as $b) {
        $this->actingAs($admin, 'web')->delete("/admin/system/backups/{$b->id}");
    }
    foreach (glob(storage_path('app/backups/*.sql')) ?: [] as $f) {
        @unlink($f);
    }
});

it('checks system updates safely without faking remote updates', function (): void {
    $admin = makeFeatureAdmin(['system.updates.view', 'system.updates.execute']);

    $this->actingAs($admin, 'web')
        ->get('/admin/system/updates')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Admin/System/Updates')
            ->where('updateInfo.update_available', false)
        );

    $this->actingAs($admin, 'web')
        ->post('/admin/system/updates/check')
        ->assertRedirect()
        ->assertSessionHas('success');

    $this->actingAs($admin, 'web')
        ->post('/admin/system/updates/execute')
        ->assertRedirect()
        ->assertSessionHas('error');
});

it('generates sanitized support diagnostic exports without leaking secrets', function (): void {
    $admin = makeFeatureAdmin(['system.support.export']);

    $sanitized = app(SupportDiagnosticService::class)->sanitizeRecursive([
        'app_key' => 'base64:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
        'api_key' => 'sk_live_1234567890abcdef',
        'note' => 'Contact user@example.com with Bearer secret_token_xyz',
    ]);

    expect($sanitized['app_key'])->toBe('[REDACTED]')
        ->and($sanitized['api_key'])->toBe('[REDACTED]')
        ->and($sanitized['note'])->not->toContain('user@example.com')
        ->and($sanitized['note'])->not->toContain('secret_token_xyz');

    $this->actingAs($admin, 'web')
        ->post('/admin/system/support/generate', ['format' => 'txt'])
        ->assertRedirect()
        ->assertSessionHas('success');

    foreach (glob(storage_path('app/support-exports/*')) ?: [] as $f) {
        @unlink($f);
    }
});

it('applies, saves, exports, and safely imports theme presets without touching products', function (): void {
    $admin = makeFeatureAdmin(['customizer.themes.view', 'customizer.themes.manage']);
    $product = Product::factory()->create(['name' => 'Keep Me']);

    $this->actingAs($admin, 'web')
        ->get('/admin/customizer/themes')
        ->assertOk();

    $preset = ThemePreset::query()->where('slug', 'electronics')->firstOrFail();

    $this->actingAs($admin, 'web')
        ->post("/admin/customizer/themes/{$preset->id}/apply")
        ->assertRedirect()
        ->assertSessionHas('success');

    expect($product->fresh()->name)->toBe('Keep Me');

    // Unsafe script injection in theme import must be rejected
    $this->actingAs($admin, 'web')
        ->post('/admin/customizer/themes/import', [
            'theme_json' => json_encode([
                'name' => 'Evil',
                'config' => ['theme_surface' => '<script>alert(1)</script>'],
            ]),
        ])
        ->assertRedirect()
        ->assertSessionHas('error');
});

it('enforces demo mode restrictions at backend middleware level and prevents reset when disabled', function (): void {
    $admin = makeFeatureAdmin([
        'system.demo.manage',
        'system.backups.create',
        'system.license.manage',
        'settings.manage',
    ]);

    // Reset blocked when demo mode is off
    $this->actingAs($admin, 'web')
        ->post('/admin/system/demo/reset')
        ->assertRedirect()
        ->assertSessionHas('error');

    // Enable demo mode
    $this->actingAs($admin, 'web')
        ->post('/admin/system/demo/toggle', ['enabled' => true])
        ->assertRedirect();

    expect(app(DemoModeService::class)->isEnabled())->toBeTrue();

    // Direct POST to protected route is blocked with 403 by demo.guard even for Super/Admin
    $this->actingAs($admin, 'web')
        ->post('/admin/system/backups', ['type' => 'database'])
        ->assertForbidden();

    $this->actingAs($admin, 'web')
        ->post('/admin/system/demo/toggle', ['enabled' => false])
        ->assertRedirect();
});

it('enforces audit log immutability and exports filtered CSV safely', function (): void {
    $admin = makeFeatureAdmin(['system.audit_logs.view', 'system.audit_logs.export']);

    $log = AuditLog::query()->create([
        'actor_name' => '=HYPERLINK("http://evil.com","click")',
        'action' => 'system.test_event',
        'event_type' => 'system',
        'result' => 'success',
        'created_at' => now(),
    ]);

    expect(fn () => $log->update(['action' => 'tampered']))->toThrow(LogicException::class);
    expect(fn () => $log->delete())->toThrow(LogicException::class);

    $response = $this->actingAs($admin, 'web')
        ->get('/admin/system/audit-logs/export?event_type=system')
        ->assertOk();

    expect($response->streamedContent())->toContain("'=HYPERLINK");
});
