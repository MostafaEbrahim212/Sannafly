<?php

namespace App\Services;

use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\File;
use InvalidArgumentException;

class SystemLogService
{
    private const MAX_PARSE_BYTES = 2 * 1024 * 1024; // 2 MB tail read for fast UI rendering

    /**
     * List all .log files inside storage/logs sorted newest first.
     *
     * @return array<int, array{name: string, size: int, size_human: string, modified_at: string}>
     */
    public function listFiles(): array
    {
        $dir = $this->logsDirectory();
        if (! is_dir($dir)) {
            return [];
        }

        $files = [];
        foreach (File::files($dir) as $file) {
            if ($file->getExtension() !== 'log') {
                continue;
            }

            $size = $file->getSize();
            $files[] = [
                'name' => $file->getFilename(),
                'size' => $size,
                'size_human' => $this->formatBytes($size),
                'modified_at' => Carbon::createFromTimestamp($file->getMTime())->toDateTimeString(),
                '_mtime' => $file->getMTime(),
            ];
        }

        usort($files, static fn (array $a, array $b): int => $b['_mtime'] <=> $a['_mtime']);

        return array_map(static function (array $f): array {
            unset($f['_mtime']);

            return $f;
        }, $files);
    }

    /**
     * Resolve a log filename safely within storage/logs.
     */
    public function resolvePath(string $filename): string
    {
        $clean = basename($filename);
        if ($clean === '' || ! str_ends_with($clean, '.log') || $clean !== $filename) {
            throw new InvalidArgumentException('Invalid log filename.');
        }

        $dir = realpath($this->logsDirectory());
        if ($dir === false) {
            throw new InvalidArgumentException('Logs directory does not exist.');
        }

        $full = $dir.DIRECTORY_SEPARATOR.$clean;
        $real = realpath($full);
        if ($real === false || ! str_starts_with($real, $dir.DIRECTORY_SEPARATOR) || ! is_file($real)) {
            throw new InvalidArgumentException('Log file not found.');
        }

        return $real;
    }

    /**
     * Parse Monolog entries from the tail of a log file, newest first.
     *
     * @return array{
     *     entries: array<int, array{id: string, timestamp: string, env: string, level: string, message: string, context: string|null, trace: string|null}>,
     *     counts: array<string, int>,
     *     truncated: bool
     * }
     */
    public function parseFile(string $filename, ?string $level = null, ?string $search = null, int $limit = 200): array
    {
        $path = $this->resolvePath($filename);
        $size = filesize($path) ?: 0;
        $truncated = $size > self::MAX_PARSE_BYTES;

        $content = $this->readTail($path, self::MAX_PARSE_BYTES);
        $lines = preg_split("/\r\n|\n|\r/", $content) ?: [];

        // Drop potentially partial first line when reading from an offset
        if ($truncated && count($lines) > 1) {
            array_shift($lines);
        }

        $rawEntries = [];
        $current = null;
        $pattern = '/^\[(\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:[+-]\d{2}:\d{2}|Z)?)\]\s+([A-Za-z0-9_-]+)\.([A-Z]+):\s*(.*)$/';

        foreach ($lines as $line) {
            if (preg_match($pattern, $line, $m) === 1) {
                if ($current !== null) {
                    $rawEntries[] = $current;
                }

                $current = [
                    'timestamp' => $m[1],
                    'env' => $m[2],
                    'level' => strtoupper($m[3]),
                    'body' => [$m[4]],
                ];
            } elseif ($current !== null) {
                $current['body'][] = $line;
            }
        }

        if ($current !== null) {
            $rawEntries[] = $current;
        }

        $rawEntries = array_reverse($rawEntries);

        $counts = [
            'ALL' => count($rawEntries),
            'EMERGENCY' => 0,
            'ALERT' => 0,
            'CRITICAL' => 0,
            'ERROR' => 0,
            'WARNING' => 0,
            'NOTICE' => 0,
            'INFO' => 0,
            'DEBUG' => 0,
        ];

        $normalizedLevel = $level !== null && $level !== '' ? strtoupper($level) : null;
        $needle = $search !== null && trim($search) !== '' ? mb_strtolower(trim($search)) : null;

        $filtered = [];
        foreach ($rawEntries as $idx => $entry) {
            $lvl = $entry['level'];
            $counts[$lvl] = ($counts[$lvl] ?? 0) + 1;

            if ($normalizedLevel !== null && $normalizedLevel !== 'ALL' && $lvl !== $normalizedLevel) {
                continue;
            }

            $fullBody = implode("\n", $entry['body']);
            if ($needle !== null && ! str_contains(mb_strtolower($fullBody.' '.$entry['timestamp'].' '.$lvl), $needle)) {
                continue;
            }

            if (count($filtered) < $limit) {
                [$message, $context, $trace] = $this->splitBody($entry['body']);
                $filtered[] = [
                    'id' => md5($entry['timestamp'].'|'.$idx.'|'.$message),
                    'timestamp' => $entry['timestamp'],
                    'env' => $entry['env'],
                    'level' => $lvl,
                    'message' => $message,
                    'context' => $context,
                    'trace' => $trace,
                ];
            }
        }

        return [
            'entries' => $filtered,
            'counts' => $counts,
            'truncated' => $truncated,
        ];
    }

    public function clearFile(string $filename): void
    {
        $path = $this->resolvePath($filename);
        file_put_contents($path, '');
    }

    public function deleteFile(string $filename): void
    {
        $path = $this->resolvePath($filename);
        @unlink($path);
    }

    private function logsDirectory(): string
    {
        return storage_path('logs');
    }

    private function readTail(string $path, int $maxBytes): string
    {
        $size = filesize($path);
        if ($size === false || $size === 0) {
            return '';
        }

        if ($size <= $maxBytes) {
            return (string) file_get_contents($path);
        }

        $fp = fopen($path, 'rb');
        if ($fp === false) {
            return '';
        }

        fseek($fp, -$maxBytes, SEEK_END);
        $data = (string) fread($fp, $maxBytes);
        fclose($fp);

        return $data;
    }

    /**
     * @param  array<int, string>  $lines
     * @return array{0: string, 1: string|null, 2: string|null}
     */
    private function splitBody(array $lines): array
    {
        $firstLine = trim($lines[0] ?? '');
        $rest = array_slice($lines, 1);

        $message = $firstLine;
        $context = null;

        // Extract trailing JSON object from Monolog line: "Message {"key":"val"}"
        if (preg_match('/^(.*?)\s+(\{.*\})\s*$/s', $firstLine, $m) === 1) {
            $decoded = json_decode($m[2], true);
            if (is_array($decoded)) {
                $message = trim($m[1]);
                $context = (string) json_encode($decoded, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
            }
        }

        $traceText = trim(implode("\n", $rest));
        $trace = $traceText !== '' ? $traceText : null;

        return [$message !== '' ? $message : '(empty)', $context, $trace];
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
