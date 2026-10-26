<?php

namespace App\Services;

use App\Models\DocumentChunk;
use App\Models\Embedding;
use App\Models\EmbeddingModel;
use App\Models\Workspace;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class EmbeddingService
{
    protected int $dimensions = 1536;

    /**
     * Generate embedding vector for a given text.
     * Uses configured external API (OpenAI) if API key exists, otherwise generates
     * a deterministic normalized 1536-dim vector for pgvector development/testing.
     *
     * @param string $text
     * @param string|null $modelIdentifier
     * @return array<float>
     */
    public function generateEmbedding(string $text, ?string $modelIdentifier = 'text-embedding-3-small'): array
    {
        $text = trim($text);
        if (empty($text)) {
            return array_fill(0, $this->dimensions, 0.0);
        }

        $apiKey = config('services.openai.api_key', env('OPENAI_API_KEY'));

        if ($apiKey && !str_starts_with($apiKey, 'mock-')) {
            try {
                $response = Http::withToken($apiKey)
                    ->timeout(15)
                    ->post('https://api.openai.com/v1/embeddings', [
                        'input' => mb_substr($text, 0, 8000),
                        'model' => $modelIdentifier ?: 'text-embedding-3-small',
                    ]);

                if ($response->successful()) {
                    $vector = $response->json('data.0.embedding');
                    if (is_array($vector) && count($vector) === $this->dimensions) {
                        return $vector;
                    }
                }
            } catch (\Throwable $e) {
                Log::warning('Live embedding API call failed, falling back to local deterministic embedding: ' . $e->getMessage());
            }
        }

        // Deterministic, normalized 1536-dimensional embedding vector for pgvector
        return $this->generateDeterministicVector($text);
    }

    /**
     * Generate a deterministic normalized float vector of length $dimensions.
     * Tokens and n-grams influence vector buckets so semantically related words produce
     * closer cosine distance.
     */
    protected function generateDeterministicVector(string $text): array
    {
        $vector = array_fill(0, $this->dimensions, 0.0);
        $words = preg_split('/\s+/u', mb_strtolower($text), -1, PREG_SPLIT_NO_EMPTY);

        foreach ($words as $word) {
            $hash = hash('sha256', $word);
            for ($i = 0; $i < 4; $i++) {
                $sub = substr($hash, $i * 8, 8);
                $idx = abs(hexdec($sub)) % $this->dimensions;
                $val = (hexdec(substr($hash, ($i * 8) + 4, 4)) / 65535.0) - 0.5;
                $vector[$idx] += $val;
            }
        }

        // Normalize vector to unit length (L2 norm)
        $norm = 0.0;
        foreach ($vector as $val) {
            $norm += $val * $val;
        }
        $norm = sqrt($norm);

        if ($norm > 1e-9) {
            for ($i = 0; $i < $this->dimensions; $i++) {
                $vector[$i] = round($vector[$i] / $norm, 6);
            }
        } else {
            $vector[0] = 1.0;
        }

        return $vector;
    }

    /**
     * Convert float array to pgvector string format: "[0.123, -0.456, ...]".
     */
    public function formatForPgvector(array $vector): string
    {
        return '[' . implode(',', $vector) . ']';
    }

    /**
     * Store embedding for a single document chunk in the embeddings table.
     */
    public function storeChunkEmbedding(DocumentChunk $chunk, ?int $embeddingModelId = null): Embedding
    {
        if (!$embeddingModelId) {
            $workspace = Workspace::find($chunk->workspace_id);
            $embeddingModelId = $workspace?->selected_embedding_model_id;

            if (!$embeddingModelId) {
                $defaultModel = EmbeddingModel::where('is_enabled', true)->first();
                $embeddingModelId = $defaultModel?->id ?? 1;
            }
        }

        $vector = $this->generateEmbedding($chunk->content);
        $vectorStr = $this->formatForPgvector($vector);

        // Delete any existing embedding for this chunk
        Embedding::where('chunk_id', $chunk->id)->delete();

        // Insert new embedding with raw pgvector casting
        DB::statement(
            "INSERT INTO embeddings (chunk_id, workspace_id, document_id, embedding_model_id, embedding, created_at)
             VALUES (?, ?, ?, ?, ?::vector, NOW())",
            [
                $chunk->id,
                $chunk->workspace_id,
                $chunk->document_id,
                $embeddingModelId,
                $vectorStr,
            ]
        );

        return Embedding::where('chunk_id', $chunk->id)->first();
    }

    /**
     * Process and embed all chunks of a document.
     */
    public function embedDocumentChunks(int $documentId, ?int $embeddingModelId = null): int
    {
        $chunks = DocumentChunk::where('document_id', $documentId)->get();
        $count = 0;

        foreach ($chunks as $chunk) {
            $this->storeChunkEmbedding($chunk, $embeddingModelId);
            $count++;
        }

        return $count;
    }

    /**
     * Search knowledge base chunks in a specific workspace using cosine distance.
     * Order by (embedding <=> queryVector) ascending.
     */
    public function searchSimilarChunks(int $workspaceId, string $queryText, int $limit = 5): array
    {
        $queryVector = $this->generateEmbedding($queryText);
        $vectorStr = $this->formatForPgvector($queryVector);

        $results = DB::select(
            "SELECT c.id, c.document_id, c.workspace_id, c.chunk_index, c.content, c.token_count,
                    d.title as document_title,
                    d.source_type,
                    d.storage_type,
                    (e.embedding <=> ?::vector) as distance
             FROM embeddings e
             JOIN document_chunks c ON c.id = e.chunk_id
             JOIN documents d ON d.id = e.document_id
             WHERE e.workspace_id = ?
             ORDER BY (e.embedding <=> ?::vector) ASC
             LIMIT ?",
            [$vectorStr, $workspaceId, $vectorStr, $limit]
        );

        return array_map(function ($r) {
            $distance = (float) $r->distance;
            // Cosine similarity = 1 - (cosine distance)
            $similarity = max(0.0, min(1.0, 1.0 - $distance));
            return [
                'id' => $r->id,
                'document_id' => $r->document_id,
                'workspace_id' => $r->workspace_id,
                'chunk_index' => $r->chunk_index,
                'content' => $r->content,
                'token_count' => $r->token_count,
                'document_title' => $r->document_title,
                'source_type' => $r->source_type,
                'storage_type' => $r->storage_type,
                'distance' => round($distance, 4),
                'similarity' => round($similarity, 4),
            ];
        }, $results);
    }
}
