<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Channel;
use App\Models\WorkspaceChannel;
use App\Models\Workspace;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WorkspaceChannelController extends Controller
{
    /**
     * Get channels for a workspace (linked + available).
     */
    public function index(int $workspaceId): JsonResponse
    {
        $workspace = Workspace::findOrFail($workspaceId);

        // Get all globally enabled channels
        $allChannels = Channel::enabled()->get();

        // Get linked workspace channels
        $linkedChannels = WorkspaceChannel::where('workspace_id', $workspaceId)
            ->with('channel')
            ->get()
            ->keyBy('channel_id');

        $result = $allChannels->map(function ($channel) use ($linkedChannels) {
            $linked = $linkedChannels->get($channel->id);
            return [
                'id' => $channel->id,
                'name' => $channel->name,
                'name_en' => $channel->name_en,
                'type' => $channel->type,
                'icon' => $channel->icon,
                'is_globally_enabled' => $channel->is_enabled,
                'is_linked' => $linked !== null,
                'is_active' => $linked?->is_active ?? false,
                'workspace_channel_id' => $linked?->id,
                'config' => $linked?->config,
            ];
        });

        return response()->json(['data' => $result]);
    }

    /**
     * Link a channel to a workspace.
     */
    public function link(int $workspaceId, int $channelId): JsonResponse
    {
        $channel = Channel::findOrFail($channelId);

        if (!$channel->is_enabled) {
            return response()->json([
                'message' => 'Cannot link a globally disabled channel.',
            ], 422);
        }

        $existing = WorkspaceChannel::where('workspace_id', $workspaceId)
            ->where('channel_id', $channelId)
            ->first();

        if ($existing) {
            return response()->json(['message' => 'Channel already linked.'], 422);
        }

        $wc = WorkspaceChannel::create([
            'workspace_id' => $workspaceId,
            'channel_id' => $channelId,
            'is_active' => true,
        ]);

        return response()->json(['data' => $wc->load('channel')], 201);
    }

    /**
     * Unlink a channel from a workspace.
     */
    public function unlink(int $workspaceId, int $channelId): JsonResponse
    {
        $wc = WorkspaceChannel::where('workspace_id', $workspaceId)
            ->where('channel_id', $channelId)
            ->firstOrFail();

        $wc->delete();

        return response()->json(['message' => 'Channel unlinked successfully.']);
    }

    /**
     * Activate a channel within a workspace.
     */
    public function activate(int $workspaceId, int $channelId): JsonResponse
    {
        $wc = WorkspaceChannel::where('workspace_id', $workspaceId)
            ->where('channel_id', $channelId)
            ->firstOrFail();

        $wc->update(['is_active' => true]);

        return response()->json(['data' => $wc->fresh()->load('channel')]);
    }

    /**
     * Deactivate a channel within a workspace.
     */
    public function deactivate(int $workspaceId, int $channelId): JsonResponse
    {
        $wc = WorkspaceChannel::where('workspace_id', $workspaceId)
            ->where('channel_id', $channelId)
            ->firstOrFail();

        $wc->update(['is_active' => false]);

        return response()->json(['data' => $wc->fresh()->load('channel')]);
    }
}
