<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use PDO;
use Throwable;

class InstallerService
{
    public function isInstalled(): bool
    {
        if (file_exists($this->lockFilePath())) {
            return true;
        }

        // Secondary DB-level guard: even if lock file is deleted, block re-install if an owner already exists
        try {
            if (Schema::hasTable('users') && Schema::hasTable('roles')) {
                return User::query()
                    ->whereHas('roles', static fn ($q) => $q->where('slug', 'super-admin'))
                    ->exists();
            }
        } catch (Throwable) {
            return false;
        }

        return false;
    }

    public function lockFilePath(): string
    {
        return storage_path('installed');
    }

    public function markInstalled(): void
    {
        $payload = [
            'product' => config('product.name', 'CatalogFlow Commerce'),
            'version' => config('product.version', '2.0.0'),
            'installed_at' => now()->toIso8601String(),
            'token' => hash('sha256', (string) config('app.key').'|'.Str::random(32)),
        ];

        File::put($this->lockFilePath(), json_encode($payload, JSON_PRETTY_PRINT));
    }

    /**
     * Evaluate actual server requirements, extensions, limits, and directory permissions.
     *
     * @return array{
     *     can_continue: bool,
     *     items: array<int, array{name: string, category: string, status: string, current: string, required: string, fix: string}>
     * }
     */
    public function checkRequirements(): array
    {
        $items = [];
        $minPhp = (string) config('product.min_php', '8.3.0');
        $phpOk = version_compare(PHP_VERSION, $minPhp, '>=');

        $items[] = [
            'name' => 'PHP Version',
            'category' => 'runtime',
            'status' => $phpOk ? 'passed' : 'failed',
            'current' => PHP_VERSION,
            'required' => ">= {$minPhp}",
            'fix' => "Upgrade PHP to {$minPhp} or higher in cPanel MultiPHP Manager or server CLI.",
        ];

        $requiredExtensions = [
            'pdo' => 'Enable PDO extension in php.ini.',
            'pdo_mysql' => 'Enable pdo_mysql extension for MySQL/MariaDB support.',
            'bcmath' => 'Enable bcmath extension for exact decimal money calculations.',
            'mbstring' => 'Enable mbstring extension.',
            'openssl' => 'Enable openssl extension.',
            'json' => 'Enable json extension.',
            'ctype' => 'Enable ctype extension.',
            'fileinfo' => 'Enable fileinfo extension for safe file/image uploads.',
            'tokenizer' => 'Enable tokenizer extension.',
            'xml' => 'Enable xml extension.',
            'zip' => 'Enable zip extension for full backup archives.',
        ];

        foreach ($requiredExtensions as $ext => $fix) {
            $loaded = extension_loaded($ext);
            $items[] = [
                'name' => "PHP Extension: {$ext}",
                'category' => 'extensions',
                'status' => $loaded ? 'passed' : 'failed',
                'current' => $loaded ? 'Enabled' : 'Missing',
                'required' => 'Enabled',
                'fix' => $fix,
            ];
        }

        $imageOk = extension_loaded('gd') || extension_loaded('imagick');
        $items[] = [
            'name' => 'Image Processing (GD or Imagick)',
            'category' => 'extensions',
            'status' => $imageOk ? 'passed' : 'failed',
            'current' => extension_loaded('imagick') ? 'Imagick' : (extension_loaded('gd') ? 'GD' : 'None'),
            'required' => 'GD or Imagick',
            'fix' => 'Enable either php-gd or php-imagick extension.',
        ];

        $symlinkAvailable = function_exists('symlink');
        $items[] = [
            'name' => 'PHP Function: symlink()',
            'category' => 'functions',
            'status' => $symlinkAvailable ? 'passed' : 'warning',
            'current' => $symlinkAvailable ? 'Available' : 'Disabled',
            'required' => 'Recommended for storage:link',
            'fix' => 'If disabled on shared hosting, create the public/storage symlink via cPanel File Manager or Cron.',
        ];

        $memoryLimit = (string) ini_get('memory_limit');
        $items[] = [
            'name' => 'PHP Memory Limit',
            'category' => 'limits',
            'status' => $this->parseBytes($memoryLimit) >= 128 * 1024 * 1024 || $memoryLimit === '-1' ? 'passed' : 'warning',
            'current' => $memoryLimit ?: 'Unknown',
            'required' => '>= 128M',
            'fix' => 'Increase memory_limit to at least 256M in php.ini.',
        ];

        $uploadMax = (string) ini_get('upload_max_filesize');
        $items[] = [
            'name' => 'Max Upload Filesize',
            'category' => 'limits',
            'status' => $this->parseBytes($uploadMax) >= 8 * 1024 * 1024 ? 'passed' : 'warning',
            'current' => $uploadMax ?: 'Unknown',
            'required' => '>= 8M',
            'fix' => 'Set upload_max_filesize and post_max_size to 16M+.',
        ];

        $dirs = [
            'storage' => storage_path(),
            'storage/app' => storage_path('app'),
            'storage/logs' => storage_path('logs'),
            'storage/framework' => storage_path('framework'),
            'bootstrap/cache' => base_path('bootstrap/cache'),
            'public' => public_path(),
        ];

        foreach ($dirs as $label => $path) {
            $writable = is_dir($path) && is_writable($path);
            $items[] = [
                'name' => "Writable Directory: {$label}",
                'category' => 'permissions',
                'status' => $writable ? 'passed' : 'failed',
                'current' => $writable ? 'Writable' : 'Not Writable',
                'required' => 'Writable (0755 / 0775)',
                'fix' => "Run chmod -R 775 {$label} or set write permissions in File Manager.",
            ];
        }

        $hasFailure = collect($items)->contains(static fn (array $item): bool => $item['status'] === 'failed');

        return [
            'can_continue' => ! $hasFailure,
            'items' => $items,
        ];
    }

