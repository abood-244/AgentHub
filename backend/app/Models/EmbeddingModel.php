<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EmbeddingModel extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'provider',
        'model_identifier',
        'dimensions',
        'is_enabled',
        'description',
        'description_en',
    ];

    protected function casts(): array
    {
        return [
            'is_enabled' => 'boolean',
            'dimensions' => 'integer',
        ];
    }

    public function scopeEnabled($query)
    {
        return $query->where('is_enabled', true);
    }
}
