<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class ProductVariation extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'product_id',
        'sku',
        'barcode',
        'combination_hash',
        'name',
        'stock_quantity',
        'low_stock_threshold',
        'weight',
        'status',
        'is_default',
    ];

    protected function casts(): array
    {
        return [
            'stock_quantity' => 'integer',
            'low_stock_threshold' => 'integer',
            'weight' => 'decimal:3',
            'is_default' => 'boolean',
        ];
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function options(): BelongsToMany
    {
        return $this->belongsToMany(
            AttributeOption::class,
            'variation_attribute_options',
            'variation_id',
            'attribute_option_id'
        )->with('attribute');
    }

    public function prices(): HasMany
    {
        return $this->hasMany(ProductPrice::class, 'variation_id');
    }

    public function images(): HasMany
    {
        return $this->hasMany(ProductImage::class, 'variation_id')->orderBy('sort_order');
    }

    public static function hashOptions(array $optionIds): string
    {
        $sorted = array_map('intval', $optionIds);
        sort($sorted);

        return hash('sha256', implode('-', $sorted));
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function isPurchasable(): bool
    {
        return ! $this->trashed() && $this->status === 'active';
    }
}
