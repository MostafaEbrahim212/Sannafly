<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\AuditLogger;
use App\Services\DatabaseBackupService;
use App\Services\InstallerService;
use App\Services\LicenseService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;
use InvalidArgumentException;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Throwable;
use ZipArchive;

class SystemToolsController extends Controller
{
    public function __construct(
        private readonly DatabaseBackupService $backupService,
        private readonly AuditLogger $audit,
    ) {}

    public function index(): Response
    {
        $dbStatus = 'ok';
        $dbDriver = (string) config('database.default');
        try {
            DB::connection()->getPdo();
        } catch (Throwable $e) {
            $dbStatus = $e->getMessage();
        }

        $pendingJobs = Schema::hasTable('jobs') ? DB::table('jobs')->count() : 0;
        $failedJobs = Schema::hasTable('failed_jobs') ? DB::table('failed_jobs')->count() : 0;

        $freeBytes = @disk_free_space(base_path()) ?: 0;
        $totalBytes = @disk_total_space(base_path()) ?: 0;

        $publicStorageLink = public_path('storage');
        $storageLinked = is_link($publicStorageLink) || is_dir($publicStorageLink);

        return Inertia::render('Admin/SystemTools/Index', [
            'diagnostics' => [
                'php_version' => PHP_VERSION,
                'laravel_version' => app()->version(),
                'app_env' => (string) config('app.env'),
                'app_debug' => (bool) config('app.debug'),
                'app_url' => (string) config('app.url'),
                'db_driver' => $dbDriver,
                'db_status' => $dbStatus,
                'cache_driver' => (string) config('cache.default'),
                'queue_driver' => (string) config('queue.default'),
                'mail_driver' => (string) config('mail.default'),
                'log_channel' => (string) config('logging.default'),
                'storage_linked' => $storageLinked,
                'maintenance_mode' => app()->isDownForMaintenance(),
                'disk_free_gb' => round($freeBytes / 1073741824, 2),
                'disk_total_gb' => round($totalBytes / 1073741824, 2),
                'zip_available' => class_exists(ZipArchive::class),
                'extensions' => [
                    'bcmath' => extension_loaded('bcmath'),
                    'mbstring' => extension_loaded('mbstring'),
                    'openssl' => extension_loaded('openssl'),
                    'pdo' => extension_loaded('pdo'),
                    'gd' => extension_loaded('gd'),
                    'imagick' => extension_loaded('imagick'),
                    'zip' => extension_loaded('zip'),
                ],
                'pending_jobs' => $pendingJobs,
                'failed_jobs' => $failedJobs,
            ],
            'backups' => $this->backupService->listBackups(),
        ]);
    }

