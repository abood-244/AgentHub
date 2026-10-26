<?php

namespace App\Http\Controllers\Api;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\Workspace;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class WorkspaceController extends Controller
{
    /**
     * Display a listing of workspaces within the user's authorized scope.
     */
    public function index(Request $request): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();

        if ($user->role === UserRole::SYSTEM_ADMINISTRATOR) {
            if (! $user->university_id) {
                return response()->json(['workspaces' => []]);
            }

            $workspaces = Workspace::where('university_id', $user->university_id)
                ->orderBy('id')
                ->get()
                ->map(fn ($ws) => [
                    'id' => $ws->id,
                    'university_id' => $ws->university_id,
                    'name' => $ws->name,
                    'description' => $ws->description,
                    'status' => $ws->status,
                    'access_level' => 'admin',
                    'created_at' => $ws->created_at?->toISOString(),
                    'updated_at' => $ws->updated_at?->toISOString(),
                ]);

            return response()->json(['workspaces' => $workspaces]);
        }

        if ($user->role === UserRole::STAFF) {
            $workspaces = $user->workspaces()
                ->orderBy('workspaces.id')
                ->get()
                ->map(fn ($ws) => [
                    'id' => $ws->id,
                    'university_id' => $ws->university_id,
                    'name' => $ws->name,
                    'description' => $ws->description,
                    'status' => $ws->status,
                    'access_level' => $ws->pivot->access_level ?? 'member',
                    'created_at' => $ws->created_at?->toISOString(),
                    'updated_at' => $ws->updated_at?->toISOString(),
                ]);

            return response()->json(['workspaces' => $workspaces]);
        }

        if ($user->role === UserRole::PLATFORM_ADMINISTRATOR) {
            // Platform Administrator receives empty collection in Sprint 1 scope
            return response()->json(['workspaces' => []]);
        }

