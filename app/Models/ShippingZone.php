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
        'base_weight_kg',
        'per_kg_rate',
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
            'base_weight_kg' => 'decimal:3',
            'per_kg_rate' => 'decimal:4',
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

    public function calculateRate(string|int|float $subtotalAfterDiscount, string|int|float $totalWeightKg = '0'): string
    {
        $net = Money::normalize((string) $subtotalAfterDiscount);
        if ($this->free_shipping_threshold !== null) {
            $threshold = Money::normalize((string) $this->free_shipping_threshold);
            if (Money::comp($net, $threshold) >= 0) {
                return '0.0000';
            }
        }

        $rate = Money::normalize((string) $this->rate);
        $perKg = Money::normalize((string) ($this->per_kg_rate ?? '0'));
        $weight = Money::normalize((string) $totalWeightKg, 3);
        $baseWeight = Money::normalize((string) ($this->base_weight_kg ?? '1'), 3);

        if (Money::comp($perKg, '0') > 0 && Money::comp($weight, $baseWeight, 3) > 0) {
            $extraKg = Money::sub($weight, $baseWeight, 3);
            $rate = Money::add($rate, Money::mul($extraKg, $perKg));
        }

        return $rate;
    }
}
