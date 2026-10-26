<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SupportCase extends Model
{
    use HasFactory;

    protected $fillable = [
        'case_number',
        'workspace_id',
        'title',
        'description',
        'end_user_id',
        'conversation_id',
        'source',
        'category',
        'assigned_staff_id',
        'summary',
        'required_action',
        'status',
        'priority',
        'created_by_user_id',
        'closed_at',
    ];

    protected function casts(): array
    {
        return [
            'closed_at' => 'datetime',
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

    public function conversation(): BelongsTo
    {
        return $this->belongsTo(Conversation::class);
    }

    public function assignedStaff(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_staff_id');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    public function logs(): HasMany
    {
        return $this->hasMany(SupportCaseLog::class)->orderBy('created_at', 'desc');
    }

    /**
     * Generate a unique case number.
     */
    public static function generateCaseNumber(): string
    {
        $lastCase = self::orderBy('id', 'desc')->first();
        $nextNumber = $lastCase ? ((int) substr($lastCase->case_number, 3)) + 1 : 1;
        return 'SC-' . str_pad($nextNumber, 4, '0', STR_PAD_LEFT);
    }

    /**
     * Boot method to auto-generate case number.
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($case) {
            if (empty($case->case_number)) {
                $case->case_number = self::generateCaseNumber();
            }
        });
    }
}
