<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\User;
use App\Models\Workspace;

class WorkspacePolicy
{
    /**
     * Determine whether the user can view any workspaces.
     */
    public function viewAny(User $user): bool
    {
        return in_array($user->role, [UserRole::SYSTEM_ADMINISTRATOR, UserRole::STAFF], true);
    }

    /**
     * Determine whether the user can create workspaces.
     */
    public function create(User $user): bool
    {
        return $user->role === UserRole::SYSTEM_ADMINISTRATOR && $user->university_id !== null;
    }

    /**
     * Determine whether the user can view the workspace.
     */
    public function view(User $user, Workspace $workspace): bool
    {
        if ($user->role === UserRole::SYSTEM_ADMINISTRATOR) {
            return $user->university_id !== null && (int) $workspace->university_id === (int) $user->university_id;
        }

        if ($user->role === UserRole::STAFF) {
            return $workspace->members()->where('user_id', $user->id)->exists();
        }

        return false;
    }

    /**
     * Determine whether the user can update the workspace.
     */
    public function update(User $user, Workspace $workspace): bool
    {
        if ($user->role === UserRole::SYSTEM_ADMINISTRATOR) {
            return $user->university_id !== null && (int) $workspace->university_id === (int) $user->university_id;
        }

        return false;
    }

    /**
     * Determine whether the user can delete the workspace.
     */
    public function delete(User $user, Workspace $workspace): bool
    {
        return false;
    }
}
