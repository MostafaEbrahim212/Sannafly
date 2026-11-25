<?php

namespace App\Models;

use App\Support\Money;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Coupon extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'name',
        'type',
        'value',
        'min_order_amount',
        'max_discount_amount',
        'usage_limit',
        'usage_limit_per_customer',
        'first_order_only',
        'used_count',
        'starts_at',
        'expires_at',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'value' => 'decimal:4',
            'min_order_amount' => 'decimal:4',
            'max_discount_amount' => 'decimal:4',
            'usage_limit' => 'integer',
            'usage_limit_per_customer' => 'integer',
            'first_order_only' => 'boolean',
            'used_count' => 'integer',
            'starts_at' => 'datetime',
            'expires_at' => 'datetime',
            'is_active' => 'boolean',
        ];
    }

    public function redemptions(): HasMany
    {
        return $this->hasMany(CouponRedemption::class);
    }

    public function isValidForAmount(string|int|float $subtotal): ?string
    {
        if (! $this->is_active) {
            return 'This coupon is currently inactive.';
        }

        $now = now();
        if ($this->starts_at && $now->lt($this->starts_at)) {
            return 'This coupon is not active yet.';
        }
        if ($this->expires_at && $now->gt($this->expires_at)) {
            return 'This coupon has expired.';
        }
        if ($this->usage_limit !== null && $this->used_count >= $this->usage_limit) {
            return 'This coupon has reached its usage limit.';
        }

        $sub = Money::normalize((string) $subtotal);
        $minOrder = Money::normalize((string) ($this->min_order_amount ?? '0'));
        if (Money::comp($sub, $minOrder) < 0) {
            return 'Minimum order amount for this coupon is '.Money::toGateway($minOrder).'.';
        }

        return null;
    }

    public function calculateDiscount(string|int|float $subtotal): string
    {
        if ($this->type === 'free_shipping') {
            return '0.0000';
        }

        $sub = Money::normalize((string) $subtotal);
        if (Money::comp($sub, '0') <= 0) {
            return '0.0000';
        }

        $discount = $this->type === 'percent'
            ? Money::div(Money::mul($sub, (string) $this->value, 6), '100')
            : Money::normalize((string) $this->value);

        if ($this->max_discount_amount !== null) {
            $maxCap = Money::normalize((string) $this->max_discount_amount);
            if (Money::comp($discount, $maxCap) > 0) {
                $discount = $maxCap;
            }
        }

        return Money::min($discount, $sub);
    }
}
