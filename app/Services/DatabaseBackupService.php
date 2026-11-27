<?php

namespace App\Services;

use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use InvalidArgumentException;
use PDO;
use ZipArchive;

class DatabaseBackupService
{
    private const BACKUP_DIR = 'app/backups';

    /**
     * List existing backup files sorted newest first.
     *
     * @return array<int, array{name: string, size: int, size_human: string, created_at: string, type: string}>
     */
    public function listBackups(): array
    {
        $dir = storage_path(self::BACKUP_DIR);
        if (! is_dir($dir)) {
            return [];
        }

        $items = [];
        foreach (File::files($dir) as $file) {
            $ext = strtolower($file->getExtension());
            if (! in_array($ext, ['sql', 'zip'], true)) {
                continue;
            }

            $size = $file->getSize();
            $items[] = [
                'name' => $file->getFilename(),
                'size' => $size,
                'size_human' => $this->formatBytes($size),
                'created_at' => Carbon::createFromTimestamp($file->getMTime())->toDateTimeString(),
                'type' => $ext === 'zip' ? 'full' : 'database',
                '_mtime' => $file->getMTime(),
            ];
        }

        usort($items, static fn (array $a, array $b): int => $b['_mtime'] <=> $a['_mtime']);

        return array_map(static function (array $item): array {
            unset($item['_mtime']);

            return $item;
        }, $items);
    }

    /**
     * Create a database SQL dump, or a full ZIP (SQL dump + public storage files).
     *
     * @return array{name: string, size_human: string}
     */
    public function createBackup(bool $includeStorage = false): array
    {
        $dir = storage_path(self::BACKUP_DIR);
        if (! is_dir($dir)) {
            File::makeDirectory($dir, 0755, true);
        }

        $timestamp = now()->format('Y-m-d_His');
        $sqlContent = $this->generateSqlDump();

        if ($includeStorage && class_exists(ZipArchive::class)) {
            $filename = "backup_full_{$timestamp}.zip";
            $zipPath = $dir.DIRECTORY_SEPARATOR.$filename;

            $zip = new ZipArchive;
            if ($zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) === true) {
                $zip->addFromString("database_{$timestamp}.sql", $sqlContent);

                $publicStorage = storage_path('app/public');
                if (is_dir($publicStorage)) {
                    foreach (File::allFiles($publicStorage) as $file) {
                        $relative = str_replace('\\', '/', $file->getRelativePathname());
                        $zip->addFile($file->getRealPath(), 'storage/'.$relative);
                    }
                }

                $zip->close();

                return [
                    'name' => $filename,
                    'size_human' => $this->formatBytes((int) filesize($zipPath)),
                ];
            }
        }

        $filename = "backup_db_{$timestamp}.sql";
        $sqlPath = $dir.DIRECTORY_SEPARATOR.$filename;
        file_put_contents($sqlPath, $sqlContent);

