<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Conversation extends Model
{
    use HasFactory;

    protected $fillable = [
        'workspace_id',
        'end_user_id',
        'channel_type',
        'handler',
        'assigned_staff_id',
        'status',
        'is_test',
        'started_at',
        'last_message_at',
        'resolved_at',
    ];

    protected function casts(): array
    {
        return [
            'is_test' => 'boolean',
            'started_at' => 'datetime',
            'last_message_at' => 'datetime',
            'resolved_at' => 'datetime',
        ];
    }

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    public function endUser(): BelongsTo
    {
        return $this->belongsTo(EndUser::class);
    }

    public function assignedStaff(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_staff_id');
    }

    public function messages(): HasMany
    {
        return $this->hasMany(Message::class)->orderBy('created_at', 'asc');
    }

    public function supportCases(): HasMany
    {
        return $this->hasMany(SupportCase::class);
    }

    /**
     * Scope to exclude test conversations.
     */
    public function scopeReal($query)
    {
        return $query->where('is_test', false);
    }

    /**
     * Scope to get only test conversations.
     */
    public function scopeTest($query)
    {
        return $query->where('is_test', true);
    }
}
