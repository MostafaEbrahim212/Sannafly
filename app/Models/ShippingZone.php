<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ShippingZone extends Model
{
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

        $needle = mb_strtolower(trim($city));
        foreach ($this->cities as $entry) {
            $candidate = mb_strtolower(trim((string) $entry));
            if ($candidate !== '' && (str_contains($needle, $candidate) || str_contains($candidate, $needle))) {
                return true;
            }
        }

        return false;
    }

    public function calculateRate(float $subtotalAfterDiscount): float
    {
        if ($this->free_shipping_threshold !== null && $subtotalAfterDiscount >= (float) $this->free_shipping_threshold) {
            return 0.0;
        }

        return round((float) $this->rate, 2);
    }
}
