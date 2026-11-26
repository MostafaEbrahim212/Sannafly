<?php

use App\Models\AuditLog;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use App\Support\ErrorLogger;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\File;

uses(RefreshDatabase::class);

function makeSystemAdmin(array $permissionSlugs): User
{
    $user = User::factory()->create(['status' => 'active']);
    $role = Role::create([
        'name' => 'Ops Admin',
        'slug' => 'ops-admin-'.uniqid(),
        'is_system' => false,
    ]);

    $permIds = collect(array_unique(array_merge(['dashboard.access'], $permissionSlugs)))->map(function (string $slug): int {
        return Permission::firstOrCreate(
            ['slug' => $slug],
            ['name' => $slug, 'group' => 'system']
        )->id;
    })->all();

    $role->permissions()->sync($permIds);
    $user->roles()->sync([$role->id]);

    return $user;
}

it('redacts sensitive keys in ErrorLogger payment and security channels', function (): void {
    $logDir = storage_path('logs');
    File::ensureDirectoryExists($logDir);

    ErrorLogger::payment('payment.callback_verified', [
        'order_number' => 'ORD-1001',
        'token' => 'super-secret-token',
        'amount' => '250.00',
    ]);

    ErrorLogger::security('auth.suspicious_login', [
        'email' => 'test@example.com',
        'password' => 'my-password-123',
    ]);

    $paymentFiles = glob($logDir.'/payments*.log') ?: [];
    $securityFiles = glob($logDir.'/security*.log') ?: [];

    expect($paymentFiles)->not->toBeEmpty();
    expect($securityFiles)->not->toBeEmpty();

    $paymentContent = file_get_contents($paymentFiles[0]);
    $securityContent = file_get_contents($securityFiles[0]);

    expect($paymentContent)->toContain('ORD-1001')
        ->and($paymentContent)->toContain('[REDACTED]')
        ->and($paymentContent)->not->toContain('super-secret-token');

    expect($securityContent)->toContain('test@example.com')
        ->and($securityContent)->toContain('[REDACTED]')
        ->and($securityContent)->not->toContain('my-password-123');
});

it('allows authorized admin to view, filter, download, and clear system logs while blocking path traversal', function (): void {
    $testLog = storage_path('logs/test-viewer.log');
    file_put_contents($testLog, implode("\n", [
        '[2026-11-26 10:00:00] local.INFO: Order created {"order_number":"ORD-555"}',
        '[2026-11-26 10:05:00] local.ERROR: Gateway timeout {"gateway":"fawry","request_id":"req_abc"}',
    ])."\n");

    $viewer = makeSystemAdmin(['audit_logs.view']);
    $manager = makeSystemAdmin(['audit_logs.view', 'settings.manage']);

    $this->actingAs($viewer)
        ->get('/admin/system-logs?file=test-viewer.log&level=ERROR&search=fawry')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Admin/SystemLogs/Index')
            ->where('activeFile', 'test-viewer.log')
            ->has('entries', 1)
            ->where('entries.0.level', 'ERROR')
            ->where('entries.0.message', 'Gateway timeout')
        );

    $this->actingAs($viewer)
        ->get('/admin/system-logs/download?file=test-viewer.log')
        ->assertOk();

    // Path traversal must be rejected
    $this->actingAs($viewer)
        ->get('/admin/system-logs/download?file=../../.env')
        ->assertNotFound();

    // Viewer without settings.manage cannot clear
    $this->actingAs($viewer)
        ->post('/admin/system-logs/clear', ['file' => 'test-viewer.log'])
        ->assertForbidden();

    // Manager can clear and records audit log
    $this->actingAs($manager)
        ->post('/admin/system-logs/clear', ['file' => 'test-viewer.log'])
        ->assertRedirect();

    expect(file_get_contents($testLog))->toBe('');
    expect(AuditLog::where('action', 'system.log_cleared')->exists())->toBeTrue();

    @unlink($testLog);
});

it('allows admin to view system tools, run cache actions, and create/download/delete SQL backups', function (): void {
    $admin = makeSystemAdmin(['settings.manage']);

    $this->actingAs($admin)
        ->get('/admin/system-tools')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Admin/SystemTools/Index')
            ->has('diagnostics.php_version')
            ->has('diagnostics.extensions.bcmath')
        );

    $this->actingAs($admin)
        ->post('/admin/system-tools/action', ['action' => 'cache_clear'])
        ->assertRedirect()
        ->assertSessionHas('success');

    expect(AuditLog::where('action', 'system.cache_clear')->exists())->toBeTrue();

    $this->actingAs($admin)
        ->post('/admin/system-tools/backup', ['include_storage' => false])
        ->assertRedirect()
        ->assertSessionHas('success');

    $backupAudit = AuditLog::where('action', 'system.backup_created')->latest('id')->first();
    expect($backupAudit)->not->toBeNull();
    $backupName = $backupAudit->new_values['name'] ?? null;
    expect($backupName)->toBeString()->toEndWith('.sql');

    $this->actingAs($admin)
        ->get('/admin/system-tools/backup/download?file='.urlencode((string) $backupName))
        ->assertOk();

    $this->actingAs($admin)
        ->delete('/admin/system-tools/backup', ['file' => $backupName])
        ->assertRedirect();

    expect(file_exists(storage_path('app/backups/'.$backupName)))->toBeFalse();
});

it('blocks unprivileged users from system logs and system tools', function (): void {
    $customer = User::factory()->create(['status' => 'active']);

    $this->actingAs($customer)->get('/admin/system-logs')->assertForbidden();
    $this->actingAs($customer)->get('/admin/system-tools')->assertForbidden();
    $this->actingAs($customer)->post('/admin/system-tools/action', ['action' => 'cache_clear'])->assertForbidden();
});
