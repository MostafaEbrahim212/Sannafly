<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ThemePreset extends Model
{
    protected $fillable = [
        'slug',
        'name',
        'name_ar',
        'category',
        'description',
        'config',
        'is_system',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'config' => 'array',
            'is_system' => 'boolean',
        ];
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
