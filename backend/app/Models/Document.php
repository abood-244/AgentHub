<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Document extends Model
{
    use HasFactory;

    protected $fillable = [
        'workspace_id',
        'title',
        'title_en',
        'source_type',
        'storage_type',
        'original_content',
        'file_path',
        'file_size',
        'records_count',
        'columns_count',
        'chunks_count',
        'total_tokens',
        'processing_status',
        'error_message',
        'last_indexed_at',
    ];

    protected function casts(): array
    {
        return [
            'file_size' => 'integer',
            'records_count' => 'integer',
            'columns_count' => 'integer',
            'chunks_count' => 'integer',
            'total_tokens' => 'integer',
            'last_indexed_at' => 'datetime',
        ];
    }

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    public function chunks(): HasMany
    {
        return $this->hasMany(DocumentChunk::class);
    }

    public function embeddings(): HasMany
    {
        return $this->hasMany(Embedding::class);
    }

    /**
     * Check if the document uses vector storage.
     */
    public function isVectorStorage(): bool
    {
        return $this->storage_type === 'vector';
    }

    /**
     * Check if processing is complete.
     */
    public function isProcessed(): bool
    {
        return $this->processing_status === 'completed';
    }
}
