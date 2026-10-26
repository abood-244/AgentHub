<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LlmModel extends Model
{
    use HasFactory;

    protected $table = 'llm_models';

    protected $fillable = [
        'name',
        'provider',
        'model_identifier',
        'context_window',
        'is_enabled',
        'description',
        'description_en',
        'badge_color',
        'is_recommended',
    ];

    protected function casts(): array
    {
        return [
            'is_enabled' => 'boolean',
            'is_recommended' => 'boolean',
            'context_window' => 'integer',
        ];
    }

    /**
     * Scope to get only enabled models.
     */
    public function scopeEnabled($query)
    {
        return $query->where('is_enabled', true);
    }
}
