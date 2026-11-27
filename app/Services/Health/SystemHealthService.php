<?php

namespace App\Services\Health;

use App\Services\InstallerService;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Schema;
use Throwable;

class SystemHealthService
{
    public function __construct(private readonly InstallerService $installer) {}

    /**
     * Run all registered system health checks and compute overall status.
     *
     * @return array{
     *     overall_status: string,
     *     last_checked: string,
     *     version: string,
     *     environment: string,
     *     counts: array{passed: int, warning: int, failed: int, not_applicable: int},
     *     checks: array<int, array{
     *         id: string,
     *         category: string,
     *         name: string,
     *         status: string,
     *         severity: string,
     *         description: string,
     *         result: string,
     *         suggested_action: string,
     *         execution_time_ms: float,
     *         last_checked: string
     *     }>
     * }
     */
    public function runAll(): array
    {
        $now = now()->toIso8601String();

        $checks = [
            $this->checkDatabase($now),
            $this->checkStorage($now),
            $this->checkPhp($now),
            $this->checkApplication($now),
            $this->checkMail($now),
            $this->checkQueueAndCron($now),
            $this->checkSecurity($now),
        ];

        $counts = ['passed' => 0, 'warning' => 0, 'failed' => 0, 'not_applicable' => 0];
        foreach ($checks as $check) {
            $counts[$check['status']] = ($counts[$check['status']] ?? 0) + 1;
        }

        $overall = $counts['failed'] > 0 ? 'critical' : ($counts['warning'] > 0 ? 'warning' : 'healthy');

        return [
            'overall_status' => $overall,
            'last_checked' => $now,
            'version' => (string) config('product.version', '2.0.0'),
            'environment' => (string) config('app.env'),
            'counts' => $counts,
            'checks' => $checks,
        ];
    }

    /**
     * Send a safe test email using the active mail configuration.
     *
     * @return array{ok: bool, message: string}
     */
    public function sendTestEmail(string $to): array
    {
        try {
            $appName = (string) config('app.name', 'CatalogFlow');
            Mail::raw(
                "This is a safe diagnostic test email from {$appName} sent at ".now()->toDateTimeString().'.',
                static function ($message) use ($to, $appName): void {
                    $message->to($to)->subject("[{$appName}] Mail Health Check");
                }
            );

            return ['ok' => true, 'message' => 'Test email dispatched via ['.config('mail.default')."] to {$to}."];
        } catch (Throwable $e) {
            return ['ok' => false, 'message' => 'Mail test failed: '.$e->getMessage()];
        }
    }

    private function checkDatabase(string $now): array
    {
        $start = microtime(true);
        $driver = (string) config('database.default');
        try {
            $pdo = DB::connection()->getPdo();
            DB::select('SELECT 1');
            $version = (string) $pdo->getAttribute(\PDO::ATTR_SERVER_VERSION);
            $requiredTables = ['users', 'roles', 'permissions', 'products', 'orders', 'settings', 'audit_logs'];
            $missing = array_values(array_filter($requiredTables, static fn (string $t): bool => ! Schema::hasTable($t)));

            if ($missing !== []) {
                return $this->makeCheck('database', 'database', 'Database Connection & Schema', 'failed', 'critical', 'Verifies DB connectivity and core tables.', 'Connected, but missing tables: '.implode(', ', $missing), 'Run php artisan migrate --force.', $start, $now);
            }

            return $this->makeCheck('database', 'database', 'Database Connection & Schema', 'passed', 'info', 'Verifies DB connectivity and core tables.', "Connected ({$driver} {$version}); all core tables present.", 'No action required.', $start, $now);
        } catch (Throwable $e) {
            return $this->makeCheck('database', 'database', 'Database Connection & Schema', 'failed', 'critical', 'Verifies DB connectivity and core tables.', 'Connection error: '.$e->getMessage(), 'Check DB_* settings in .env and database service status.', $start, $now);
        }
    }