        return [
            'name' => $filename,
            'size_human' => $this->formatBytes((int) filesize($sqlPath)),
        ];
    }

    public function resolvePath(string $filename): string
    {
        $clean = basename($filename);
        $ext = strtolower(pathinfo($clean, PATHINFO_EXTENSION));
        if ($clean === '' || $clean !== $filename || ! in_array($ext, ['sql', 'zip'], true)) {
            throw new InvalidArgumentException('Invalid backup filename.');
        }

        $dir = realpath(storage_path(self::BACKUP_DIR));
        if ($dir === false) {
            throw new InvalidArgumentException('Backups directory does not exist.');
        }

        $real = realpath($dir.DIRECTORY_SEPARATOR.$clean);
        if ($real === false || ! str_starts_with($real, $dir.DIRECTORY_SEPARATOR) || ! is_file($real)) {
            throw new InvalidArgumentException('Backup file not found.');
        }

        return $real;
    }

    public function deleteBackup(string $filename): void
    {
        $path = $this->resolvePath($filename);
        @unlink($path);
    }

    /**
     * Validate and restore a SQL backup file into the active database connection.
     */
    public function restoreSqlBackup(string $filename): int
    {
        $path = $this->resolvePath($filename);
        if (strtolower(pathinfo($path, PATHINFO_EXTENSION)) !== 'sql') {
            throw new InvalidArgumentException('Only .sql backup files can be restored directly.');
        }

        $sql = (string) file_get_contents($path);
        if (trim($sql) === '' || (! str_contains($sql, 'INSERT INTO') && ! str_contains($sql, 'CREATE TABLE'))) {
            throw new InvalidArgumentException('Backup file failed integrity validation (empty or invalid SQL dump).');
        }

        $connection = DB::connection();
        $driver = $connection->getDriverName();
        $pdo = $connection->getPdo();

        $cleanSql = implode("\n", array_filter(
            preg_split('/\r?\n/', $sql) ?: [],
            static fn (string $line): bool => ! str_starts_with(ltrim($line), '--')
        ));

        $statements = array_filter(
            array_map('trim', preg_split('/;\s*(?:\r?\n|$)/', $cleanSql) ?: []),
            static fn (string $stmt): bool => $stmt !== ''
        );

        if ($driver === 'mysql') {
            $pdo->exec('SET FOREIGN_KEY_CHECKS=0');
        } elseif ($driver === 'sqlite') {
            $pdo->exec('PRAGMA foreign_keys=OFF');
        }

        $executed = 0;
        try {
            foreach ($statements as $statement) {
                if (preg_match('/^(SET FOREIGN_KEY_CHECKS|DROP TABLE|CREATE TABLE|INSERT INTO)\b/i', $statement) !== 1) {
                    continue;
                }
                $pdo->exec($statement);
                $executed++;
            }
        } finally {
            if ($driver === 'mysql') {
                $pdo->exec('SET FOREIGN_KEY_CHECKS=1');
            } elseif ($driver === 'sqlite') {
                $pdo->exec('PRAGMA foreign_keys=ON');
            }
        }

        return $executed;
    }

    /**
     * Generate a portable SQL dump using PDO so it works on both MySQL and SQLite.
     */
    private function generateSqlDump(): string
    {
        $connection = DB::connection();
        $driver = $connection->getDriverName();
        $pdo = $connection->getPdo();

        $lines = [
            '-- '.config('product.name', 'CatalogFlow Commerce').' Database Backup',
            '-- Generated at: '.now()->toIso8601String(),
            '-- Driver: '.$driver,
            '',
        ];

        if ($driver === 'mysql') {
            $lines[] = 'SET FOREIGN_KEY_CHECKS=0;';
            $lines[] = '';
            $tables = array_map(static fn (array $row): string => (string) array_values($row)[0], $pdo->query('SHOW TABLES')->fetchAll(PDO::FETCH_ASSOC));
        } else {
            $tables = $pdo->query("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
                ->fetchAll(PDO::FETCH_COLUMN);
        }

        foreach ($tables as $table) {
            $quotedTable = $this->quoteIdentifier((string) $table, $driver);
            $lines[] = "-- Table: {$table}";
            $lines[] = "DROP TABLE IF EXISTS {$quotedTable};";

            if ($driver === 'mysql') {
                $createRow = $pdo->query("SHOW CREATE TABLE {$quotedTable}")->fetch(PDO::FETCH_ASSOC);
                $createSql = $createRow['Create Table'] ?? '';
                if ($createSql !== '') {
                    $lines[] = $createSql.';';
                }
            } else {
                $stmt = $pdo->prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name = ?");
                $stmt->execute([$table]);
                $createSql = (string) $stmt->fetchColumn();
                if ($createSql !== '') {
                    $lines[] = $createSql.';';
                }
            }

            $rows = $pdo->query("SELECT * FROM {$quotedTable}")->fetchAll(PDO::FETCH_ASSOC);
            foreach ($rows as $row) {
                $cols = array_map(fn (string $col): string => $this->quoteIdentifier($col, $driver), array_keys($row));
                $vals = array_map(static function (mixed $val) use ($pdo): string {
                    if ($val === null) {
                        return 'NULL';
                    }
                    if (is_bool($val)) {
                        return $val ? '1' : '0';
                    }
                    if (is_int($val) || is_float($val)) {
                        return (string) $val;
                    }

                    return $pdo->quote((string) $val);
                }, array_values($row));

                $lines[] = sprintf(
                    'INSERT INTO %s (%s) VALUES (%s);',
                    $quotedTable,
                    implode(', ', $cols),
                    implode(', ', $vals)
                );
            }

            $lines[] = '';
        }

        if ($driver === 'mysql') {
            $lines[] = 'SET FOREIGN_KEY_CHECKS=1;';
        }

        return implode("\n", $lines)."\n";
    }

    private function quoteIdentifier(string $identifier, string $driver): string
    {
        return $driver === 'mysql'
            ? '`'.str_replace('`', '``', $identifier).'`'
            : '"'.str_replace('"', '""', $identifier).'"';
    }

    private function formatBytes(int $bytes): string
    {
        if ($bytes < 1024) {
            return $bytes.' B';
        }
        if ($bytes < 1048576) {
            return round($bytes / 1024, 1).' KB';
        }

        return round($bytes / 1048576, 2).' MB';
    }
}
