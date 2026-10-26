<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Conversation;
use App\Models\SupportCase;
use App\Models\EndUser;
use App\Models\Message;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class InsightsController extends Controller
{
    private function applyFilters($query, Request $request, string $column = 'created_at')
    {
        if ($request->has('period')) {
            match ($request->period) {
                'today' => $query->whereDate($column, today()),
                '7d' => $query->where($column, '>=', now()->subDays(7)),
                '30d' => $query->where($column, '>=', now()->subDays(30)),
                default => null,
            };
        } elseif ($request->has('from') && $request->has('to')) {
            $query->whereBetween($column, [$request->from, $request->to]);
        }
        return $query;
    }

    /**
     * User analytics for a workspace.
     */
    public function userAnalytics(Request $request, int $workspaceId): JsonResponse
    {
        $baseQuery = EndUser::where('workspace_id', $workspaceId);
        $totalUsers = (clone $baseQuery)->count();

        $activeQuery = clone $baseQuery;
        if ($request->has('period')) {
            $this->applyFilters($activeQuery, $request, 'last_seen_at');
        } else {
            $activeQuery->where('last_seen_at', '>=', now()->subDays(30));
        }
        $activeUsers = $activeQuery->count();

        // Users over time
        $timeQuery = clone $baseQuery;
        $this->applyFilters($timeQuery, $request, 'created_at');
        if (!$request->has('period') && !$request->has('from')) {
            $timeQuery->where('created_at', '>=', now()->subDays(30));
        }

        $usersOverTime = $timeQuery
            ->selectRaw("DATE(created_at) as date, COUNT(*) as count")
            ->groupByRaw('DATE(created_at)')
            ->orderBy('date')
            ->get();

        return response()->json([
            'data' => [
                'total_users' => $totalUsers,
                'active_users_30d' => $activeUsers,
                'users_over_time' => $usersOverTime,
            ],
        ]);
    }

    /**
     * Questions & topics analytics.
     */
    public function questions(Request $request, int $workspaceId): JsonResponse
    {
        $query = Message::whereHas('conversation', function ($q) use ($workspaceId) {
            $q->where('workspace_id', $workspaceId)->real();
        })->where('sender_type', 'end_user');

        $this->applyFilters($query, $request, 'created_at');

        $totalQuestions = (clone $query)->count();

        // Recent questions with conversation reference
        $recentQuestions = (clone $query)
            ->with(['conversation.endUser'])
            ->orderBy('created_at', 'desc')
            ->limit(30)
            ->get(['id', 'content', 'conversation_id', 'created_at']);

        return response()->json([
            'data' => [
                'total_questions' => $totalQuestions,
                'recent_questions' => $recentQuestions,
            ],
        ]);
    }

    /**
     * AI performance analytics.
     */
    public function aiPerformance(Request $request, int $workspaceId): JsonResponse
    {
        $aiMessages = Message::whereHas('conversation', function ($q) use ($workspaceId) {
            $q->where('workspace_id', $workspaceId)->real();
        })->where('sender_type', 'ai');

        $this->applyFilters($aiMessages, $request, 'created_at');

        $totalAnswered = (clone $aiMessages)->count();
        $answeredWithConfidence = (clone $aiMessages)
            ->where('confidence_score', '>=', 0.7)
            ->count();
        $lowConfidence = (clone $aiMessages)
            ->where('confidence_score', '<', 0.5)
            ->count();
        $unanswered = (clone $aiMessages)
            ->whereNull('confidence_score')
            ->orWhere('confidence_score', '<', 0.3)
            ->count();

        $successRate = $totalAnswered > 0
            ? round(($answeredWithConfidence / $totalAnswered) * 100, 1)
            : 0;

        return response()->json([
            'data' => [
                'total_answered' => $totalAnswered,
                'high_confidence' => $answeredWithConfidence,
                'low_confidence' => $lowConfidence,
                'unanswered' => $unanswered,
                'success_rate' => $successRate,
            ],
        ]);
    }

    /**
     * Human intervention analytics.
     */
    public function humanIntervention(Request $request, int $workspaceId): JsonResponse
    {
        $convQuery = Conversation::where('workspace_id', $workspaceId)->real();
        $this->applyFilters($convQuery, $request, 'created_at');

        $humanConversations = (clone $convQuery)
            ->whereIn('handler', ['human', 'mixed'])
            ->count();

        $totalConversations = (clone $convQuery)->count();

        return response()->json([
            'data' => [
                'human_interventions' => $humanConversations,
                'total_conversations' => $totalConversations,
                'intervention_rate' => $totalConversations > 0
                    ? round(($humanConversations / $totalConversations) * 100, 1)
                    : 0,
            ],
        ]);
    }

    /**
     * Support cases analytics.
     */
    public function supportCasesStats(Request $request, int $workspaceId): JsonResponse
    {
        $query = SupportCase::where('workspace_id', $workspaceId);
        $this->applyFilters($query, $request, 'created_at');

        $total = (clone $query)->count();
        $byStatus = (clone $query)
            ->selectRaw("status, COUNT(*) as count")
            ->groupBy('status')
            ->pluck('count', 'status');

        // Average resolution time (for closed cases)
        $avgResolution = (clone $query)
            ->where('status', 'closed')
            ->whereNotNull('closed_at')
            ->selectRaw("AVG(EXTRACT(EPOCH FROM (closed_at - created_at)) / 3600) as avg_hours")
            ->value('avg_hours');

        // Overdue (>12h)
        $twelveHoursAgo = now()->subHours(12);
        $overdueCount = (clone $query)
            ->where('status', '!=', 'closed')
            ->where('created_at', '<', $twelveHoursAgo)
            ->count();

        // Cases by staff
        $byStaff = (clone $query)
            ->whereNotNull('assigned_staff_id')
            ->with('assignedStaff')
            ->selectRaw("assigned_staff_id, COUNT(*) as count")
            ->groupBy('assigned_staff_id')
            ->get();

        return response()->json([
            'data' => [
                'total' => $total,
                'by_status' => $byStatus,
                'avg_resolution_hours' => $avgResolution ? round($avgResolution, 1) : null,
                'overdue_count' => $overdueCount,
                'by_staff' => $byStaff,
            ],
        ]);
    }

    /**
     * Staff performance analytics.
     */
    public function staffPerformance(Request $request, int $workspaceId): JsonResponse
    {
        $query = SupportCase::where('workspace_id', $workspaceId)
            ->whereNotNull('assigned_staff_id')
            ->with('assignedStaff');

        $this->applyFilters($query, $request, 'created_at');

        $staffStats = $query
            ->selectRaw("
                assigned_staff_id,
                COUNT(*) as total_cases,
                SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed_cases,
                SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END) as open_cases,
                SUM(CASE WHEN status != 'closed' AND created_at < NOW() - INTERVAL '12 hours' THEN 1 ELSE 0 END) as overdue_cases
            ")
            ->groupBy('assigned_staff_id')
            ->get();

        return response()->json(['data' => $staffStats]);
    }

    /**
     * Overview stats for workspace dashboard.
     */
    public function overviewStats(int $workspaceId): JsonResponse
    {
        $newCases = SupportCase::where('workspace_id', $workspaceId)
            ->where('status', 'new')
            ->count();

        $staffCount = DB::table('workspace_members')
            ->where('workspace_id', $workspaceId)
            ->count();

        $channelsCount = DB::table('workspace_channels')
            ->where('workspace_id', $workspaceId)
            ->where('is_active', true)
            ->count();

        $lastDocUpdate = DB::table('documents')
            ->where('workspace_id', $workspaceId)
            ->max('updated_at');

        $totalConversations = Conversation::where('workspace_id', $workspaceId)
            ->real()
            ->count();

        $totalEndUsers = EndUser::where('workspace_id', $workspaceId)->count();

        return response()->json([
            'data' => [
                'new_support_cases' => $newCases,
                'staff_count' => $staffCount,
                'active_channels' => $channelsCount,
                'last_db_update' => $lastDocUpdate,
                'total_conversations' => $totalConversations,
                'total_end_users' => $totalEndUsers,
            ],
        ]);
    }
}