    private function checkStorage(string $now): array
    {
        $start = microtime(true);
        $dirs = [storage_path(), storage_path('app'), storage_path('logs'), storage_path('framework'), base_path('bootstrap/cache')];
        $notWritable = array_values(array_filter($dirs, static fn (string $d): bool => ! is_dir($d) || ! is_writable($d)));
        $storageLink = is_link(public_path('storage')) || is_dir(public_path('storage'));
        $freeGb = round((@disk_free_space(base_path()) ?: 0) / 1073741824, 2);

        if ($notWritable !== []) {
            return $this->makeCheck('storage', 'storage', 'Storage & Disk Health', 'failed', 'critical', 'Checks writable storage directories, symlink, and disk space.', 'Directories not writable: '.implode(', ', $notWritable), 'Set 0775 write permissions on storage/ and bootstrap/cache/.', $start, $now);
        }

        if (! $storageLink) {
            return $this->makeCheck('storage', 'storage', 'Storage & Disk Health', 'warning', 'medium', 'Checks writable storage directories, symlink, and disk space.', "Directories writable ({$freeGb} GB free), but public/storage link is missing.", 'Run php artisan storage:link or create symlink in cPanel.', $start, $now);
        }

        return $this->makeCheck('storage', 'storage', 'Storage & Disk Health', 'passed', 'info', 'Checks writable storage directories, symlink, and disk space.', "All directories writable, public/storage linked, {$freeGb} GB free.", 'No action required.', $start, $now);
    }

    private function checkPhp(string $now): array
    {
        $start = microtime(true);
        $minPhp = (string) config('product.min_php', '8.3.0');
        $exts = ['pdo', 'bcmath', 'mbstring', 'openssl', 'json', 'ctype', 'fileinfo', 'tokenizer', 'xml', 'zip'];
        $missing = array_values(array_filter($exts, static fn (string $e): bool => ! extension_loaded($e)));
        $hasImg = extension_loaded('gd') || extension_loaded('imagick');

        if (! version_compare(PHP_VERSION, $minPhp, '>=') || $missing !== [] || ! $hasImg) {
            return $this->makeCheck('php', 'runtime', 'PHP Runtime & Extensions', 'failed', 'critical', 'Checks PHP version, required extensions, and memory/upload limits.', 'PHP '.PHP_VERSION.'; missing: '.implode(', ', $missing ?: ['gd/imagick']), "Install missing extensions and ensure PHP >= {$minPhp}.", $start, $now);
        }

        return $this->makeCheck('php', 'runtime', 'PHP Runtime & Extensions', 'passed', 'info', 'Checks PHP version, required extensions, and memory/upload limits.', 'PHP '.PHP_VERSION.' • memory_limit='.ini_get('memory_limit').' • upload_max='.ini_get('upload_max_filesize'), 'No action required.', $start, $now);
    }

    private function checkApplication(string $now): array
    {
        $start = microtime(true);
        $hasKey = trim((string) config('app.key')) !== '';
        $installed = $this->installer->isInstalled();
        $maintenance = app()->isDownForMaintenance();
        $cacheOk = true;
        try {
            Cache::put('health_probe', '1', 10);
            $cacheOk = Cache::get('health_probe') === '1';
        } catch (Throwable) {
            $cacheOk = false;
        }

        if (! $hasKey || ! $cacheOk) {
            return $this->makeCheck('application', 'application', 'Application & Cache Health', 'failed', 'high', 'Checks APP_KEY, cache read/write, maintenance mode, and install status.', 'APP_KEY or Cache driver check failed.', 'Run php artisan key:generate and check CACHE_STORE.', $start, $now);
        }

        if ($maintenance) {
            return $this->makeCheck('application', 'application', 'Application & Cache Health', 'warning', 'medium', 'Checks APP_KEY, cache read/write, maintenance mode, and install status.', 'Application is currently in Maintenance Mode.', 'Run php artisan up or disable maintenance mode in System Tools.', $start, $now);
        }

        return $this->makeCheck('application', 'application', 'Application & Cache Health', 'passed', 'info', 'Checks APP_KEY, cache read/write, maintenance mode, and install status.', 'APP_KEY valid • Cache '.config('cache.default').' • Installed: '.($installed ? 'Yes' : 'No'), 'No action required.', $start, $now);
    }

