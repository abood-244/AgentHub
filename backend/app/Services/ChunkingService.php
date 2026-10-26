<?php

namespace App\Services;

/**
 * Chunking Service — splits text content into manageable chunks for embedding.
 */
class ChunkingService
{
    /**
     * Default chunk size in characters.
     */
    protected int $chunkSize = 1000;

    /**
     * Overlap between chunks in characters.
     */
    protected int $overlapSize = 200;

    /**
     * Split text content into chunks.
     *
     * @param string $content The text to split
     * @param int|null $chunkSize Optional custom chunk size
     * @param int|null $overlapSize Optional custom overlap size
     * @return array Array of chunk strings
     */
    public function chunkText(string $content, ?int $chunkSize = null, ?int $overlapSize = null): array
    {
        $chunkSize = $chunkSize ?? $this->chunkSize;
        $overlapSize = $overlapSize ?? $this->overlapSize;

        $content = trim($content);
        if (empty($content)) {
            return [];
        }

        // If content is shorter than chunk size, return as single chunk
        if (mb_strlen($content) <= $chunkSize) {
            return [$content];
        }

        $chunks = [];
        $paragraphs = preg_split('/\n\s*\n/', $content);
        $currentChunk = '';

        foreach ($paragraphs as $paragraph) {
            $paragraph = trim($paragraph);
            if (empty($paragraph)) continue;

            // If adding this paragraph exceeds chunk size, save current and start new
            if (mb_strlen($currentChunk) + mb_strlen($paragraph) + 2 > $chunkSize && !empty($currentChunk)) {
                $chunks[] = trim($currentChunk);

                // Start new chunk with overlap from previous
                if ($overlapSize > 0 && mb_strlen($currentChunk) > $overlapSize) {
                    $currentChunk = mb_substr($currentChunk, -$overlapSize) . "\n\n" . $paragraph;
                } else {
                    $currentChunk = $paragraph;
                }
            } else {
                $currentChunk .= (empty($currentChunk) ? '' : "\n\n") . $paragraph;
            }

            // If a single paragraph is too large, split it by sentences
            if (mb_strlen($currentChunk) > $chunkSize * 1.5) {
                $sentences = $this->splitIntoSentences($currentChunk);
                $currentChunk = '';
                foreach ($sentences as $sentence) {
                    if (mb_strlen($currentChunk) + mb_strlen($sentence) + 1 > $chunkSize && !empty($currentChunk)) {
                        $chunks[] = trim($currentChunk);
                        $currentChunk = $sentence;
                    } else {
                        $currentChunk .= (empty($currentChunk) ? '' : ' ') . $sentence;
                    }
                }
            }
        }

        // Add remaining chunk
        if (!empty(trim($currentChunk))) {
            $chunks[] = trim($currentChunk);
        }

        return $chunks;
    }

    /**
     * Split CSV content into chunks (by rows).
     */
    public function chunkCsv(array $rows, array $headers, int $rowsPerChunk = 20): array
    {
        $chunks = [];
        $headerLine = implode(' | ', $headers);

        foreach (array_chunk($rows, $rowsPerChunk) as $rowGroup) {
            $chunkContent = $headerLine . "\n";
            foreach ($rowGroup as $row) {
                $chunkContent .= implode(' | ', $row) . "\n";
            }
            $chunks[] = trim($chunkContent);
        }

        return $chunks;
    }

    /**
     * Estimate token count for a text string (rough approximation).
     * ~4 characters per token for English, ~2-3 for Arabic.
     */
    public function estimateTokenCount(string $text): int
    {
        // Simple heuristic: count words and multiply
        $wordCount = str_word_count($text);
        $charCount = mb_strlen($text);

        // Use a blend: roughly 0.75 tokens per word or 0.25 tokens per char
        return (int) max($wordCount * 1.3, $charCount / 4);
    }

    /**
     * Split text into sentences.
     */
    protected function splitIntoSentences(string $text): array
    {
        // Split on sentence-ending punctuation (Arabic and English)
        $sentences = preg_split('/(?<=[.!?؟،\n])\s+/', $text, -1, PREG_SPLIT_NO_EMPTY);
        return $sentences ?: [$text];
    }
}
