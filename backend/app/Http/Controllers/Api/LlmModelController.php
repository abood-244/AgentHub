<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LlmModel;
use App\Models\EmbeddingModel;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LlmModelController extends Controller
{
    /**
     * List all LLM models (optionally only enabled).
     */
    public function index(Request $request): JsonResponse
    {
        $query = LlmModel::query();

        if ($request->has('enabled') && filter_var($request->enabled, FILTER_VALIDATE_BOOLEAN)) {
            $query->enabled();
        }

        $models = $query->orderBy('is_recommended', 'desc')
            ->orderBy('name')
            ->get();

        return response()->json(['data' => $models]);
    }

    /**
     * List all embedding models (optionally only enabled).
     */
    public function embeddingModels(Request $request): JsonResponse
    {
        $query = EmbeddingModel::query();

        if ($request->has('enabled') && filter_var($request->enabled, FILTER_VALIDATE_BOOLEAN)) {
            $query->enabled();
        }

        $models = $query->orderBy('name')->get();

        return response()->json(['data' => $models]);
    }
}
