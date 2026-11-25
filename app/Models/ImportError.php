<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ImportError extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'import_job_id',
        'row_number',
        'sku',
        'message',
        'row_data',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'row_data' => 'array',
            'created_at' => 'datetime',
        ];
    }

    public function importJob(): BelongsTo
    {
        return $this->belongsTo(ImportJob::class);
    }
}
