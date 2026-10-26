<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'app' => 'AgentHub API',
        'version' => '2.0.0',
        'timestamp' => now()->toISOString(),
    ]);
});

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::middleware('auth.clerk')->group(function () {
    Route::get('/me', [\App\Http\Controllers\Api\AuthController::class, 'me']);

    // University APIs (Sprint 1)
    Route::get('/university', [\App\Http\Controllers\Api\UniversityController::class, 'show']);
    Route::match(['put', 'patch'], '/university', [\App\Http\Controllers\Api\UniversityController::class, 'update']);

    // Workspace APIs (Sprint 1 + Sprint 2)
    Route::get('/workspaces', [\App\Http\Controllers\Api\WorkspaceController::class, 'index']);
    Route::post('/workspaces', [\App\Http\Controllers\Api\WorkspaceController::class, 'store']);
    Route::get('/workspaces/{id}', [\App\Http\Controllers\Api\WorkspaceController::class, 'show']);
    Route::match(['put', 'patch'], '/workspaces/{id}', [\App\Http\Controllers\Api\WorkspaceController::class, 'update']);
    Route::delete('/workspaces/{id}', [\App\Http\Controllers\Api\WorkspaceController::class, 'destroy']);

    // ─── Sprint 2: LLM & Embedding Models ─────────────────────
    Route::get('/llm-models', [\App\Http\Controllers\Api\LlmModelController::class, 'index']);
    Route::get('/embedding-models', [\App\Http\Controllers\Api\LlmModelController::class, 'embeddingModels']);

    // ─── Sprint 2: Notifications ───────────────────────────────
    Route::get('/notifications', [\App\Http\Controllers\Api\NotificationController::class, 'index']);
    Route::get('/notifications/unread-count', [\App\Http\Controllers\Api\NotificationController::class, 'unreadCount']);
    Route::post('/notifications/{id}/read', [\App\Http\Controllers\Api\NotificationController::class, 'markAsRead']);
    Route::post('/notifications/read-all', [\App\Http\Controllers\Api\NotificationController::class, 'markAllAsRead']);

    // ─── Sprint 2: Workspace Internal Components ───────────────
    Route::prefix('workspaces/{workspaceId}')->group(function () {

        // Overview Stats
        Route::get('/overview-stats', [\App\Http\Controllers\Api\InsightsController::class, 'overviewStats']);

        // Agent Profile (one per workspace)
        Route::get('/agent-profile', [\App\Http\Controllers\Api\AgentProfileController::class, 'show']);
        Route::post('/agent-profile', [\App\Http\Controllers\Api\AgentProfileController::class, 'store']);
        Route::match(['put', 'patch'], '/agent-profile', [\App\Http\Controllers\Api\AgentProfileController::class, 'update']);

        // Workspace Members
        Route::get('/members', [\App\Http\Controllers\Api\WorkspaceController::class, 'members']);

        // Documents (Knowledge Base / Database)
        Route::get('/documents', [\App\Http\Controllers\Api\DocumentController::class, 'index']);
        Route::post('/documents', [\App\Http\Controllers\Api\DocumentController::class, 'store']);
        Route::post('/documents/preview-csv', [\App\Http\Controllers\Api\DocumentController::class, 'previewCsv']);
        Route::get('/documents/{docId}', [\App\Http\Controllers\Api\DocumentController::class, 'show']);
        Route::match(['put', 'patch'], '/documents/{docId}', [\App\Http\Controllers\Api\DocumentController::class, 'update']);
        Route::delete('/documents/{docId}', [\App\Http\Controllers\Api\DocumentController::class, 'destroy']);
        Route::get('/documents/{docId}/chunks', [\App\Http\Controllers\Api\DocumentController::class, 'chunks']);

        // Conversations
        Route::get('/conversations', [\App\Http\Controllers\Api\ConversationController::class, 'index']);
        Route::get('/conversations/{convId}', [\App\Http\Controllers\Api\ConversationController::class, 'show']);
        Route::get('/conversations/{convId}/messages', [\App\Http\Controllers\Api\ConversationController::class, 'messages']);
        Route::post('/conversations/{convId}/messages', [\App\Http\Controllers\Api\ConversationController::class, 'storeMessage']);

        // Support Cases
        Route::get('/support-cases', [\App\Http\Controllers\Api\SupportCaseController::class, 'index']);
        Route::get('/support-cases/stats', [\App\Http\Controllers\Api\SupportCaseController::class, 'stats']);
        Route::post('/support-cases', [\App\Http\Controllers\Api\SupportCaseController::class, 'store']);
        Route::get('/support-cases/{caseId}', [\App\Http\Controllers\Api\SupportCaseController::class, 'show']);
        Route::match(['put', 'patch'], '/support-cases/{caseId}', [\App\Http\Controllers\Api\SupportCaseController::class, 'update']);
        Route::post('/support-cases/{caseId}/status', [\App\Http\Controllers\Api\SupportCaseController::class, 'changeStatus']);
        Route::post('/support-cases/{caseId}/assign', [\App\Http\Controllers\Api\SupportCaseController::class, 'assign']);
        Route::get('/support-cases/{caseId}/logs', [\App\Http\Controllers\Api\SupportCaseController::class, 'logs']);

        // Channels
        Route::get('/channels', [\App\Http\Controllers\Api\WorkspaceChannelController::class, 'index']);
        Route::post('/channels/{channelId}/link', [\App\Http\Controllers\Api\WorkspaceChannelController::class, 'link']);
        Route::post('/channels/{channelId}/unlink', [\App\Http\Controllers\Api\WorkspaceChannelController::class, 'unlink']);
        Route::post('/channels/{channelId}/activate', [\App\Http\Controllers\Api\WorkspaceChannelController::class, 'activate']);
        Route::post('/channels/{channelId}/deactivate', [\App\Http\Controllers\Api\WorkspaceChannelController::class, 'deactivate']);

        // End Users (Customers)
        Route::get('/end-users', [\App\Http\Controllers\Api\EndUserController::class, 'index']);
        Route::get('/end-users/{userId}', [\App\Http\Controllers\Api\EndUserController::class, 'show']);
        Route::post('/end-users/{userId}/block', [\App\Http\Controllers\Api\EndUserController::class, 'block']);
        Route::post('/end-users/{userId}/unblock', [\App\Http\Controllers\Api\EndUserController::class, 'unblock']);
        Route::post('/end-users/{userId}/pause-ai', [\App\Http\Controllers\Api\EndUserController::class, 'pauseAi']);
        Route::post('/end-users/{userId}/resume-ai', [\App\Http\Controllers\Api\EndUserController::class, 'resumeAi']);

        // Insights Hub (Reports & Analytics)
        Route::get('/insights/user-analytics', [\App\Http\Controllers\Api\InsightsController::class, 'userAnalytics']);
        Route::get('/insights/questions', [\App\Http\Controllers\Api\InsightsController::class, 'questions']);
        Route::get('/insights/ai-performance', [\App\Http\Controllers\Api\InsightsController::class, 'aiPerformance']);
        Route::get('/insights/human-intervention', [\App\Http\Controllers\Api\InsightsController::class, 'humanIntervention']);
        Route::get('/insights/support-cases', [\App\Http\Controllers\Api\InsightsController::class, 'supportCasesStats']);
        Route::get('/insights/staff-performance', [\App\Http\Controllers\Api\InsightsController::class, 'staffPerformance']);

        // Test Chat (RAG Pipeline)
        Route::post('/test-chat', [\App\Http\Controllers\Api\TestChatController::class, 'chat']);
    });
});
