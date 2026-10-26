<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AuditLog extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'workspace_id',
        'action',
        'entity_type',
        'entity_id',
        'details',
        'ip_address',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'details' => 'array',
            'created_at' => 'datetime',
        ];
    }

    /**
     * Create an audit log entry.
     */
    public static function log(
        string $action,
        ?string $entityType = null,
        ?string $entityId = null,
        ?int $userId = null,
        ?int $workspaceId = null,
        ?array $details = null,
        ?string $ipAddress = null
    ): self {
        return self::create([
            'user_id' => $userId,
            'workspace_id' => $workspaceId,
            'action' => $action,
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'details' => $details,
            'ip_address' => $ipAddress,
            'created_at' => now(),
        ]);
    }
}
