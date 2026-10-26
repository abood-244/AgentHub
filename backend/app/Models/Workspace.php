<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Workspace extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'university_id',
        'name',
        'name_en',
        'slug',
        'description',
        'description_en',
        'status',
        'category',
        'default_language',
        'icon_name',
        'theme_color',
        'selected_embedding_model_id',
    ];

    // ─── University ────────────────────────────────────────────

    /**
     * Get the university that owns the workspace.
     */
    public function university(): BelongsTo
    {
        return $this->belongsTo(University::class);
    }

    // ─── Members ───────────────────────────────────────────────

    /**
     * Get the workspace membership records.
     */
    public function members(): HasMany
    {
        return $this->hasMany(WorkspaceMember::class);
    }

    /**
     * Get the users assigned to this workspace.
     */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'workspace_members')
            ->withPivot('access_level')
            ->withTimestamps();
    }

    // ─── Sprint 2 Relationships ────────────────────────────────

    /**
     * Get the agent profile for this workspace (one-to-one).
     */
    public function agentProfile(): HasOne
    {
        return $this->hasOne(AgentProfile::class);
    }

    /**
     * Get the documents (knowledge base) for this workspace.
     */
    public function documents(): HasMany
    {
        return $this->hasMany(Document::class);
    }

    /**
     * Get the document chunks for this workspace.
     */
    public function documentChunks(): HasMany
    {
        return $this->hasMany(DocumentChunk::class);
    }

    /**
     * Get the end users (customers) for this workspace.
     */
    public function endUsers(): HasMany
    {
        return $this->hasMany(EndUser::class);
    }

    /**
     * Get the conversations for this workspace.
     */
    public function conversations(): HasMany
    {
        return $this->hasMany(Conversation::class);
    }

    /**
     * Get the support cases for this workspace.
     */
    public function supportCases(): HasMany
    {
        return $this->hasMany(SupportCase::class);
    }

    /**
     * Get the channels linked to this workspace.
     */
    public function channels(): BelongsToMany
    {
        return $this->belongsToMany(Channel::class, 'workspace_channels')
            ->withPivot('is_active', 'config')
            ->withTimestamps();
    }

    /**
     * Get the workspace-channel pivot records.
     */
    public function workspaceChannels(): HasMany
    {
        return $this->hasMany(WorkspaceChannel::class);
    }

    /**
     * Get the selected embedding model.
     */
    public function embeddingModel(): BelongsTo
    {
        return $this->belongsTo(EmbeddingModel::class, 'selected_embedding_model_id');
    }

    /**
     * Get the embeddings for this workspace.
     */
    public function embeddings(): HasMany
    {
        return $this->hasMany(Embedding::class);
    }
}