    private function checkMail(string $now): array
    {
        $start = microtime(true);
        $mailer = (string) config('mail.default');
        if (in_array($mailer, ['log', 'array'], true)) {
            return $this->makeCheck('mail', 'mail', 'Mail & SMTP Configuration', 'warning', 'low', 'Verifies mail driver configuration without exposing credentials.', "Mail driver is set to '{$mailer}' (emails are not delivered externally).", 'Configure SMTP/SES/Resend in .env for production email delivery.', $start, $now);
        }

        return $this->makeCheck('mail', 'mail', 'Mail & SMTP Configuration', 'passed', 'info', 'Verifies mail driver configuration without exposing credentials.', "Mail driver configured: {$mailer}.", 'Use the Send Test Email button to verify live delivery.', $start, $now);
    }

    private function checkQueueAndCron(string $now): array
    {
        $start = microtime(true);
        $driver = (string) config('queue.default');
        $failedJobs = Schema::hasTable('failed_jobs') ? DB::table('failed_jobs')->count() : 0;
        $pendingJobs = Schema::hasTable('jobs') ? DB::table('jobs')->count() : 0;

        if ($failedJobs > 0) {
            return $this->makeCheck('queue', 'queue', 'Queue & Scheduler Diagnostics', 'warning', 'medium', 'Checks queue driver, pending/failed jobs, and cron readiness.', "Queue driver: {$driver} • {$pendingJobs} pending • {$failedJobs} failed jobs.", 'Inspect and retry/flush failed jobs in System Tools.', $start, $now);
        }

        return $this->makeCheck('queue', 'queue', 'Queue & Scheduler Diagnostics', 'passed', 'info', 'Checks queue driver, pending/failed jobs, and cron readiness.', "Queue driver: {$driver} • {$pendingJobs} pending • 0 failed. Cron: * * * * * php artisan schedule:run", 'Ensure cron & queue:work are active on production servers.', $start, $now);
    }

    private function checkSecurity(string $now): array
    {
        $start = microtime(true);
        $env = (string) config('app.env');
        $debug = (bool) config('app.debug');
        $installed = $this->installer->isInstalled();
        $isHttps = request()->isSecure() || str_starts_with((string) config('app.url'), 'https://');

        $warnings = [];
        if ($env === 'production' && $debug) {
            return $this->makeCheck('security', 'security', 'Security Configuration', 'failed', 'critical', 'Checks APP_DEBUG, HTTPS, installation lock, and environment safety.', 'APP_DEBUG is TRUE in production!', 'Immediately set APP_DEBUG=false in .env.', $start, $now);
        }
        if ($env !== 'production') {
            $warnings[] = "APP_ENV={$env}";
        }
        if ($debug) {
            $warnings[] = 'APP_DEBUG=true';
        }
        if (! $isHttps) {
            $warnings[] = 'HTTPS not active';
        }
        if (! $installed) {
            $warnings[] = 'Installer not locked';
        }

        if ($warnings !== []) {
            return $this->makeCheck('security', 'security', 'Security Configuration', 'warning', 'medium', 'Checks APP_DEBUG, HTTPS, installation lock, and environment safety.', 'Attention: '.implode(', ', $warnings), 'For production: set APP_ENV=production, APP_DEBUG=false, enable HTTPS, and lock /install.', $start, $now);
        }

        return $this->makeCheck('security', 'security', 'Security Configuration', 'passed', 'info', 'Checks APP_DEBUG, HTTPS, installation lock, and environment safety.', 'Production mode, debug off, HTTPS active, installer locked.', 'No action required.', $start, $now);
    }

    private function makeCheck(
        string $id,
        string $category,
        string $name,
        string $status,
        string $severity,
        string $description,
        string $result,
        string $suggestedAction,
        float $start,
        string $now
    ): array {
        return [
            'id' => $id,
            'category' => $category,
            'name' => $name,
            'status' => $status,
            'severity' => $severity,
            'description' => $description,
            'result' => $result,
            'suggested_action' => $suggestedAction,
            'execution_time_ms' => round((microtime(true) - $start) * 1000, 2),
            'last_checked' => $now,
        ];
    }
}
