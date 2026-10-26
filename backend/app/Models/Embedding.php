<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Embedding extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'chunk_id',
        'workspace_id',
        'document_id',
        'embedding_model_id',
        'embedding',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'created_at' => 'datetime',
        ];
    }

    public function chunk(): BelongsTo
    {
        return $this->belongsTo(DocumentChunk::class, 'chunk_id');
    }

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    public function document(): BelongsTo
    {
        return $this->belongsTo(Document::class);
    }

    public function embeddingModel(): BelongsTo
    {
        return $this->belongsTo(EmbeddingModel::class);
    }
}
