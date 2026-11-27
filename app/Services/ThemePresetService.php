<?php

namespace App\Services;

use App\Models\ThemePreset;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use InvalidArgumentException;

class ThemePresetService
{
    private const ALLOWED_THEME_KEYS = [
        'primary_color' => ['group' => 'appearance', 'type' => 'string'],
        'accent_color' => ['group' => 'appearance', 'type' => 'string'],
        'text_color' => ['group' => 'appearance', 'type' => 'string'],
        'theme_surface' => ['group' => 'appearance', 'type' => 'string'],
        'border_radius' => ['group' => 'appearance', 'type' => 'string'],
        'font_family' => ['group' => 'appearance', 'type' => 'string'],
        'button_style' => ['group' => 'appearance', 'type' => 'string'],
        'product_grid_columns' => ['group' => 'appearance', 'type' => 'integer'],
        'image_ratio' => ['group' => 'appearance', 'type' => 'string'],
        'show_hero' => ['group' => 'appearance', 'type' => 'boolean'],
        'show_categories' => ['group' => 'appearance', 'type' => 'boolean'],
        'show_featured' => ['group' => 'appearance', 'type' => 'boolean'],
        'show_latest' => ['group' => 'appearance', 'type' => 'boolean'],
        'show_brands' => ['group' => 'appearance', 'type' => 'boolean'],
        'show_banner' => ['group' => 'appearance', 'type' => 'boolean'],
        'homepage_sections_order' => ['group' => 'appearance', 'type' => 'json'],
    ];

    public function __construct(
        private readonly SettingsService $settings,
        private readonly AuditLogger $audit,
    ) {}

    public function ensureDefaults(): void
    {
        $defaults = [
            [
                'slug' => 'electronics',
                'name' => 'Electronics Pro',
                'name_ar' => 'إلكترونيات احترافي',
                'category' => 'electronics',
                'description' => 'Clean tech-focused slate & cobalt blue palette with 4-column product grid.',
                'config' => [
                    'primary_color' => '#1d4ed8',
                    'accent_color' => '#06b6d4',
                    'text_color' => '#0f172a',
                    'theme_surface' => 'slate',
                    'border_radius' => 'rounded',
                    'font_family' => 'Inter',
                    'button_style' => 'rounded',
                    'product_grid_columns' => 4,
                    'image_ratio' => 'square',
                    'homepage_sections_order' => ['hero', 'categories', 'featured', 'banner', 'latest', 'brands'],
                ],
            ],
            [
                'slug' => 'fashion',
                'name' => 'Fashion Editorial',
                'name_ar' => 'أزياء وموضة',
                'category' => 'fashion',
                'description' => 'High-contrast monochrome lookbook with 3:4 portrait cards.',
                'config' => [
                    'primary_color' => '#18181b',
                    'accent_color' => '#e11d48',
                    'text_color' => '#18181b',
                    'theme_surface' => 'pure',
                    'border_radius' => 'sharp',
                    'font_family' => 'Inter',
                    'button_style' => 'sharp',
                    'product_grid_columns' => 3,
                    'image_ratio' => 'portrait',
                    'homepage_sections_order' => ['hero', 'featured', 'categories', 'banner', 'latest', 'brands'],
                ],
            ],
            [
                'slug' => 'cosmetics',
                'name' => 'Cosmetics & Beauty',
                'name_ar' => 'مستحضرات تجميل',
                'category' => 'cosmetics',
                'description' => 'Warm rose & amber palette with pill buttons and portrait imagery.',
                'config' => [
                    'primary_color' => '#be185d',
                    'accent_color' => '#f59e0b',
                    'text_color' => '#1f2937',
                    'theme_surface' => 'warm',
                    'border_radius' => 'pill',
                    'font_family' => 'Cairo',
                    'button_style' => 'pill',
                    'product_grid_columns' => 4,
                    'image_ratio' => 'portrait',
                    'homepage_sections_order' => ['hero', 'categories', 'featured', 'latest', 'brands'],
                ],
            ],
            [
                'slug' => 'general-store',
                'name' => 'General Store',
                'name_ar' => 'متجر عام',
                'category' => 'general',
                'description' => 'Balanced petrol & warm amber storefront ideal for multi-category retail.',
                'config' => [
                    'primary_color' => '#0A5C57',
                    'accent_color' => '#F6A21E',
                    'text_color' => '#15211F',
                    'theme_surface' => 'warm',
                    'border_radius' => 'rounded',
                    'font_family' => 'Inter',
                    'button_style' => 'rounded',
                    'product_grid_columns' => 4,
                    'image_ratio' => 'square',
                    'homepage_sections_order' => ['hero', 'categories', 'featured', 'banner', 'latest', 'brands'],
                ],
            ],
            [
                'slug' => 'minimal',
                'name' => 'Minimal Studio',
                'name_ar' => 'تصميم بسيط',
                'category' => 'minimal',
                'description' => 'Minimalist clean surface with crisp typography and 3-column layout.',
                'config' => [
                    'primary_color' => '#334155',
                    'accent_color' => '#0f172a',
                    'text_color' => '#0f172a',
                    'theme_surface' => 'clean',
                    'border_radius' => 'sharp',
                    'font_family' => 'Inter',
                    'button_style' => 'sharp',
                    'product_grid_columns' => 3,
                    'image_ratio' => 'square',
                    'homepage_sections_order' => ['hero', 'featured', 'categories', 'latest'],
                ],
            ],
            [
                'slug' => 'luxury',
                'name' => 'Luxury Gold',
                'name_ar' => 'فخامة ذهبية',
                'category' => 'luxury',
                'description' => 'Rich espresso & gold accents tailored for jewelry, watches, and luxury goods.',
                'config' => [
                    'primary_color' => '#92400e',
                    'accent_color' => '#d97706',
                    'text_color' => '#1c1917',
                    'theme_surface' => 'warm',
                    'border_radius' => 'sharp',
                    'font_family' => 'Inter',
                    'button_style' => 'sharp',
                    'product_grid_columns' => 3,
                    'image_ratio' => 'portrait',
                    'homepage_sections_order' => ['hero', 'featured', 'banner', 'categories', 'brands'],
                ],
            ],
        ];

        foreach ($defaults as $preset) {
            ThemePreset::query()->firstOrCreate(
                ['slug' => $preset['slug']],
                array_merge($preset, ['is_system' => true])
            );
        }
    }

