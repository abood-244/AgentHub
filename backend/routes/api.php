<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'app' => 'AgentHub API',
        'version' => '1.0.0',
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

    // Workspace APIs (Sprint 1)
    Route::get('/workspaces', [\App\Http\Controllers\Api\WorkspaceController::class, 'index']);
    Route::post('/workspaces', [\App\Http\Controllers\Api\WorkspaceController::class, 'store']);
    Route::get('/workspaces/{id}', [\App\Http\Controllers\Api\WorkspaceController::class, 'show']);
    Route::match(['put', 'patch'], '/workspaces/{id}', [\App\Http\Controllers\Api\WorkspaceController::class, 'update']);
});

