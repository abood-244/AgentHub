<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SupportCaseLog extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'support_case_id',
        'action',
        'performed_by_user_id',
        'details',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'details' => 'array',
            'created_at' => 'datetime',
        ];
    }

    public function supportCase(): BelongsTo
    {
        return $this->belongsTo(SupportCase::class);
    }

    public function performedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'performed_by_user_id');
    }
}
