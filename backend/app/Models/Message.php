<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Message extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'conversation_id',
        'sender_type',
        'sender_id',
        'content',
        'metadata',
        'sources_used',
        'confidence_score',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'metadata' => 'array',
            'sources_used' => 'array',
            'confidence_score' => 'decimal:3',
            'created_at' => 'datetime',
        ];
    }

    public function conversation(): BelongsTo
    {
        return $this->belongsTo(Conversation::class);
    }

    /**
     * Get sender user (if staff).
     */
    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    /**
     * Check if message is from AI.
     */
    public function isFromAi(): bool
    {
        return $this->sender_type === 'ai';
    }

    /**
     * Check if message is from end user.
     */
    public function isFromEndUser(): bool
    {
        return $this->sender_type === 'end_user';
    }
}
