<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SystemUpdate extends Model
{
    protected $fillable = [
        'from_version',
        'to_version',
        'status',
        'backup_file',
        'notes',
        'error_message',
        'executed_by',
    ];

    public function executor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'executed_by');
    }
}
