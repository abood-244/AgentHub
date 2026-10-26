<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Conversation;
use App\Models\EndUser;
use App\Models\Workspace;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ConversationController extends Controller
{
    /**
     * List conversations for a workspace.
     */
    public function index(Request $request, int $workspaceId): JsonResponse
    {
        $query = Conversation::where('workspace_id', $workspaceId)
            ->real() // exclude test conversations
            ->with(['endUser', 'assignedStaff'])
            ->withCount('messages');

        // Filter by handler (ai / human / mixed)
        if ($request->has('handler') && in_array($request->handler, ['ai', 'human', 'mixed'])) {
            $query->where('handler', $request->handler);
        }

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Search by end user name
        if ($request->has('search') && !empty($request->search)) {
            $query->whereHas('endUser', function ($q) use ($request) {
                $q->where('name', 'ILIKE', '%' . $request->search . '%')
                  ->orWhere('email', 'ILIKE', '%' . $request->search . '%')
                  ->orWhere('phone', 'ILIKE', '%' . $request->search . '%');
            });
        }

        $conversations = $query->orderBy('last_message_at', 'desc')
            ->paginate($request->get('per_page', 20));

        return response()->json($conversations);
    }

    /**
     * Show a specific conversation with messages.
     */
    public function show(int $workspaceId, int $conversationId): JsonResponse
    {
        $conversation = Conversation::where('workspace_id', $workspaceId)
            ->with(['endUser', 'assignedStaff'])
            ->findOrFail($conversationId);

        return response()->json(['data' => $conversation]);
    }

    /**
     * Get messages for a conversation.
     */
    public function messages(Request $request, int $workspaceId, int $conversationId): JsonResponse
    {
        $conversation = Conversation::where('workspace_id', $workspaceId)
            ->findOrFail($conversationId);

        $messages = $conversation->messages()
            ->orderBy('created_at', 'asc')
            ->paginate($request->get('per_page', 50));

        return response()->json($messages);
    }

    /**
     * Store a new message in a conversation from staff.
     */
    public function storeMessage(Request $request, int $workspaceId, int $conversationId): JsonResponse
    {
        $conversation = Conversation::where('workspace_id', $workspaceId)->findOrFail($conversationId);
        $endUser = $conversation->endUser;

        if ($endUser && $endUser->is_blocked) {
            return response()->json(['message' => 'هذا المستخدم محظور بالكامل ولا يمكن إرسال أو استقبال رسائل منه.'], 403);
        }

        $validated = $request->validate([
            'content' => 'required|string|max:5000',
        ]);

        $message = $conversation->messages()->create([
            'workspace_id' => $workspaceId,
            'sender_type' => 'staff',
            'sender_id' => $request->user()?->id,
            'content' => $validated['content'],
            'created_at' => now(),
        ]);

        $conversation->update([
            'last_message_at' => now(),
            'handler' => 'mixed', // Staff participated
        ]);

        return response()->json(['data' => $message], 201);
    }
}

