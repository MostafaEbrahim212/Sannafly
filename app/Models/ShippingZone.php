<?php

namespace App\Models;

use App\Support\Money;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ShippingZone extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'name_ar',
        'cities',
        'rate',
        'free_shipping_threshold',
        'estimated_days',
        'is_default',
        'is_active',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'cities' => 'array',
            'rate' => 'decimal:4',
            'free_shipping_threshold' => 'decimal:4',
            'is_default' => 'boolean',
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    public function matchesCity(?string $city): bool
    {
        if (! $city || empty($this->cities)) {
            return false;
        }

        $needle = $this->normalizeCity($city);
        foreach ($this->cities as $entry) {
            $candidate = $this->normalizeCity((string) $entry);
            if ($candidate !== '' && (str_contains($needle, $candidate) || str_contains($candidate, $needle))) {
                return true;
            }
        }

        return false;
    }

    private function normalizeCity(string $value): string
    {
        $normalized = mb_strtolower(trim($value));

        return str_replace(
            ['أ', 'إ', 'آ', 'ة', 'ى'],
            ['ا', 'ا', 'ا', 'ه', 'ي'],
            $normalized
        );
    }

    public function calculateRate(string|int|float $subtotalAfterDiscount): string
    {
        $net = Money::normalize((string) $subtotalAfterDiscount);
        if ($this->free_shipping_threshold !== null) {
            $threshold = Money::normalize((string) $this->free_shipping_threshold);
            if (Money::comp($net, $threshold) >= 0) {
                return '0.0000';
            }
        }

        return Money::normalize((string) $this->rate);
    }
}