        return response()->json([
            'message' => 'Forbidden: User has no assigned internal role.',
        ], 403);
    }

    /**
     * Store a newly created workspace under the authenticated user's university.
     */
    public function store(Request $request): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();

        // Enforce role restriction: System Administrators only
        if ($user->role !== UserRole::SYSTEM_ADMINISTRATOR) {
            return response()->json([
                'message' => 'Forbidden: Only System Administrators can create workspaces.',
            ], 403);
        }

        if (! $user->university_id) {
            return response()->json([
                'message' => 'Forbidden: User has no associated university.',
            ], 403);
        }

        Gate::authorize('create', Workspace::class);

        // Reject attempts to override or supply a different university_id
        if ($request->has('university_id') && (int) $request->input('university_id') !== (int) $user->university_id) {
            return response()->json([
                'message' => 'Forbidden: You cannot create a workspace for another university.',
            ], 403);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'status' => ['sometimes', 'string', 'in:active,paused,archived'],
        ]);

        $workspace = Workspace::create([
            'university_id' => $user->university_id,
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'status' => $validated['status'] ?? 'active',
        ]);

        return response()->json([
            'message' => 'Workspace created successfully.',
            'workspace' => [
                'id' => $workspace->id,
                'university_id' => $workspace->university_id,
                'name' => $workspace->name,
                'description' => $workspace->description,
                'status' => $workspace->status,
                'access_level' => 'admin',
                'created_at' => $workspace->created_at?->toISOString(),
                'updated_at' => $workspace->updated_at?->toISOString(),
            ],
        ], 201);
    }

    /**
     * Display the specified workspace if authorized.
     */
    public function show(Request $request, int|string $id): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();

        $workspace = Workspace::find($id);

        if (! $workspace) {
            return response()->json([
                'message' => 'Workspace not found.',
            ], 404);
        }

        // Cross-tenant and membership checks
        if ($user->role === UserRole::SYSTEM_ADMINISTRATOR) {
            if ((int) $workspace->university_id !== (int) $user->university_id) {
                return response()->json([
                    'message' => 'Forbidden: You do not have permission to view this workspace.',
                ], 403);
            }
        } elseif ($user->role === UserRole::STAFF) {
            $isMember = $workspace->members()->where('user_id', $user->id)->exists();
            if (! $isMember) {
                return response()->json([
                    'message' => 'Forbidden: You are not a member of this workspace.',
                ], 403);
            }
        } else {
            // Platform admin or other roles
            return response()->json([
                'message' => 'Forbidden: You do not have permission to view this workspace.',
            ], 403);
        }

        Gate::authorize('view', $workspace);

        $accessLevel = $user->role === UserRole::SYSTEM_ADMINISTRATOR
            ? 'admin'
            : ($workspace->members()->where('user_id', $user->id)->value('access_level') ?? 'member');

        return response()->json([
            'workspace' => [
                'id' => $workspace->id,
                'university_id' => $workspace->university_id,
                'name' => $workspace->name,
                'description' => $workspace->description,
                'status' => $workspace->status,
                'access_level' => $accessLevel,
                'category' => $workspace->category,
                'default_language' => $workspace->default_language,
                'selected_embedding_model_id' => $workspace->selected_embedding_model_id,
                'created_at' => $workspace->created_at?->toISOString(),
                'updated_at' => $workspace->updated_at?->toISOString(),
            ],
        ]);
    }

    /**
     * Update the specified workspace if authorized.
     */
    public function update(Request $request, int|string $id): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();

        $workspace = Workspace::find($id);

        if (! $workspace) {
            return response()->json([
                'message' => 'Workspace not found.',
            ], 404);
        }

        // Only System Administrator of the owning university can update
        if ($user->role !== UserRole::SYSTEM_ADMINISTRATOR) {
            return response()->json([
                'message' => 'Forbidden: Only System Administrators can update workspaces.',
            ], 403);
        }

        if ((int) $workspace->university_id !== (int) $user->university_id) {
            return response()->json([
                'message' => 'Forbidden: You cannot modify a workspace belonging to another university.',
            ], 403);
        }

        // Reject attempt to alter university_id
        if ($request->has('university_id') && (int) $request->input('university_id') !== (int) $workspace->university_id) {
            return response()->json([
                'message' => 'Forbidden: You cannot change the university association of a workspace.',
            ], 403);
        }

        Gate::authorize('update', $workspace);

        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'name_en' => ['sometimes', 'nullable', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string', 'max:1000'],
            'description_en' => ['sometimes', 'nullable', 'string', 'max:1000'],
            'status' => ['sometimes', 'string', 'in:active,paused,archived'],
            'category' => ['sometimes', 'nullable', 'string', 'max:50'],
            'default_language' => ['sometimes', 'string', 'in:ar,en'],
            'selected_embedding_model_id' => ['sometimes', 'nullable', 'exists:embedding_models,id'],
        ]);

        $workspace->update($validated);

        return response()->json([
            'message' => 'Workspace updated successfully.',
            'workspace' => [
                'id' => $workspace->id,
                'university_id' => $workspace->university_id,
                'name' => $workspace->name,
                'description' => $workspace->description,
                'status' => $workspace->status,
                'access_level' => 'admin',
                'category' => $workspace->category,
                'default_language' => $workspace->default_language,
                'selected_embedding_model_id' => $workspace->selected_embedding_model_id,
                'created_at' => $workspace->created_at?->toISOString(),
                'updated_at' => $workspace->updated_at?->toISOString(),
            ],
        ]);
    }

    /**
     * Remove the specified workspace if authorized.
     */
    public function destroy(Request $request, int|string $id): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();

        $workspace = Workspace::find($id);

        if (! $workspace) {
            return response()->json([
                'message' => 'Workspace not found.',
            ], 404);
        }

        if ($user->role !== UserRole::SYSTEM_ADMINISTRATOR) {
            return response()->json([
                'message' => 'Forbidden: Only System Administrators can delete workspaces.',
            ], 403);
        }

        if ((int) $workspace->university_id !== (int) $user->university_id) {
            return response()->json([
                'message' => 'Forbidden: You cannot delete a workspace belonging to another university.',
            ], 403);
        }

        $workspace->delete();

        return response()->json([
            'message' => 'Workspace deleted successfully.',
        ]);
    }

    /**
     * Get staff members for a workspace.
     */
    public function members(Request $request, int|string $id): JsonResponse
    {
        $workspace = Workspace::findOrFail($id);
        $users = $workspace->users()
            ->select('users.id', 'users.name', 'users.email', 'users.role')
            ->get();

        if ($users->isEmpty() && $workspace->university_id) {
            $users = \App\Models\User::where('university_id', $workspace->university_id)
                ->whereIn('role', [UserRole::STAFF, UserRole::SYSTEM_ADMINISTRATOR])
                ->select('id', 'name', 'email', 'role')
                ->get();
        }

        $formatted = $users->map(fn($u) => [
            'user' => [
                'id' => $u->id,
                'name' => $u->name,
                'email' => $u->email,
                'role' => $u->role?->value ?? $u->role,
            ],
            'access_level' => $u->pivot->access_level ?? 'member',
        ]);

        return response()->json(['members' => $formatted, 'data' => $formatted]);
    }
}