    /**
     * Test a database connection directly via PDO without mutating .env.
     *
     * @return array{ok: bool, message: string, version?: string}
     */
    public function testDatabaseConnection(string $host, int $port, string $database, string $username, ?string $password): array
    {
        try {
            $dsn = sprintf('mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4', $host, $port, $database);
            $pdo = new PDO($dsn, $username, (string) $password, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_TIMEOUT => 5,
            ]);
            $version = (string) $pdo->getAttribute(PDO::ATTR_SERVER_VERSION);

            return [
                'ok' => true,
                'message' => "Connected successfully (MySQL/MariaDB {$version}).",
                'version' => $version,
            ];
        } catch (Throwable $e) {
            return [
                'ok' => false,
                'message' => 'Connection failed: '.$e->getMessage(),
            ];
        }
    }

    /**
     * Safely create or update .env with a backup of any existing .env file.
     *
     * @param  array<string, string>  $values
     */
    public function writeEnvSafely(array $values): void
    {
        $envPath = base_path('.env');
        $examplePath = base_path('.env.example');

        if (file_exists($envPath)) {
            $backupPath = storage_path('app/.env.backup.'.now()->format('YmdHis'));
            File::ensureDirectoryExists(dirname($backupPath));
            File::copy($envPath, $backupPath);
            $content = File::get($envPath);
        } elseif (file_exists($examplePath)) {
            $content = File::get($examplePath);
        } else {
            $content = "APP_NAME=MyStore\nAPP_ENV=production\nAPP_KEY=\nAPP_DEBUG=false\nAPP_URL=http://localhost\n";
        }

        if (! preg_match('/^APP_KEY=base64:.+$/m', $content)) {
            $values['APP_KEY'] = 'base64:'.base64_encode(random_bytes(32));
        }

        foreach ($values as $key => $value) {
            $escaped = $this->formatEnvValue($value);
            $pattern = "/^{$key}=.*$/m";
            if (preg_match($pattern, $content) === 1) {
                $content = (string) preg_replace($pattern, "{$key}={$escaped}", $content);
            } else {
                $content .= "\n{$key}={$escaped}";
            }
        }

        File::put($envPath, rtrim($content)."\n");
    }

    private function formatEnvValue(string $value): string
    {
        if ($value === '') {
            return '';
        }
        if (preg_match('/[\s#"\'\\\\]/', $value) === 1) {
            return '"'.str_replace(['\\', '"'], ['\\\\', '\\"'], $value).'"';
        }

        return $value;
    }

    private function parseBytes(string $val): int
    {
        $val = trim($val);
        if ($val === '' || $val === '-1') {
            return PHP_INT_MAX;
        }
        $last = strtolower($val[strlen($val) - 1]);
        $num = (int) $val;

        return match ($last) {
            'g' => $num * 1024 * 1024 * 1024,
            'm' => $num * 1024 * 1024,
            'k' => $num * 1024,
            default => $num,
        };
    }
}