    /**
     * Apply only allow-listed theme settings; never touches products, orders, payments, security, or license.
     */
    public function applyPreset(ThemePreset $preset): void
    {
        $config = $this->validateConfig($preset->config ?? []);
        foreach ($config as $key => $value) {
            $meta = self::ALLOWED_THEME_KEYS[$key];
            $this->settings->set($key, $value, $meta['group'], $meta['type'], true);
        }

        $this->audit->log('theme.preset_applied', 'ThemePreset', $preset->id, null, [
            'slug' => $preset->slug,
            'name' => $preset->name,
        ]);
    }

    public function saveCurrentAsPreset(string $name, ?string $nameAr = null, string $category = 'custom'): ThemePreset
    {
        $appearance = $this->settings->byGroup('appearance');
        $config = [];
        foreach (array_keys(self::ALLOWED_THEME_KEYS) as $key) {
            if (array_key_exists($key, $appearance)) {
                $config[$key] = $appearance[$key];
            }
        }

        $preset = ThemePreset::query()->create([
            'slug' => Str::slug($name).'-'.Str::lower(Str::random(5)),
            'name' => $name,
            'name_ar' => $nameAr ?: $name,
            'category' => $category,
            'description' => 'Custom saved storefront theme preset.',
            'config' => $this->validateConfig($config),
            'is_system' => false,
            'created_by' => Auth::guard('web')->id(),
        ]);

        $this->audit->log('theme.preset_saved', 'ThemePreset', $preset->id, null, ['name' => $name]);

        return $preset;
    }

    /**
     * Validate and import a JSON theme preset safely (blocks scripts, PHP, and unknown keys).
     *
     * @param  array<string, mixed>  $payload
     */
    public function importFromArray(array $payload): ThemePreset
    {
        $name = trim((string) ($payload['name'] ?? ''));
        if ($name === '' || mb_strlen($name) > 120) {
            throw new InvalidArgumentException('Invalid or missing theme preset name.');
        }

        $rawConfig = $payload['config'] ?? null;
        if (! is_array($rawConfig) || $rawConfig === []) {
            throw new InvalidArgumentException('Theme preset config must be a non-empty object.');
        }

        $validatedConfig = $this->validateConfig($rawConfig);

        $preset = ThemePreset::query()->create([
            'slug' => Str::slug($name).'-'.Str::lower(Str::random(5)),
            'name' => strip_tags($name),
            'name_ar' => strip_tags((string) ($payload['name_ar'] ?? $name)),
            'category' => preg_replace('/[^a-z0-9_-]/i', '', (string) ($payload['category'] ?? 'imported')) ?: 'imported',
            'description' => strip_tags((string) ($payload['description'] ?? 'Imported theme preset')),
            'config' => $validatedConfig,
            'is_system' => false,
            'created_by' => Auth::guard('web')->id(),
        ]);

        $this->audit->log('theme.preset_imported', 'ThemePreset', $preset->id, null, ['name' => $preset->name]);

        return $preset;
    }

    /**
     * @param  array<string, mixed>  $raw
     * @return array<string, mixed>
     */
    public function validateConfig(array $raw): array
    {
        $clean = [];
        foreach ($raw as $key => $value) {
            if (! array_key_exists($key, self::ALLOWED_THEME_KEYS)) {
                continue;
            }

            if (str_ends_with($key, '_color')) {
                if (! is_string($value) || preg_match('/^#[0-9A-Fa-f]{3,8}$/', $value) !== 1) {
                    throw new InvalidArgumentException("Invalid color hex value for {$key}.");
                }
                $clean[$key] = $value;
            } elseif ($key === 'homepage_sections_order') {
                if (! is_array($value)) {
                    throw new InvalidArgumentException('homepage_sections_order must be an array.');
                }
                $allowedSections = ['hero', 'categories', 'featured', 'banner', 'latest', 'brands'];
                $clean[$key] = array_values(array_intersect($value, $allowedSections));
            } elseif (self::ALLOWED_THEME_KEYS[$key]['type'] === 'boolean') {
                $clean[$key] = (bool) $value;
            } elseif (self::ALLOWED_THEME_KEYS[$key]['type'] === 'integer') {
                $clean[$key] = max(1, min(6, (int) $value));
            } else {
                $str = (string) $value;
                if (preg_match('/<script|javascript:|<\?php/i', $str) === 1) {
                    throw new InvalidArgumentException("Unsafe content detected in {$key}.");
                }
                $clean[$key] = strip_tags($str);
            }
        }

        return $clean;
    }
}
