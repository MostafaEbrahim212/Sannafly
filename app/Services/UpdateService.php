<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Throwable;

class UpdateService
{
    /**
     * Check configured update manifest URL (or report offline/manual mode cleanly).
     *
     * @return array{
     *     current_version: string,
     *     release_date: string,
     *     remote_configured: bool,
     *     update_available: bool,
     *     latest_version: string|null,
     *     notes: string|null,
     *     message: string
     * }
     */
    public function check(): array
    {
        $current = (string) config('product.version', '2.0.0');
        $releaseDate = (string) config('product.release_date', '');
        $url = trim((string) config('product.update_check_url', ''));

        if ($url === '') {
            return [
                'current_version' => $current,
                'release_date' => $releaseDate,
                'remote_configured' => false,
                'update_available' => false,
                'latest_version' => null,
                'notes' => null,
                'message' => 'Remote update server is not configured (running in self-hosted/offline mode).',
            ];
        }

        try {
            $res = Http::timeout(6)->acceptJson()->get($url, [
                'product' => config('product.name'),
                'version' => $current,
            ]);

            if (! $res->successful()) {
                return [
                    'current_version' => $current,
                    'release_date' => $releaseDate,
                    'remote_configured' => true,
                    'update_available' => false,
                    'latest_version' => null,
                    'notes' => null,
                    'message' => 'Update server returned HTTP '.$res->status(),
                ];
            }

            $latest = (string) ($res->json('version') ?? $current);
            $available = version_compare($latest, $current, '>');

            return [
                'current_version' => $current,
                'release_date' => $releaseDate,
                'remote_configured' => true,
                'update_available' => $available,
                'latest_version' => $latest,
                'notes' => $res->json('notes'),
                'message' => $available ? "Update v{$latest} is available." : 'You are running the latest version.',
            ];
        } catch (Throwable $e) {
            return [
                'current_version' => $current,
                'release_date' => $releaseDate,
                'remote_configured' => true,
                'update_available' => false,
                'latest_version' => null,
                'notes' => null,
                'message' => 'Could not reach update server: '.$e->getMessage(),
            ];
        }
    }
}
