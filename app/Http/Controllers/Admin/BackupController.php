<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SystemBackup;
use App\Services\AuditLogger;
use App\Services\DatabaseBackupService;
use App\Services\SettingsService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use InvalidArgumentException;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Throwable;

class BackupController extends Controller
{
    public function __construct(
        private readonly DatabaseBackupService $backups,
        private readonly SettingsService $settings,
        private readonly AuditLogger $audit,
    ) {}

    public function index(): Response
    {
        // Sync any existing files on disk into system_backups metadata if not yet tracked
        foreach ($this->backups->listBackups() as $file) {
            if (! SystemBackup::query()->where('name', $file['name'])->exists()) {
                $path = $this->backups->resolvePath($file['name']);
                SystemBackup::query()->create([
                    'name' => $file['name'],
                    'type' => $file['type'],
                    'file_size' => $file['size'],
                    'checksum' => hash_file('sha256', $path) ?: null,
                    'integrity_status' => 'verified',
                    'status' => 'completed',
                    'product_version' => config('product.version'),
                    'created_at' => $file['created_at'],
                ]);
            }
        }

        return Inertia::render('Admin/System/Backups', [
            'backups' => SystemBackup::query()->with('creator:id,name')->latest('id')->paginate(20),
            'retentionCount' => (int) $this->settings->get('backup_retention_count', 10),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $type = $request->string('type')->toString() ?: 'database';
        $includeStorage = $type === 'full';

        $created = $this->backups->createBackup($includeStorage);
        $path = $this->backups->resolvePath($created['name']);
        $checksum = hash_file('sha256', $path) ?: null;

        $dbVersion = null;
        try {
            $dbVersion = (string) DB::connection()->getPdo()->getAttribute(\PDO::ATTR_SERVER_VERSION);
        } catch (Throwable) {
        }

        $record = SystemBackup::query()->create([
            'name' => $created['name'],
            'type' => $includeStorage ? 'full' : 'database',
            'file_size' => (int) filesize($path),
            'checksum' => $checksum,
            'integrity_status' => 'verified',
            'status' => 'completed',
            'product_version' => config('product.version'),
            'db_version' => $dbVersion,
            'created_by' => Auth::guard('web')->id(),
        ]);

        $this->audit->log('system.backup_created', 'SystemBackup', $record->id, null, $created);

        return back()->with('success', "Backup created: {$created['name']} ({$created['size_human']})");
    }

    public function verify(SystemBackup $backup): RedirectResponse
    {
        try {
            $path = $this->backups->resolvePath($backup->name);
            $actual = hash_file('sha256', $path) ?: '';
            $ok = $backup->checksum === null || hash_equals($backup->checksum, $actual);

            $backup->update(['integrity_status' => $ok ? 'verified' : 'corrupted']);
            $this->audit->log('system.backup_verified', 'SystemBackup', $backup->id, null, ['verified' => $ok]);

            return back()->with($ok ? 'success' : 'error', $ok ? 'Backup checksum verified.' : 'Backup integrity check failed (corrupted).');
        } catch (InvalidArgumentException $e) {
            $backup->update(['integrity_status' => 'corrupted']);

            return back()->with('error', $e->getMessage());
        }
    }

    public function download(SystemBackup $backup): BinaryFileResponse
    {
        try {
            $path = $this->backups->resolvePath($backup->name);
        } catch (InvalidArgumentException) {
            abort(404);
        }

        $this->audit->log('system.backup_downloaded', 'SystemBackup', $backup->id);

        return response()->download($path, basename($path));
    }

    public function restore(SystemBackup $backup): RedirectResponse
    {
        $lock = Cache::lock('system_backup_restore', 120);
        if (! $lock->get()) {
            return back()->with('error', 'Another restore operation is already in progress.');
        }

        try {
            $path = $this->backups->resolvePath($backup->name);
            if ($backup->checksum && ! hash_equals($backup->checksum, (string) hash_file('sha256', $path))) {
                $backup->update(['integrity_status' => 'corrupted']);

                return back()->with('error', 'Restore aborted: backup checksum mismatch.');
            }

            // Create pre-restore safety snapshot
            $preRestore = $this->backups->createBackup(false);
            $executed = $this->backups->restoreSqlBackup($backup->name);

            $this->audit->log('system.backup_restored', 'SystemBackup', $backup->id, null, [
                'file' => $backup->name,
                'statements' => $executed,
                'pre_restore_backup' => $preRestore['name'],
            ]);

            return back()->with('success', "Backup restored ({$executed} statements). Pre-restore snapshot: {$preRestore['name']}");
        } catch (Throwable $e) {
            return back()->with('error', 'Restore failed: '.$e->getMessage());
        } finally {
            $lock->release();
        }
    }

    public function destroy(SystemBackup $backup): RedirectResponse
    {
        try {
            $this->backups->deleteBackup($backup->name);
        } catch (InvalidArgumentException) {
        }
        $name = $backup->name;
        $backup->delete();

        $this->audit->log('system.backup_deleted', null, null, null, ['file' => $name]);

        return back()->with('success', "Backup [{$name}] deleted.");
    }

    public function prune(Request $request): RedirectResponse
    {
        $keep = max(1, min(100, (int) $request->input('keep', $this->settings->get('backup_retention_count', 10))));
        $this->settings->set('backup_retention_count', $keep, 'system', 'integer', false);

        $old = SystemBackup::query()->latest('id')->skip($keep)->take(100)->get();
        $deleted = 0;
        foreach ($old as $item) {
            try {
                $this->backups->deleteBackup($item->name);
            } catch (InvalidArgumentException) {
            }
            $item->delete();
            $deleted++;
        }

        $this->audit->log('system.backups_pruned', null, null, null, ['keep' => $keep, 'deleted' => $deleted]);

        return back()->with('success', "Retention policy applied (kept latest {$keep}, removed {$deleted}).");
    }
}
