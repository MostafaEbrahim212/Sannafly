<?php

namespace App\Services;

use App\Models\Setting;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Schema;

class SettingsService
{
    private const CACHE_KEY = 'catalogflow.settings.all';

    public function get(string $key, mixed $default = null): mixed
    {
        $all = $this->all();

        return $all[$key]['value'] ?? $default;
    }

    public function isEnabled(string $featureKey, bool $default = false): bool
    {
        return (bool) $this->get($featureKey, $default);
    }

    public function set(string $key, mixed $value, string $group = 'general', string $type = 'string', bool $isPublic = false): void
    {
        $storedValue = match ($type) {
            'boolean' => $value ? '1' : '0',
            'json' => json_encode($value, JSON_UNESCAPED_UNICODE),
            default => (string) $value,
        };

        Setting::query()->updateOrCreate(
            ['key' => $key],
            [
                'group' => $group,
                'value' => $storedValue,
                'type' => $type,
                'is_public' => $isPublic,
            ]
        );

        Cache::forget(self::CACHE_KEY);
    }

    /**
     * Seed a default setting only if it does not already exist so re-running
     * essential seeders never overwrites customer customizations.
     */
    public function seedDefault(string $key, mixed $value, string $group = 'general', string $type = 'string', bool $isPublic = false): void
    {
        $storedValue = match ($type) {
            'boolean' => $value ? '1' : '0',
            'json' => json_encode($value, JSON_UNESCAPED_UNICODE),
            default => (string) $value,
        };

        $created = Setting::query()->firstOrCreate(
            ['key' => $key],
            [
                'group' => $group,
                'value' => $storedValue,
                'type' => $type,
                'is_public' => $isPublic,
            ]
        );

        if ($created->wasRecentlyCreated) {
            Cache::forget(self::CACHE_KEY);
        }
    }

    public function publicSettings(): array
    {
        $result = [];
        foreach ($this->all() as $key => $item) {
            if ($item['is_public'] && $item['type'] !== 'secret') {
                $result[$key] = $item['value'];
            }
        }

        return $result;
    }

    public function byGroup(string $group, bool $includeSecrets = false): array
    {
        $result = [];
        foreach ($this->all() as $key => $item) {
            if ($item['group'] === $group) {
                if (! $includeSecrets && $item['type'] === 'secret') {
                    continue;
                }
                $result[$key] = $item['value'];
            }
        }

        return $result;
    }

    public function all(): array
    {
        if (! Schema::hasTable('settings')) {
            return [];
        }

        return Cache::remember(self::CACHE_KEY, 300, function (): array {
            $rows = Setting::query()->get();
            $mapped = [];
            foreach ($rows as $row) {
                $mapped[$row->key] = [
                    'group' => $row->group,
                    'type' => $row->type,
                    'is_public' => $row->is_public,
                    'value' => $this->castValue($row->value, $row->type),
                ];
            }

            return $mapped;
        });
    }

    public function clearCache(): void
    {
        Cache::forget(self::CACHE_KEY);
    }

    private function castValue(?string $value, string $type): mixed
    {
        if ($value === null) {
            return null;
        }

        return match ($type) {
            'boolean' => in_array(strtolower($value), ['1', 'true', 'yes', 'on'], true),
            'integer' => (int) $value,
            'json' => json_decode($value, true) ?? [],
            default => $value,
        };
    }
}
