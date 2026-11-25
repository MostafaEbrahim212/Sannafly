<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PaymentMethod extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'name_ar',
        'code',
        'driver',
        'description',
        'description_ar',
        'icon',
        'is_active',
        'is_visible',
        'sort_order',
        'config',
    ];

    protected $hidden = [
        'config',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'is_visible' => 'boolean',
            'sort_order' => 'integer',
            'config' => 'encrypted:array',
        ];
    }
}
