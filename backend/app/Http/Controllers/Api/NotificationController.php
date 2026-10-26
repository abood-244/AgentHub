<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    /**
     * Get notifications for the authenticated user.
     */
    public function index(Request $request): JsonResponse
    {
        $userId = $request->attributes->get('auth_user_id');

        $notifications = Notification::where('user_id', $userId)
            ->orderBy('created_at', 'desc')
            ->paginate($request->get('per_page', 20));

        return response()->json($notifications);
    }

    /**
     * Get unread count.
     */
    public function unreadCount(Request $request): JsonResponse
    {
        $userId = $request->attributes->get('auth_user_id');
        $count = Notification::where('user_id', $userId)->where('is_read', false)->count();

        return response()->json(['count' => $count]);
    }

    /**
     * Mark a notification as read.
     */
    public function markAsRead(Request $request, int $notificationId): JsonResponse
    {
        $userId = $request->attributes->get('auth_user_id');
        $notification = Notification::where('user_id', $userId)->findOrFail($notificationId);
        $notification->markAsRead();

        return response()->json(['data' => $notification->fresh()]);
    }

    /**
     * Mark all notifications as read.
     */
    public function markAllAsRead(Request $request): JsonResponse
    {
        $userId = $request->attributes->get('auth_user_id');

        Notification::where('user_id', $userId)
            ->where('is_read', false)
            ->update([
                'is_read' => true,
                'read_at' => now(),
            ]);

        return response()->json(['message' => 'All notifications marked as read.']);
    }
}
