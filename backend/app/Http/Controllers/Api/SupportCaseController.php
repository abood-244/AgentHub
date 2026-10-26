<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SupportCase;
use App\Models\SupportCaseLog;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SupportCaseController extends Controller
{
    public function __construct(
        protected NotificationService $notificationService
    ) {}

    /**
     * List support cases for a workspace.
     */
    public function index(Request $request, int $workspaceId): JsonResponse
    {
        $query = SupportCase::where('workspace_id', $workspaceId)
            ->with(['endUser', 'assignedStaff', 'createdBy']);

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }
        if ($request->has('priority')) {
            $query->where('priority', $request->priority);
        }
        if ($request->has('assigned_staff_id')) {
            $query->where('assigned_staff_id', $request->assigned_staff_id);
        }
        if ($request->has('search') && !empty($request->search)) {
            $query->where(function ($q) use ($request) {
                $q->where('title', 'ILIKE', '%' . $request->search . '%')
                  ->orWhere('case_number', 'ILIKE', '%' . $request->search . '%');
            });
        }

        $cases = $query->orderBy('created_at', 'desc')
            ->paginate($request->get('per_page', 20));

        return response()->json($cases);
    }

    /**
     * Create a new support case (manual).
     */
    public function store(Request $request, int $workspaceId): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'end_user_id' => 'nullable|exists:end_users,id',
            'conversation_id' => 'nullable|exists:conversations,id',
            'category' => 'nullable|string|max:100',
            'assigned_staff_id' => 'nullable|exists:users,id',
            'summary' => 'nullable|string',
            'required_action' => 'nullable|string',
            'priority' => 'nullable|string|in:low,medium,high,urgent',
        ]);

        return DB::transaction(function () use ($validated, $workspaceId, $request) {
            $case = SupportCase::create(array_merge($validated, [
                'workspace_id' => $workspaceId,
                'source' => 'manual',
                'status' => 'new',
                'created_by_user_id' => $request->attributes->get('auth_user_id'),
            ]));

            // Log creation
            SupportCaseLog::create([
                'support_case_id' => $case->id,
                'action' => 'created',
                'performed_by_user_id' => $request->attributes->get('auth_user_id'),
                'details' => ['source' => 'manual'],
                'created_at' => now(),
            ]);

            // Send notification if assigned
            if ($case->assigned_staff_id) {
                SupportCaseLog::create([
                    'support_case_id' => $case->id,
                    'action' => 'assigned',
                    'performed_by_user_id' => $request->attributes->get('auth_user_id'),
                    'details' => ['assigned_to' => $case->assigned_staff_id],
                    'created_at' => now(),
                ]);

                $this->notificationService->notifySupportCaseCreated(
                    $case->assigned_staff_id,
                    $case->toArray()
                );
            }

            return response()->json(['data' => $case->load(['endUser', 'assignedStaff'])], 201);
        });
    }

    /**
     * Show a specific support case.
     */
    public function show(int $workspaceId, int $caseId): JsonResponse
    {
        $case = SupportCase::where('workspace_id', $workspaceId)
            ->with(['endUser', 'assignedStaff', 'createdBy', 'conversation'])
            ->findOrFail($caseId);

        return response()->json(['data' => $case]);
    }

    /**
     * Update a support case.
     */
    public function update(Request $request, int $workspaceId, int $caseId): JsonResponse
    {
        $case = SupportCase::where('workspace_id', $workspaceId)->findOrFail($caseId);

        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'category' => 'nullable|string|max:100',
            'summary' => 'nullable|string',
            'required_action' => 'nullable|string',
            'priority' => 'nullable|string|in:low,medium,high,urgent',
        ]);

        $case->update($validated);

        return response()->json(['data' => $case->fresh()->load(['endUser', 'assignedStaff'])]);
    }

    /**
     * Change the status of a support case.
     */
    public function changeStatus(Request $request, int $workspaceId, int $caseId): JsonResponse
    {
        $case = SupportCase::where('workspace_id', $workspaceId)->findOrFail($caseId);

        $validated = $request->validate([
            'status' => 'required|string|in:new,in_progress,closed',
        ]);

        $oldStatus = $case->status;
        $newStatus = $validated['status'];

        // Validate transition rules
        $validTransitions = [
            'new' => ['in_progress', 'closed'],
            'in_progress' => ['closed', 'new'],
            'closed' => ['new'], // reopen
        ];

        if (!in_array($newStatus, $validTransitions[$oldStatus] ?? [])) {
            return response()->json([
                'message' => "Cannot transition from '{$oldStatus}' to '{$newStatus}'.",
            ], 422);
        }

        $case->update([
            'status' => $newStatus,
            'closed_at' => $newStatus === 'closed' ? now() : null,
        ]);

        SupportCaseLog::create([
            'support_case_id' => $case->id,
            'action' => 'status_changed',
            'performed_by_user_id' => $request->attributes->get('auth_user_id'),
            'details' => ['from' => $oldStatus, 'to' => $newStatus],
            'created_at' => now(),
        ]);

        return response()->json(['data' => $case->fresh()->load(['endUser', 'assignedStaff'])]);
    }

    /**
     * Assign a staff member to a support case.
     */
    public function assign(Request $request, int $workspaceId, int $caseId): JsonResponse
    {
        $case = SupportCase::where('workspace_id', $workspaceId)->findOrFail($caseId);

        $validated = $request->validate([
            'assigned_staff_id' => 'required|exists:users,id',
        ]);

        $oldStaffId = $case->assigned_staff_id;
        $case->update(['assigned_staff_id' => $validated['assigned_staff_id']]);

        SupportCaseLog::create([
            'support_case_id' => $case->id,
            'action' => 'assigned',
            'performed_by_user_id' => $request->attributes->get('auth_user_id'),
            'details' => [
                'previous_staff_id' => $oldStaffId,
                'new_staff_id' => $validated['assigned_staff_id'],
            ],
            'created_at' => now(),
        ]);

        // Notify the assigned staff
        $this->notificationService->notifySupportCaseAssigned(
            $validated['assigned_staff_id'],
            $case->toArray()
        );

        return response()->json(['data' => $case->fresh()->load(['endUser', 'assignedStaff'])]);
    }

    /**
     * Get logs for a support case.
     */
    public function logs(int $workspaceId, int $caseId): JsonResponse
    {
        $case = SupportCase::where('workspace_id', $workspaceId)->findOrFail($caseId);

        $logs = $case->logs()->with('performedBy')->get();

        return response()->json(['data' => $logs]);
    }

    /**
     * Get summary stats for workspace support cases.
     */
    public function stats(int $workspaceId): JsonResponse
    {
        $total = SupportCase::where('workspace_id', $workspaceId)->count();
        $newCount = SupportCase::where('workspace_id', $workspaceId)->where('status', 'new')->count();
        $inProgressCount = SupportCase::where('workspace_id', $workspaceId)->where('status', 'in_progress')->count();
        $closedCount = SupportCase::where('workspace_id', $workspaceId)->where('status', 'closed')->count();

        return response()->json([
            'data' => [
                'total' => $total,
                'new' => $newCount,
                'in_progress' => $inProgressCount,
                'closed' => $closedCount,
            ],
        ]);
    }
}