    public function runAction(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'action' => ['required', 'string', 'in:cache_clear,config_clear,route_clear,view_clear,optimize_clear,optimize,storage_link,auth_clear_resets,queue_retry,queue_flush,maintenance_down,maintenance_up'],
            'secret' => ['nullable', 'string', 'max:64', 'regex:/^[A-Za-z0-9_-]+$/'],
        ]);

        $action = $validated['action'];
        $message = '';

        try {
            switch ($action) {
                case 'cache_clear':
                    Artisan::call('cache:clear');
                    $message = 'Application cache cleared.';
                    break;
                case 'config_clear':
                    Artisan::call('config:clear');
                    $message = 'Configuration cache cleared.';
                    break;
                case 'route_clear':
                    Artisan::call('route:clear');
                    $message = 'Route cache cleared.';
                    break;
                case 'view_clear':
                    Artisan::call('view:clear');
                    $message = 'Compiled views cleared.';
                    break;
                case 'optimize_clear':
                    Artisan::call('optimize:clear');
                    $message = 'All framework caches cleared (optimize:clear).';
                    break;
                case 'optimize':
                    Artisan::call('optimize');
                    $message = 'Config, routes, and views cached for production (optimize).';
                    break;
                case 'storage_link':
                    Artisan::call('storage:link');
                    $message = 'Storage symlink verified/created.';
                    break;
                case 'auth_clear_resets':
                    Artisan::call('auth:clear-resets');
                    $message = 'Expired password reset tokens cleared.';
                    break;
                case 'queue_retry':
                    Artisan::call('queue:retry', ['id' => ['all']]);
                    $message = 'All failed jobs pushed back onto queue.';
                    break;
                case 'queue_flush':
                    Artisan::call('queue:flush');
                    $message = 'All failed jobs flushed.';
                    break;
                case 'maintenance_down':
                    $secret = $validated['secret'] ?: 'maintenance-bypass';
                    Artisan::call('down', ['--secret' => $secret]);
                    $message = "Maintenance mode enabled. Bypass URL: /{$secret}";
                    break;
                case 'maintenance_up':
                    Artisan::call('up');
                    $message = 'Application is back online (maintenance mode disabled).';
                    break;
            }
        } catch (Throwable $e) {
            return back()->with('error', 'Action failed: '.$e->getMessage());
        }

        $this->audit->log("system.{$action}", null, null, null, ['output' => trim(Artisan::output())]);

        return back()->with('success', $message);
    }

    public function createBackup(Request $request): RedirectResponse
    {
        $includeStorage = $request->boolean('include_storage');
        $result = $this->backupService->createBackup($includeStorage);

        $this->audit->log('system.backup_created', null, null, null, $result);

        return back()->with('success', "Backup created: {$result['name']} ({$result['size_human']})");
    }

    public function downloadBackup(Request $request): BinaryFileResponse
    {
        $filename = $request->string('file')->toString();
        try {
            $path = $this->backupService->resolvePath($filename);
        } catch (InvalidArgumentException) {
            abort(404);
        }

        return response()->download($path, basename($path));
    }

    public function deleteBackup(Request $request): RedirectResponse
    {
        $filename = $request->string('file')->toString();
        try {
            $this->backupService->deleteBackup($filename);
        } catch (InvalidArgumentException $e) {
            return back()->with('error', $e->getMessage());
        }

        $this->audit->log('system.backup_deleted', null, null, null, ['file' => $filename]);

        return back()->with('success', "Backup [{$filename}] deleted.");
    }

    public function restoreBackup(Request $request): RedirectResponse
    {
        $filename = $request->string('file')->toString();
        try {
            $executed = $this->backupService->restoreSqlBackup($filename);
        } catch (Throwable $e) {
            return back()->with('error', 'Restore failed: '.$e->getMessage());
        }

        $this->audit->log('system.backup_restored', null, null, null, [
            'file' => $filename,
            'statements' => $executed,
        ]);

        return back()->with('success', "Backup [{$filename}] restored ({$executed} SQL statements executed).");
    }

    public function diagnosticsReport(InstallerService $installer, LicenseService $licenses): JsonResponse
    {
        $req = $installer->checkRequirements();
        $license = $licenses->status();

        $report = [
            'generated_at' => now()->toIso8601String(),
            'product' => [
                'name' => config('product.name'),
                'version' => config('product.version'),
                'edition' => config('product.edition'),
            ],
            'environment' => [
                'app_env' => config('app.env'),
                'app_debug' => (bool) config('app.debug'),
                'php_version' => PHP_VERSION,
                'laravel_version' => app()->version(),
                'db_driver' => config('database.default'),
                'cache_driver' => config('cache.default'),
                'queue_driver' => config('queue.default'),
                'mail_driver' => config('mail.default'),
                'installed' => $installer->isInstalled(),
            ],
            'license' => [
                'status' => $license['status'],
                'type' => $license['type'],
                'domain' => $license['domain'],
            ],
            'requirements' => $req['items'],
        ];

        return response()->json($report, 200, [
            'Content-Disposition' => 'attachment; filename="diagnostic-report-'.now()->format('Ymd-His').'.json"',
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    }
}
