<?php

namespace App\Http\Controllers\Api;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\University;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class UniversityController extends Controller
{
    /**
     * Display the authenticated user's university.
     */
    public function show(Request $request): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();

        // Enforce role check
        if ($user->role !== UserRole::SYSTEM_ADMINISTRATOR) {
            return response()->json([
                'message' => 'Forbidden: Only System Administrators can access university details.',
            ], 403);
        }

        if (! $user->university_id || ! $user->university) {
            return response()->json([
                'message' => 'University not found for current user.',
            ], 404);
        }

        Gate::authorize('view', $user->university);

        return response()->json([
            'university' => [
                'id' => $user->university->id,
                'name' => $user->university->name,
                'slug' => $user->university->slug,
                'code' => $user->university->code,
                'contact_email' => $user->university->contact_email,
                'contact_phone' => $user->university->contact_phone,
                'website' => $user->university->website,
                'created_at' => $user->university->created_at?->toISOString(),
                'updated_at' => $user->university->updated_at?->toISOString(),
            ],
        ]);
    }

    /**
     * Update the authenticated user's university.
     */
    public function update(Request $request): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();

        // Enforce role check
        if ($user->role !== UserRole::SYSTEM_ADMINISTRATOR) {
            return response()->json([
                'message' => 'Forbidden: Only System Administrators can update university settings.',
            ], 403);
        }

        if (! $user->university_id || ! $user->university) {
            return response()->json([
                'message' => 'University not found for current user.',
            ], 404);
        }

        // Prevent client manipulation: reject attempts to specify or override a different university ID
        if ($request->has('university_id') && (int) $request->input('university_id') !== (int) $user->university_id) {
            return response()->json([
                'message' => 'Forbidden: You cannot modify a university other than your own.',
            ], 403);
        }

        if ($request->has('id') && (int) $request->input('id') !== (int) $user->university_id) {
            return response()->json([
                'message' => 'Forbidden: You cannot modify a university other than your own.',
            ], 403);
        }

        $university = $user->university;

        Gate::authorize('update', $university);

        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'code' => ['sometimes', 'nullable', 'string', 'max:50', Rule::unique('universities', 'code')->ignore($university->id)],
            'contact_email' => ['sometimes', 'nullable', 'email', 'max:255'],
            'contact_phone' => ['sometimes', 'nullable', 'string', 'max:50'],
            'website' => ['sometimes', 'nullable', 'string', 'max:255'],
        ]);

        $university->update($validated);

        return response()->json([
            'message' => 'University updated successfully.',
            'university' => [
                'id' => $university->id,
                'name' => $university->name,
                'slug' => $university->slug,
                'code' => $university->code,
                'contact_email' => $university->contact_email,
                'contact_phone' => $university->contact_phone,
                'website' => $university->website,
                'created_at' => $university->created_at?->toISOString(),
                'updated_at' => $university->updated_at?->toISOString(),
            ],
        ]);
    }
}
