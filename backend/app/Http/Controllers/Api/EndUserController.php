<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\EndUser;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EndUserController extends Controller
{
    /**
     * List end users for a workspace.
     */
    public function index(Request $request, int $workspaceId): JsonResponse
    {
        $query = EndUser::where('workspace_id', $workspaceId)
            ->withCount(['conversations', 'supportCases']);

        if ($request->has('search') && !empty($request->search)) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'ILIKE', '%' . $request->search . '%')
                  ->orWhere('email', 'ILIKE', '%' . $request->search . '%')
                  ->orWhere('phone', 'ILIKE', '%' . $request->search . '%');
            });
        }

        if ($request->has('is_blocked')) {
            $query->where('is_blocked', filter_var($request->is_blocked, FILTER_VALIDATE_BOOLEAN));
        }

        $users = $query->orderBy('last_seen_at', 'desc')
            ->paginate($request->get('per_page', 20));

        return response()->json($users);
    }

    /**
     * Show a specific end user with related data.
     */
    public function show(int $workspaceId, int $userId): JsonResponse
    {
        $user = EndUser::where('workspace_id', $workspaceId)
            ->with([
                'conversations' => fn($q) => $q->real()->orderBy('last_message_at', 'desc')->limit(15),
                'supportCases' => fn($q) => $q->orderBy('created_at', 'desc')->limit(15),
            ])
            ->withCount(['conversations', 'supportCases'])
            ->findOrFail($userId);

        return response()->json(['data' => $user]);
    }

    /**
     * Block an end user.
     */
    public function block(int $workspaceId, int $userId): JsonResponse
    {
        $user = EndUser::where('workspace_id', $workspaceId)->findOrFail($userId);
        $user->update(['is_blocked' => true]);

        return response()->json(['data' => $user->fresh(), 'message' => 'User blocked.']);
    }

    /**
     * Unblock an end user.
     */
    public function unblock(int $workspaceId, int $userId): JsonResponse
    {
        $user = EndUser::where('workspace_id', $workspaceId)->findOrFail($userId);
        $user->update(['is_blocked' => false]);

        return response()->json(['data' => $user->fresh(), 'message' => 'User unblocked.']);
    }

    /**
     * Pause AI responses for an end user.
     */
    public function pauseAi(int $workspaceId, int $userId): JsonResponse
    {
        $user = EndUser::where('workspace_id', $workspaceId)->findOrFail($userId);
        $user->update(['ai_responses_paused' => true]);

        return response()->json(['data' => $user->fresh(), 'message' => 'AI responses paused.']);
    }

    /**
     * Resume AI responses for an end user.
     */
    public function resumeAi(int $workspaceId, int $userId): JsonResponse
    {
        $user = EndUser::where('workspace_id', $workspaceId)->findOrFail($userId);
        $user->update(['ai_responses_paused' => false]);

        return response()->json(['data' => $user->fresh(), 'message' => 'AI responses resumed.']);
    }
}
