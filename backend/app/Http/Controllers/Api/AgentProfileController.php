<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AgentProfile;
use App\Models\Workspace;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AgentProfileController extends Controller
{
    /**
     * Get the agent profile for a workspace.
     */
    public function show(int $workspaceId): JsonResponse
    {
        $workspace = Workspace::findOrFail($workspaceId);
        $profile = $workspace->agentProfile()->with('llmModel')->first();

        if (!$profile) {
            return response()->json(['data' => null, 'exists' => false]);
        }

        return response()->json(['data' => $profile, 'exists' => true]);
    }

    /**
     * Create a new agent profile for a workspace.
     */
    public function store(Request $request, int $workspaceId): JsonResponse
    {
        $workspace = Workspace::findOrFail($workspaceId);

        // Enforce one profile per workspace
        if ($workspace->agentProfile) {
            return response()->json([
                'message' => 'Agent profile already exists for this workspace.',
            ], 422);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'system_instructions' => 'nullable|string',
            'selected_llm_model_id' => 'nullable|exists:llm_models,id',
            'temperature' => 'nullable|numeric|min:0|max:2',
            'max_tokens' => 'nullable|integer|min:100|max:32000',
            'use_knowledge_base' => 'nullable|boolean',
            'support_case_auto_create' => 'nullable|boolean',
            'support_case_conditions' => 'nullable|string',
            'staff_auto_assign' => 'nullable|boolean',
            'auto_assign_staff_ids' => 'nullable|array',
            'status' => 'nullable|string|in:active,training,inactive',
        ]);

        $profile = AgentProfile::create(array_merge(
            ['workspace_id' => $workspaceId],
            $validated
        ));

        return response()->json(['data' => $profile->load('llmModel')], 201);
    }

    /**
     * Update the agent profile for a workspace.
     */
    public function update(Request $request, int $workspaceId): JsonResponse
    {
        $workspace = Workspace::findOrFail($workspaceId);
        $profile = $workspace->agentProfile;

        if (!$profile) {
            return response()->json(['message' => 'Agent profile not found.'], 404);
        }

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'system_instructions' => 'nullable|string',
            'selected_llm_model_id' => 'nullable|exists:llm_models,id',
            'temperature' => 'nullable|numeric|min:0|max:2',
            'max_tokens' => 'nullable|integer|min:100|max:32000',
            'use_knowledge_base' => 'nullable|boolean',
            'support_case_auto_create' => 'nullable|boolean',
            'support_case_conditions' => 'nullable|string',
            'staff_auto_assign' => 'nullable|boolean',
            'auto_assign_staff_ids' => 'nullable|array',
            'status' => 'nullable|string|in:active,training,inactive',
        ]);

        $profile->update($validated);

        return response()->json(['data' => $profile->fresh()->load('llmModel')]);
    }
}
