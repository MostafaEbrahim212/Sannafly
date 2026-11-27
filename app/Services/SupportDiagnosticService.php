<?php

namespace App\Services;

use App\Models\SupportExport;
use App\Services\Health\SystemHealthService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use InvalidArgumentException;
use Throwable;
use ZipArchive;

class SupportDiagnosticService
{
    private const EXPORT_DIR = 'app/support-exports';

    public function __construct(
        private readonly SystemHealthService $health,
        private readonly InstallerService $installer,
        private readonly LicenseService $licenses,
        private readonly SettingsService $settings,
    ) {}

    /**
     * Build a sanitized diagnostic payload with zero secrets or customer PII.
     *
     * @return array<string, mixed>
     */
    public function buildReport(): array
    {
        $healthReport = $this->health->runAll();
        $license = $this->licenses->status();
        $recentLogs = $this->readSanitizedErrorSummary();

        $dbVersion = 'unknown';
        try {
            $dbVersion = (string) DB::connection()->getPdo()->getAttribute(\PDO::ATTR_SERVER_VERSION);
        } catch (Throwable) {
        }

        $report = [
            'generated_at' => now()->toIso8601String(),
            'product' => [
                'name' => config('product.name'),
                'version' => config('product.version'),
                'edition' => config('product.edition'),
            ],
            'runtime' => [
                'php_version' => PHP_VERSION,
                'laravel_version' => app()->version(),
                'db_driver' => config('database.default'),
                'db_version' => $dbVersion,
                'app_env' => config('app.env'),
                'app_debug' => (bool) config('app.debug'),
                'installed' => $this->installer->isInstalled(),
                'extensions' => array_values(array_filter(get_loaded_extensions())),
            ],
            'drivers' => [
                'cache' => config('cache.default'),
                'queue' => config('queue.default'),
                'mail' => config('mail.default'),
                'session' => config('session.driver'),
                'broadcast' => config('broadcasting.default'),
            ],
            'modules' => [
                'ecommerce' => $this->settings->isEnabled('module_ecommerce', true),
                'cart' => $this->settings->isEnabled('module_cart', true),
                'checkout' => $this->settings->isEnabled('module_checkout', true),
                'demo_mode' => $this->settings->isEnabled('demo_mode_enabled', false),
            ],
            'license' => [
                'status' => $license['status'],
                'type' => $license['type'],
                'domain' => $license['domain'],
                'in_grace_period' => $license['in_grace_period'],
            ],
            'health' => $healthReport,
            'recent_errors_summary' => $recentLogs,
        ];

        return $this->sanitizeRecursive($report);
    }

