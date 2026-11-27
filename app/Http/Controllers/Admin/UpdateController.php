<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SystemUpdate;
use App\Services\AuditLogger;
use App\Services\DatabaseBackupService;
use App\Services\UpdateService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class UpdateController extends Controller
{
    public function __construct(
        private readonly UpdateService $updates,
        private readonly DatabaseBackupService $backups,
        private readonly AuditLogger $audit,
    ) {}

    public function index(): Response
    {
        return Inertia::render('Admin/System/Updates', [
            'updateInfo' => $this->updates->check(),
            'history' => SystemUpdate::query()->with('executor:id,name')->latest('id')->limit(15)->get(),
        ]);
    }

    public function check(): RedirectResponse
    {
        $info = $this->updates->check();
        SystemUpdate::query()->create([
            'from_version' => $info['current_version'],
            'to_version' => $info['latest_version'] ?: $info['current_version'],
            'status' => 'checked',
            'notes' => $info['message'],
            'executed_by' => Auth::guard('web')->id(),
        ]);

        $this->audit->log('system.update_checked', null, null, null, ['available' => $info['update_available']]);

        return back()->with('success', $info['message']);
    }

    public function execute(): RedirectResponse
    {
        $info = $this->updates->check();
        if (! $info['update_available'] || ! $info['remote_configured']) {
            return back()->with('error', 'No verified remote update package is available to execute.');
        }

        $backup = $this->backups->createBackup(false);
        try {
            Artisan::call('migrate', ['--force' => true]);
            Artisan::call('optimize:clear');

            SystemUpdate::query()->create([
                'from_version' => $info['current_version'],
                'to_version' => (string) $info['latest_version'],
                'status' => 'completed',
                'backup_file' => $backup['name'],
                'notes' => $info['notes'],
                'executed_by' => Auth::guard('web')->id(),
            ]);

            $this->audit->log('system.update_executed', null, null, null, [
                'to_version' => $info['latest_version'],
                'backup_file' => $backup['name'],
            ]);

            return back()->with('success', "Updated to v{$info['latest_version']}. Pre-update backup: {$backup['name']}");
        } catch (Throwable $e) {
            SystemUpdate::query()->create([
                'from_version' => $info['current_version'],
                'to_version' => (string) $info['latest_version'],
                'status' => 'failed',
                'backup_file' => $backup['name'],
                'error_message' => $e->getMessage(),
                'executed_by' => Auth::guard('web')->id(),
            ]);

            return back()->with('error', 'Update failed safely; pre-update backup preserved: '.$backup['name']);
        }
    }
}
