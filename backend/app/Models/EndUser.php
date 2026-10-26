<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class EndUser extends Model
{
    use HasFactory;

    protected $fillable = [
        'workspace_id',
        'external_id',
        'name',
        'phone',
        'email',
        'channel_type',
        'metadata',
        'is_blocked',
        'ai_responses_paused',
        'first_seen_at',
        'last_seen_at',
    ];

    protected function casts(): array
    {
        return [
            'metadata' => 'array',
            'is_blocked' => 'boolean',
            'ai_responses_paused' => 'boolean',
            'first_seen_at' => 'datetime',
            'last_seen_at' => 'datetime',
        ];
    }

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    public function conversations(): HasMany
    {
        return $this->hasMany(Conversation::class);
    }

    public function supportCases(): HasMany
    {
        return $this->hasMany(SupportCase::class);
    }

    /**
     * Get display name with fallback.
     */
    public function getDisplayNameAttribute(): string
    {
        return $this->name ?? $this->phone ?? $this->email ?? 'مستعلم #' . $this->id;
    }
}
