<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Document;
use App\Models\DocumentChunk;
use App\Models\Workspace;
use App\Services\ChunkingService;
use App\Services\EmbeddingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class DocumentController extends Controller
{
    public function __construct(
        protected ChunkingService $chunkingService,
        protected EmbeddingService $embeddingService
    ) {}

    /**
     * List documents for a workspace.
     */
    public function index(int $workspaceId): JsonResponse
    {
        $documents = Document::where('workspace_id', $workspaceId)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json(['data' => $documents]);
    }

    /**
     * Store a new document (Markdown or CSV).
     */
    public function store(Request $request, int $workspaceId): JsonResponse
    {
        $workspace = Workspace::findOrFail($workspaceId);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'title_en' => 'nullable|string|max:255',
            'source_type' => 'required|string|in:csv,markdown',
            'storage_type' => 'required|string|in:vector,normal',
            'content' => 'required_if:source_type,markdown|nullable|string',
            'csv_file' => 'required_if:source_type,csv|nullable|file|mimes:csv,txt|max:10240',
        ]);

        return DB::transaction(function () use ($validated, $workspaceId, $request) {
            $content = '';
            $filePath = null;
            $fileSize = null;
            $recordsCount = null;
            $columnsCount = null;

            if ($validated['source_type'] === 'csv' && $request->hasFile('csv_file')) {
                $file = $request->file('csv_file');
                $filePath = $file->store("workspaces/{$workspaceId}/documents", 'local');
                $fileSize = $file->getSize();
                $csvContent = file_get_contents($file->getRealPath());
                $content = $csvContent;

                // Parse CSV for stats
                $rows = array_map('str_getcsv', explode("\n", trim($csvContent)));
                $columnsCount = count($rows[0] ?? []);
                $recordsCount = max(0, count($rows) - 1); // Exclude header
            } else {
                $content = $validated['content'] ?? '';
            }

            // Create the document
            $document = Document::create([
                'workspace_id' => $workspaceId,
                'title' => $validated['title'],
                'title_en' => $validated['title_en'] ?? null,
                'source_type' => $validated['source_type'],
                'storage_type' => $validated['storage_type'],
                'original_content' => $content,
                'file_path' => $filePath,
                'file_size' => $fileSize,
                'records_count' => $recordsCount,
                'columns_count' => $columnsCount,
                'processing_status' => 'processing',
            ]);

            // Chunk the content
            $chunks = [];
            if ($validated['source_type'] === 'csv' && !empty($content)) {
                $rows = array_map('str_getcsv', explode("\n", trim($content)));
                $headers = array_shift($rows);
                $chunks = $this->chunkingService->chunkCsv($rows, $headers);
            } else {
                $chunks = $this->chunkingService->chunkText($content);
            }

            // Save chunks
            $totalTokens = 0;
            foreach ($chunks as $index => $chunkContent) {
                $tokenCount = $this->chunkingService->estimateTokenCount($chunkContent);
                $totalTokens += $tokenCount;

                DocumentChunk::create([
                    'document_id' => $document->id,
                    'workspace_id' => $workspaceId,
                    'chunk_index' => $index,
                    'content' => $chunkContent,
                    'token_count' => $tokenCount,
                ]);
            }

            // Update document stats and process vector embeddings if requested
            $isVector = $validated['storage_type'] === 'vector';
            $processingStatus = 'completed';

            if ($isVector && count($chunks) > 0) {
                try {
                    $this->embeddingService->embedDocumentChunks($document->id);
                    $processingStatus = 'completed';
                } catch (\Throwable $e) {
                    Log::error("Failed to generate embeddings for document {$document->id}: " . $e->getMessage());
                    $processingStatus = 'failed';
                }
            }

            $document->update([
                'chunks_count' => count($chunks),
                'total_tokens' => $totalTokens,
                'processing_status' => $processingStatus,
                'last_indexed_at' => $processingStatus === 'completed' ? now() : null,
            ]);

            return response()->json([
                'data' => $document->fresh(),
                'chunks_count' => count($chunks),
            ], 201);
        });
    }

    /**
     * Show a specific document with its chunks.
     */
    public function show(int $workspaceId, int $documentId): JsonResponse
    {
        $document = Document::where('workspace_id', $workspaceId)
            ->findOrFail($documentId);

        return response()->json(['data' => $document]);
    }

    /**
     * Get chunks for a document.
     */
    public function chunks(int $workspaceId, int $documentId): JsonResponse
    {
        $document = Document::where('workspace_id', $workspaceId)->findOrFail($documentId);

        $chunks = $document->chunks()
            ->orderBy('chunk_index')
            ->get();

        return response()->json(['data' => $chunks]);
    }

    /**
     * Update a document (Markdown content only).
     */
    public function update(Request $request, int $workspaceId, int $documentId): JsonResponse
    {
        $document = Document::where('workspace_id', $workspaceId)->findOrFail($documentId);

        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'title_en' => 'nullable|string|max:255',
            'content' => 'nullable|string',
        ]);

        return DB::transaction(function () use ($document, $validated, $workspaceId) {
            // If content changed, re-chunk
            if (isset($validated['content']) && $document->source_type === 'markdown') {
                // Delete old chunks and embeddings
                $document->chunks()->delete();
                $document->embeddings()->delete();

                $chunks = $this->chunkingService->chunkText($validated['content']);
                $totalTokens = 0;

                foreach ($chunks as $index => $chunkContent) {
                    $tokenCount = $this->chunkingService->estimateTokenCount($chunkContent);
                    $totalTokens += $tokenCount;

                    DocumentChunk::create([
                        'document_id' => $document->id,
                        'workspace_id' => $workspaceId,
                        'chunk_index' => $index,
                        'content' => $chunkContent,
                        'token_count' => $tokenCount,
                    ]);
                }

                $validated['original_content'] = $validated['content'];
                $validated['chunks_count'] = count($chunks);
                $validated['total_tokens'] = $totalTokens;

                if ($document->storage_type === 'vector' && count($chunks) > 0) {
                    try {
                        $this->embeddingService->embedDocumentChunks($document->id);
                        $validated['processing_status'] = 'completed';
                        $validated['last_indexed_at'] = now();
                    } catch (\Throwable $e) {
                        Log::error("Failed to re-embed document {$document->id}: " . $e->getMessage());
                        $validated['processing_status'] = 'failed';
                    }
                } else {
                    $validated['processing_status'] = 'completed';
                }
                unset($validated['content']);
            }

            $document->update($validated);

            return response()->json(['data' => $document->fresh()]);
        });
    }

    /**
     * Preview CSV file columns, sample rows, and stats before upload.
     */
    public function previewCsv(Request $request, int $workspaceId): JsonResponse
    {
        $request->validate([
            'csv_file' => 'required|file|mimes:csv,txt|max:10240',
        ]);

        $file = $request->file('csv_file');
        $csvContent = file_get_contents($file->getRealPath());

        if (empty(trim($csvContent))) {
            return response()->json(['message' => 'ملف الـ CSV فارغ أو غير صالح.'], 422);
        }

        $lines = explode("\n", trim($csvContent));
        $rows = array_map('str_getcsv', $lines);
        $headers = array_shift($rows) ?: [];

        // Clean empty headers
        $cleanHeaders = array_map(fn($h, $i) => trim($h) ?: ("Column " . ($i + 1)), $headers, array_keys($headers));

        $sampleRows = array_slice($rows, 0, 5);
        $totalRows = count($rows);

        return response()->json([
            'data' => [
                'columns' => $cleanHeaders,
                'columns_count' => count($cleanHeaders),
                'total_records' => $totalRows,
                'sample_rows' => $sampleRows,
                'file_size' => $file->getSize(),
                'file_name' => $file->getClientOriginalName(),
            ],
        ]);
    }

    /**
     * Delete a document and its related data.
     */
    public function destroy(int $workspaceId, int $documentId): JsonResponse
    {
        $document = Document::where('workspace_id', $workspaceId)->findOrFail($documentId);

        DB::transaction(function () use ($document) {
            // Cascade delete handles chunks and embeddings via FK
            $document->delete();
        });

        return response()->json(['message' => 'Document deleted successfully.']);
    }
}
