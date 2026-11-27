<?php

namespace App\Services;

use App\Models\LicenseActivation;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Schema;
use Throwable;

class LicenseService
{
    public const TYPES = ['single', 'multi', 'developer', 'lifetime', 'subscription'];

    public function __construct(private readonly SettingsService $settings) {}

    /**
     * @return array{
     *     status: string,
     *     type: string|null,
     *     domain: string|null,
     *     masked_key: string|null,
     *     activated_at: string|null,
     *     expires_at: string|null,
     *     last_checked_at: string|null,
     *     in_grace_period: bool,
     *     server_configured: bool
     * }
     */
    public function status(): array
    {
        $payload = $this->readPayload();
        $serverConfigured = trim((string) config('product.license_server_url', '')) !== '';

        if (! $payload) {
            return [
                'status' => 'inactive',
                'type' => null,
                'domain' => null,
                'masked_key' => null,
                'activated_at' => null,
                'expires_at' => null,
                'last_checked_at' => null,
                'in_grace_period' => false,
                'server_configured' => $serverConfigured,
            ];
        }

        $graceDays = (int) config('product.license_grace_days', 14);
        $lastChecked = isset($payload['last_checked_at']) ? strtotime((string) $payload['last_checked_at']) : false;
        $inGrace = $lastChecked !== false && (time() - $lastChecked) <= ($graceDays * 86400);

        return [
            'status' => (string) ($payload['status'] ?? 'active'),
            'type' => $payload['type'] ?? 'single',
            'domain' => $payload['domain'] ?? null,
            'masked_key' => $this->maskKey((string) ($payload['key'] ?? '')),
            'activated_at' => $payload['activated_at'] ?? null,
            'expires_at' => $payload['expires_at'] ?? null,
            'last_checked_at' => $payload['last_checked_at'] ?? null,
            'in_grace_period' => $inGrace,
            'server_configured' => $serverConfigured,
        ];
    }

    /**
     * @return array{ok: bool, message: string}
     */
    public function activate(string $licenseKey, string $type, string $domain): array
    {
        $normalizedKey = strtoupper(trim($licenseKey));
        if (! preg_match('/^[A-Z0-9]{4}(-[A-Z0-9]{4}){2,5}$/', $normalizedKey)) {
            return ['ok' => false, 'message' => 'Invalid license key format (expected XXXX-XXXX-XXXX-XXXX).'];
        }

        if (! in_array($type, self::TYPES, true)) {
            return ['ok' => false, 'message' => 'Unsupported license type.'];
        }

        $serverUrl = trim((string) config('product.license_server_url', ''));
        $expiresAt = $type === 'subscription' ? now()->addYear()->toIso8601String() : null;
        $modeNote = 'Activated in offline/local verification mode (no remote license server configured).';

        if ($serverUrl !== '') {
            try {
                $response = Http::timeout(8)->acceptJson()->post(rtrim($serverUrl, '/').'/api/licenses/activate', [
                    'license_key' => $normalizedKey,
                    'domain' => $domain,
                    'product' => config('product.name'),
                    'version' => config('product.version'),
                ]);

                if (! $response->successful() || ! ($response->json('valid') ?? false)) {
                    return ['ok' => false, 'message' => (string) ($response->json('message') ?? 'License server rejected activation.')];
                }

                $expiresAt = $response->json('expires_at') ?? $expiresAt;
                $modeNote = 'License verified and bound to domain via license server.';
            } catch (Throwable) {
                return ['ok' => false, 'message' => 'Unable to reach license server. Please try again later.'];
            }
        }

        $this->writePayload([
            'key' => $normalizedKey,
            'type' => $type,
            'domain' => $domain,
            'status' => 'active',
            'activated_at' => now()->toIso8601String(),
            'expires_at' => $expiresAt,
            'last_checked_at' => now()->toIso8601String(),
        ]);

        $this->recordHistory($this->maskKey($normalizedKey), $type, $domain, 'activated', 'active', $modeNote);

        return ['ok' => true, 'message' => $modeNote];
    }

    public function deactivate(): void
    {
        $cur = $this->readPayload();
        $this->settings->set('license_payload', '', 'licensing', 'secret', false);
        $this->recordHistory(
            $cur ? $this->maskKey((string) ($cur['key'] ?? '')) : '****',
            (string) ($cur['type'] ?? 'single'),
            (string) ($cur['domain'] ?? request()->getHost()),
            'deactivated',
            'inactive',
            'License deactivated from domain.'
        );
    }

    private function recordHistory(string $maskedKey, string $type, string $domain, string $action, string $status, string $message): void
    {
        if (! Schema::hasTable('license_activations')) {
            return;
        }

        LicenseActivation::query()->create([
            'license_key_masked' => $maskedKey,
            'license_type' => $type,
            'domain' => $domain,
            'action' => $action,
            'status' => $status,
            'message' => $message,
            'created_by' => Auth::guard('web')->id(),
            'created_at' => now(),
        ]);
    }

    /**
     * @return array<string, mixed>|null
     */
    private function readPayload(): ?array
    {
        $raw = (string) $this->settings->get('license_payload', '');
        if ($raw === '') {
            return null;
        }

        try {
            $decoded = json_decode(Crypt::decryptString($raw), true);

            return is_array($decoded) ? $decoded : null;
        } catch (Throwable) {
            return null;
        }
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function writePayload(array $payload): void
    {
        $encrypted = Crypt::encryptString((string) json_encode($payload));
        $this->settings->set('license_payload', $encrypted, 'licensing', 'secret', false);
    }

    private function maskKey(string $key): string
    {
        if (strlen($key) <= 8) {
            return str_repeat('*', strlen($key));
        }

        return substr($key, 0, 4).'-****-****-'.substr($key, -4);
    }
}
