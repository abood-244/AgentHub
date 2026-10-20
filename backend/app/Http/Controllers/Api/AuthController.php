<?php

namespace App\Http\Controllers\Api;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    /**
     * Return the authenticated user's safe application context and permissions.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function me(Request $request): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();

        // Load relationships
        $user->loadMissing(['university', 'workspaces']);

        $roleEnum = $user->role instanceof UserRole
            ? $user->role
            : UserRole::fromValueOrLabel($user->role);

        $roleLabel = $roleEnum ? $roleEnum->label() : null;
        $roleKey = $roleEnum ? $roleEnum->value : null;

        // Determine authorized workspaces based on internal role
        $authorizedWorkspaces = [];

        if ($roleEnum === UserRole::SYSTEM_ADMINISTRATOR && $user->university) {
            // System Administrator can view all workspaces under their university
            $authorizedWorkspaces = $user->university
                ->workspaces()
                ->select(['id', 'university_id', 'name', 'description', 'status', 'created_at'])
                ->get()
                ->map(fn ($ws) => [
                    'id' => $ws->id,
                    'name' => $ws->name,
                    'description' => $ws->description,
                    'status' => $ws->status,
                    'access_level' => 'admin',
                ]);
        } elseif ($roleEnum === UserRole::STAFF) {
            // Staff only sees workspaces with an approved membership
            $authorizedWorkspaces = $user->workspaces
                ->map(fn ($ws) => [
                    'id' => $ws->id,
                    'name' => $ws->name,
                    'description' => $ws->description,
                    'status' => $ws->status,
                    'access_level' => $ws->pivot->access_level ?? 'member',
                ]);
        }

        return response()->json([
            'user' => [
                'id' => $user->id,
                'clerk_user_id' => $user->clerk_user_id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $roleLabel,
                'role_key' => $roleKey,
                'university' => $user->university ? [
                    'id' => $user->university->id,
                    'name' => $user->university->name,
                    'slug' => $user->university->slug,
                    'code' => $user->university->code,
                ] : null,
                'workspaces' => $authorizedWorkspaces,
                'created_at' => $user->created_at?->toISOString(),
            ],
        ]);
    }
}
