<?php

namespace App\Services;

use App\Models\ShippingZone;

class ShippingService
{
    public function resolveZone(?string $city): ?ShippingZone
    {
        $zones = ShippingZone::query()
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get();

        if ($zones->isEmpty()) {
            return null;
        }

        if ($city) {
            foreach ($zones as $zone) {
                if ($zone->matchesCity($city)) {
                    return $zone;
                }
            }
        }

        return $zones->firstWhere('is_default', true) ?? $zones->first();
    }

    /**
     * @return array{zone: ?ShippingZone, rate: float, free_shipping: bool}
     */
    public function calculateForCity(?string $city, float $subtotalAfterDiscount): array
    {
        $zone = $this->resolveZone($city);
        if (! $zone) {
            return ['zone' => null, 'rate' => 0.0, 'free_shipping' => false];
        }

        $rate = $zone->calculateRate($subtotalAfterDiscount);

        return [
            'zone' => $zone,
            'rate' => $rate,
            'free_shipping' => $rate === 0.0 && (float) $zone->rate > 0,
        ];
    }
}
