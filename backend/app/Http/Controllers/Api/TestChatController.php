<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AgentProfile;
use App\Models\Conversation;
use App\Models\DocumentChunk;
use App\Models\EndUser;
use App\Models\Message;
use App\Models\Workspace;
use App\Services\EmbeddingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TestChatController extends Controller
{
    public function __construct(
        protected EmbeddingService $embeddingService
    ) {}
    /**
     * Handle a test chat message — full RAG pipeline.
     *
     * 1. Receive question
     * 2. Convert question to embedding (via Embedding API)
     * 3. Search pgvector for similar chunks
     * 4. Build prompt with system instructions + context
     * 5. Send to LLM API
     * 6. Return answer with sources
     */
    public function chat(Request $request, int $workspaceId): JsonResponse
    {
        $startTime = microtime(true);

        $validated = $request->validate([
            'question' => 'required|string|max:5000',
        ]);

        $workspace = Workspace::findOrFail($workspaceId);
        $agentProfile = $workspace->agentProfile()->with('llmModel')->first();

        // Check prerequisites
        if (!$agentProfile) {
            return response()->json([
                'error' => 'no_agent_profile',
                'message' => 'يجب إنشاء Agent Profile أولاً قبل الاختبار.',
                'message_en' => 'Please create an Agent Profile before testing.',
            ], 422);
        }

        if (!$agentProfile->llmModel) {
            return response()->json([
                'error' => 'no_llm_model',
                'message' => 'يجب اختيار نموذج LLM في Agent Profile.',
                'message_en' => 'Please select an LLM model in Agent Profile.',
            ], 422);
        }

        $question = $validated['question'];
        $retrievedChunks = [];
        $sourcesUsed = [];

        // Step 1: If knowledge base is enabled, search for relevant chunks
        if ($agentProfile->use_knowledge_base) {
            $retrievedChunks = $this->searchKnowledgeBase($workspaceId, $question, $workspace);
            $sourcesUsed = collect($retrievedChunks)->map(fn($c) => [
                'chunk_id' => $c->id,
                'document_id' => $c->document_id,
                'content_preview' => mb_substr($c->content, 0, 150) . '...',
            ])->toArray();
        }

        // Step 2: Build the prompt
        $systemPrompt = $agentProfile->system_instructions ?? 'أنت مساعد ذكي. أجب عن الأسئلة بدقة ووضوح.';

        $contextText = '';
        if (!empty($retrievedChunks)) {
            $contextText = "\n\n--- المعلومات المسترجعة من قاعدة المعرفة ---\n";
            foreach ($retrievedChunks as $i => $chunk) {
                $contextText .= "\n[مصدر " . ($i + 1) . "]: " . $chunk->content . "\n";
            }
            $contextText .= "\n--- نهاية المعلومات المسترجعة ---\n";
            $contextText .= "\nاستخدم المعلومات المسترجعة أعلاه للإجابة عن سؤال المستخدم. إذا لم تجد معلومات كافية، وضّح ذلك.";
        }

        $fullPrompt = $systemPrompt . $contextText;

        // Step 3: Call LLM API
        try {
            $answer = $this->callLlmApi(
                $agentProfile->llmModel,
                $fullPrompt,
                $question,
                $agentProfile->temperature,
                $agentProfile->max_tokens
            );
        } catch (\Exception $e) {
            Log::error('Test chat LLM error: ' . $e->getMessage());

            // Fallback: return a mock response for development
            $answer = $this->getMockResponse($question, $retrievedChunks);
        }

        $processingTimeMs = round((microtime(true) - $startTime) * 1000);
        $confidenceScore = !empty($retrievedChunks) ? 0.85 : 0.5;

        // Save test conversation (marked as test)
        $this->saveTestConversation($workspaceId, $question, $answer, $sourcesUsed, $confidenceScore);

        return response()->json([
            'answer' => $answer,
            'sources_used' => $sourcesUsed,
            'confidence_score' => $confidenceScore,
            'processing_time_ms' => $processingTimeMs,
            'chunks_retrieved' => count($retrievedChunks),
        ]);
    }

    /**
     * Search knowledge base using vector similarity or text search.
     */
    private function searchKnowledgeBase(int $workspaceId, string $question, Workspace $workspace): array
    {
        // Try vector search first if embeddings exist
        $hasEmbeddings = DB::table('embeddings')
            ->where('workspace_id', $workspaceId)
            ->exists();

        if ($hasEmbeddings) {
            try {
                $similar = $this->embeddingService->searchSimilarChunks($workspaceId, $question, 5);
                if (!empty($similar)) {
                    return $similar;
                }
            } catch (\Throwable $e) {
                Log::warning('Vector search error: ' . $e->getMessage());
            }
        }

        // Fallback: text-based search
        return $this->textSearchChunks($workspaceId, $question);
    }

    /**
     * Text-based chunk search (fallback when no embeddings).
     */
    private function textSearchChunks(int $workspaceId, string $question, int $limit = 5): array
    {
        // Extract keywords from question
        $words = array_filter(explode(' ', $question), fn($w) => mb_strlen($w) > 2);

        if (empty($words)) {
            return DocumentChunk::where('workspace_id', $workspaceId)
                ->limit($limit)
                ->get()
                ->toArray();
        }

        $query = DocumentChunk::where('workspace_id', $workspaceId);

        // Search for any matching keyword
        $query->where(function ($q) use ($words) {
            foreach ($words as $word) {
                $q->orWhere('content', 'ILIKE', '%' . $word . '%');
            }
        });

        return $query->limit($limit)->get()->all();
    }

    /**
     * Call the LLM API.
     */
    private function callLlmApi($llmModel, string $systemPrompt, string $userMessage, float $temperature, int $maxTokens): string
    {
        $provider = strtolower($llmModel->provider);

        if ($provider === 'openai') {
            return $this->callOpenAi($llmModel->model_identifier, $systemPrompt, $userMessage, $temperature, $maxTokens);
        }

        if ($provider === 'anthropic') {
            return $this->callAnthropic($llmModel->model_identifier, $systemPrompt, $userMessage, $temperature, $maxTokens);
        }

        if ($provider === 'google') {
            return $this->callGemini($llmModel->model_identifier, $systemPrompt, $userMessage, $temperature, $maxTokens);
        }

        throw new \Exception("Unsupported LLM provider: {$llmModel->provider}");
    }

    private function callOpenAi(string $model, string $system, string $user, float $temp, int $maxTokens): string
    {
        $apiKey = config('services.openai.api_key', env('OPENAI_API_KEY'));
        if (!$apiKey) throw new \Exception('OpenAI API key not configured.');

        $response = Http::withoutVerifying()
            ->timeout(25)
            ->withHeaders([
                'Authorization' => 'Bearer ' . $apiKey,
            ])->post('https://api.openai.com/v1/chat/completions', [
                'model' => $model,
                'messages' => [
                    ['role' => 'system', 'content' => $system],
                    ['role' => 'user', 'content' => $user],
                ],
                'temperature' => $temp,
                'max_tokens' => $maxTokens,
            ]);

        if ($response->failed()) throw new \Exception('OpenAI API error: ' . $response->body());
        return $response->json('choices.0.message.content', '');
    }

    private function callAnthropic(string $model, string $system, string $user, float $temp, int $maxTokens): string
    {
        $apiKey = config('services.anthropic.api_key', env('ANTHROPIC_API_KEY'));
        if (!$apiKey) throw new \Exception('Anthropic API key not configured.');

        $response = Http::withoutVerifying()
            ->timeout(25)
            ->withHeaders([
                'x-api-key' => $apiKey,
                'anthropic-version' => '2023-06-01',
            ])->post('https://api.anthropic.com/v1/messages', [
                'model' => $model,
                'system' => $system,
                'messages' => [['role' => 'user', 'content' => $user]],
                'temperature' => $temp,
                'max_tokens' => $maxTokens,
            ]);

        if ($response->failed()) throw new \Exception('Anthropic API error: ' . $response->body());
        return $response->json('content.0.text', '');
    }

    private function callGemini(string $model, string $system, string $user, float $temp, int $maxTokens): string
    {
        $apiKey = config('services.google.api_key') ?: env('GOOGLE_API_KEY') ?: env('GEMINI_API_KEY');
        if (!$apiKey) throw new \Exception('Google API key not configured.');

        // Automatically map older/deprecated identifiers to active, supported Gemini 3.5 Flash
        $effectiveModel = match ($model) {
            'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-2.5-flash' => 'gemini-3.5-flash',
            default => $model,
        };

        $payload = [
            'contents' => [['parts' => [['text' => $user]]]],
            'generationConfig' => [
                'temperature' => $temp,
                'maxOutputTokens' => $maxTokens,
            ],
        ];

        if (!empty($system)) {
            $payload['systemInstruction'] = ['parts' => [['text' => $system]]];
        }

        $response = Http::withoutVerifying()
            ->timeout(20)
            ->post("https://generativelanguage.googleapis.com/v1beta/models/{$effectiveModel}:generateContent?key={$apiKey}", $payload);

        if ($response->failed()) throw new \Exception('Google API error: ' . $response->body());

        $parts = $response->json('candidates.0.content.parts', []);
        $text = '';
        foreach ($parts as $part) {
            if (!empty($part['text'])) {
                $text .= $part['text'];
            }
        }

        return $text ?: ($response->json('candidates.0.content.parts.0.text', '') ?? '');
    }

    /**
     * Mock response for development (when no API key is configured).
     */
    private function getMockResponse(string $question, array $chunks): string
    {
        if (!empty($chunks)) {
            $context = collect($chunks)->pluck('content')->implode("\n\n");
            return "بناءً على المعلومات المتوفرة في قاعدة المعرفة:\n\n" .
                   mb_substr($context, 0, 500) .
                   "\n\n---\n⚠️ هذه إجابة تجريبية (Mock). لتفعيل الإجابات الحقيقية، قم بإضافة API Key للنموذج المختار.";
        }

        return "تم استلام سؤالك: \"{$question}\"\n\n" .
               "لا توجد معلومات كافية في قاعدة المعرفة للإجابة عن هذا السؤال.\n\n" .
               "---\n⚠️ هذه إجابة تجريبية (Mock). لتفعيل الإجابات الحقيقية، قم بإضافة API Key وقاعدة معرفة.";
    }

    /**
     * Save test conversation (not visible in real conversations).
     */
    private function saveTestConversation(int $workspaceId, string $question, string $answer, array $sources, float $confidence): void
    {
        try {
            // Create or get a test end user
            $testUser = EndUser::firstOrCreate(
                ['workspace_id' => $workspaceId, 'external_id' => '__test_user__'],
                ['name' => 'مستخدم اختباري', 'channel_type' => 'test', 'first_seen_at' => now()]
            );

            $conversation = Conversation::create([
                'workspace_id' => $workspaceId,
                'end_user_id' => $testUser->id,
                'channel_type' => 'test',
                'handler' => 'ai',
                'status' => 'resolved',
                'is_test' => true,
                'started_at' => now(),
                'last_message_at' => now(),
            ]);

            Message::create([
                'conversation_id' => $conversation->id,
                'sender_type' => 'end_user',
                'content' => $question,
                'created_at' => now(),
            ]);

            Message::create([
                'conversation_id' => $conversation->id,
                'sender_type' => 'ai',
                'content' => $answer,
                'sources_used' => $sources,
                'confidence_score' => $confidence,
                'created_at' => now(),
            ]);
        } catch (\Exception $e) {
            Log::warning('Failed to save test conversation: ' . $e->getMessage());
        }
    }
}
