<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\University;
use App\Models\User;

class UniversityPolicy
{
    /**
     * Determine whether the user can view their university.
     */
    public function view(User $user, ?University $university = null): bool
    {
        if ($user->role !== UserRole::SYSTEM_ADMINISTRATOR) {
            return false;
        }

        if ($user->university_id === null) {
            return false;
        }

        if ($university !== null && (int) $user->university_id !== (int) $university->id) {
            return false;
        }

        return true;
    }

    /**
     * Determine whether the user can update their university.
     */
    public function update(User $user, University $university): bool
    {
        if ($user->role !== UserRole::SYSTEM_ADMINISTRATOR) {
            return false;
        }

        if ($user->university_id === null) {
            return false;
        }

        return (int) $user->university_id === (int) $university->id;
    }
}
