<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class University extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'slug',
        'code',
        'contact_email',
        'contact_phone',
        'website',
    ];

    /**
     * Get the users associated with the university.
     */
    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    /**
     * Get the workspaces belonging to the university.
     */
    public function workspaces(): HasMany
    {
        return $this->hasMany(Workspace::class);
    }
}