    /**
     * Generate and persist a diagnostic export file (json, txt, or zip).
     */
    public function generateExport(string $format = 'json'): SupportExport
    {
        if (! in_array($format, ['json', 'txt', 'zip'], true)) {
            throw new InvalidArgumentException('Unsupported export format.');
        }

        $dir = storage_path(self::EXPORT_DIR);
        File::ensureDirectoryExists($dir);

        $report = $this->buildReport();
        $json = (string) json_encode($report, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        $stamp = now()->format('Y-m-d_His');

        if ($format === 'zip' && class_exists(ZipArchive::class)) {
            $filename = "support-diagnostics-{$stamp}.zip";
            $path = $dir.DIRECTORY_SEPARATOR.$filename;
            $zip = new ZipArchive;
            if ($zip->open($path, ZipArchive::CREATE | ZipArchive::OVERWRITE) === true) {
                $zip->addFromString('diagnostics.json', $json);
                $zip->addFromString('diagnostics.md', $this->toMarkdown($report));
                $zip->close();
            }
        } elseif ($format === 'txt') {
            $filename = "support-diagnostics-{$stamp}.txt";
            $path = $dir.DIRECTORY_SEPARATOR.$filename;
            file_put_contents($path, $this->toMarkdown($report));
        } else {
            $format = 'json';
            $filename = "support-diagnostics-{$stamp}.json";
            $path = $dir.DIRECTORY_SEPARATOR.$filename;
            file_put_contents($path, $json);
        }

        return SupportExport::query()->create([
            'filename' => $filename,
            'format' => $format,
            'file_size' => (int) filesize($path),
            'created_by' => Auth::guard('web')->id(),
            'created_at' => now(),
        ]);
    }

    public function resolvePath(string $filename): string
    {
        $clean = basename($filename);
        if ($clean === '' || $clean !== $filename) {
            throw new InvalidArgumentException('Invalid export filename.');
        }

        $dir = realpath(storage_path(self::EXPORT_DIR));
        if ($dir === false) {
            throw new InvalidArgumentException('Support exports directory not found.');
        }

        $real = realpath($dir.DIRECTORY_SEPARATOR.$clean);
        if ($real === false || ! str_starts_with($real, $dir.DIRECTORY_SEPARATOR) || ! is_file($real)) {
            throw new InvalidArgumentException('Export file not found.');
        }

        return $real;
    }

    public function deleteExport(SupportExport $export): void
    {
        try {
            $path = $this->resolvePath($export->filename);
            @unlink($path);
        } catch (InvalidArgumentException) {
        }
        $export->delete();
    }

    /**
     * Deeply sanitize arrays/strings to strip secrets, tokens, emails, and credentials.
     *
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    public function sanitizeRecursive(array $data): array
    {
        $sensitiveKeys = ['password', 'secret', 'token', 'api_key', 'app_key', 'hmac', 'authorization', 'cookie', 'session', 'credit_card', 'cvv'];
        $clean = [];

        foreach ($data as $key => $value) {
            $lower = strtolower((string) $key);
            $isSensitiveKey = false;
            foreach ($sensitiveKeys as $needle) {
                if (str_contains($lower, $needle)) {
                    $isSensitiveKey = true;
                    break;
                }
            }

            if ($isSensitiveKey) {
                $clean[$key] = '[REDACTED]';

                continue;
            }

            if (is_array($value)) {
                $clean[$key] = $this->sanitizeRecursive($value);
            } elseif (is_string($value)) {
                $clean[$key] = $this->sanitizeString($value);
            } else {
                $clean[$key] = $value;
            }
        }

        return $clean;
    }

    private function sanitizeString(string $text): string
    {
        $patterns = [
            '/base64:[A-Za-z0-9+\/=]{16,}/i' => '[REDACTED_APP_KEY]',
            '/Bearer\s+[A-Za-z0-9\-._~+\/]+=*/i' => 'Bearer [REDACTED]',
            '/\b(sk|pk)_(live|test)_[A-Za-z0-9]{10,}\b/i' => '[REDACTED_API_KEY]',
            '/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/' => '[REDACTED_EMAIL]',
        ];

        return (string) preg_replace(array_keys($patterns), array_values($patterns), $text);
    }

    /**
     * @return array<int, string>
     */
    private function readSanitizedErrorSummary(): array
    {
        $logFile = storage_path('logs/laravel.log');
        if (! is_file($logFile)) {
            return [];
        }

        $fp = fopen($logFile, 'rb');
        if ($fp === false) {
            return [];
        }

        $size = filesize($logFile) ?: 0;
        if ($size > 65536) {
            fseek($fp, -65536, SEEK_END);
        }
        $chunk = (string) fread($fp, 65536);
        fclose($fp);

        $lines = array_filter(
            preg_split('/\r?\n/', $chunk) ?: [],
            static fn (string $l): bool => str_contains($l, '.ERROR:') || str_contains($l, '.CRITICAL:')
        );

        return array_map(
            fn (string $l): string => mb_substr($this->sanitizeString($l), 0, 220),
            array_slice(array_values($lines), -15)
        );
    }

    /**
     * @param  array<string, mixed>  $report
     */
    private function toMarkdown(array $report): string
    {
        $lines = [
            '# Support Diagnostic Report',
            'Generated: '.($report['generated_at'] ?? ''),
            'Product: '.($report['product']['name'] ?? '').' v'.($report['product']['version'] ?? ''),
            '',
            '## Health Checks ('.($report['health']['overall_status'] ?? 'unknown').')',
        ];

        foreach ($report['health']['checks'] ?? [] as $check) {
            $lines[] = "- [{$check['status']}] **{$check['name']}**: {$check['result']}";
        }

        return implode("\n", $lines)."\n";
    }
}
