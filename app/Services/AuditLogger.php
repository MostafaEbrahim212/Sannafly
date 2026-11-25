<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class AuditLogger
{
    /**
     * Sensitive keys that must never be persisted to audit logs.
     *
     * @var array<int, string>
     */
    private const REDACTED_KEYS = [
        'password',
        'password_confirmation',
        'remember_token',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'api_key',
        'api_secret',
        'security_key',
        'private_key',
        'access_token',
        'refresh_token',
        'authorization',
        'secret',
        'token',
        'config',
    ];

    public function log(
        string $action,
        ?string $resourceType = null,
        string|int|null $resourceId = null,
        ?array $oldValues = null,
        ?array $newValues = null,
        ?User $actor = null,
        ?Request $request = null,
        bool $afterCommit = true,
    ): ?AuditLog {
        $actor ??= Auth::guard('web')->user();
        if (! $actor instanceof User) {
            $actor = null;
        }
        $request ??= request();

        $attributes = [
            'user_id' => $actor?->id,
            'actor_name' => $actor?->name ?? 'System',
            'action' => $action,
            'resource_type' => $resourceType,
            'resource_id' => $resourceId !== null ? (string) $resourceId : null,
            'old_values' => $oldValues ? $this->sanitize($oldValues) : null,
            'new_values' => $newValues ? $this->sanitize($newValues) : null,
            'ip_address' => $request?->ip(),
            'user_agent' => $request?->userAgent() ? substr((string) $request->userAgent(), 0, 500) : null,
            'created_at' => now(),
        ];

        if ($afterCommit && DB::transactionLevel() > 0 && ! app()->runningUnitTests()) {
            DB::afterCommit(static fn () => AuditLog::query()->create($attributes));

            return null;
        }

        return AuditLog::query()->create($attributes);
    }

    private function sanitize(array $data): array
    {
        $clean = [];
        foreach ($data as $key => $value) {
            if (in_array(strtolower((string) $key), self::REDACTED_KEYS, true)) {
                $clean[$key] = '[REDACTED]';
            } elseif (is_array($value)) {
                $clean[$key] = $this->sanitize($value);
            } else {
                $clean[$key] = $value;
            }
        }

        return $clean;
    }
}
