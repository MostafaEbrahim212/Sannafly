<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Product extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'category_id',
        'brand_id',
        'name',
        'name_ar',
        'slug',
        'sku',
        'barcode',
        'short_description',
        'short_description_ar',
        'description',
        'description_ar',
        'status',
        'visibility',
        'is_featured',
        'has_variations',
        'track_inventory',
        'allow_backorder',
        'allow_negative_stock',
        'stock_quantity',
        'low_stock_threshold',
        'weight',
        'specifications',
        'custom_fields',
        'tags',
        'seo_title',
        'seo_description',
        'published_at',
        'sort_order',
        'created_by',
        'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'is_featured' => 'boolean',
            'has_variations' => 'boolean',
            'track_inventory' => 'boolean',
            'allow_backorder' => 'boolean',
            'allow_negative_stock' => 'boolean',
            'stock_quantity' => 'integer',
            'low_stock_threshold' => 'integer',
            'weight' => 'decimal:3',
            'specifications' => 'array',
            'custom_fields' => 'array',
            'tags' => 'array',
            'published_at' => 'datetime',
            'sort_order' => 'integer',
        ];
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function brand(): BelongsTo
    {
        return $this->belongsTo(Brand::class);
    }

    public function images(): HasMany
    {
        return $this->hasMany(ProductImage::class)->orderBy('sort_order');
    }

    public function mainImage(): HasMany
    {
        return $this->hasMany(ProductImage::class)->where('is_main', true);
    }

    public function prices(): HasMany
    {
        return $this->hasMany(ProductPrice::class);
    }

    public function variations(): HasMany
    {
        return $this->hasMany(ProductVariation::class);
    }

    public function stockMovements(): HasMany
    {
        return $this->hasMany(StockMovement::class)->latest('created_at');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(ProductReview::class)->where('is_approved', true)->latest();
    }

    public function wishlists(): HasMany
    {
        return $this->hasMany(Wishlist::class);
    }

    public function effectiveStock(): int
    {
        if ($this->has_variations && $this->relationLoaded('variations')) {
            return (int) $this->variations->where('status', 'active')->sum('stock_quantity');
        }

        if ($this->has_variations) {
            return (int) $this->variations()->where('status', 'active')->sum('stock_quantity');
        }

        return (int) $this->stock_quantity;
    }

    public function isLowStock(): bool
    {
        if (! $this->track_inventory) {
            return false;
        }

        return $this->effectiveStock() <= $this->low_stock_threshold;
    }

    public function localizedName(?string $locale = null): string
    {
        $locale ??= app()->getLocale();

        return ($locale === 'ar' && $this->name_ar) ? $this->name_ar : $this->name;
    }
}
