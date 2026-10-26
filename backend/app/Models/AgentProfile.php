<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AgentProfile extends Model
{
    use HasFactory;

    protected $fillable = [
        'workspace_id',
        'name',
        'description',
        'system_instructions',
        'selected_llm_model_id',
        'temperature',
        'max_tokens',
        'use_knowledge_base',
        'support_case_auto_create',
        'support_case_conditions',
        'staff_auto_assign',
        'auto_assign_staff_ids',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'temperature' => 'decimal:2',
            'max_tokens' => 'integer',
            'use_knowledge_base' => 'boolean',
            'support_case_auto_create' => 'boolean',
            'staff_auto_assign' => 'boolean',
            'auto_assign_staff_ids' => 'array',
        ];
    }

    /**
     * Get the workspace that owns this agent profile.
     */
    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    /**
     * Get the selected LLM model.
     */
    public function llmModel(): BelongsTo
    {
        return $this->belongsTo(LlmModel::class, 'selected_llm_model_id');
    }
}
