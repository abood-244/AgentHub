<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $driver = DB::getDriverName();

        // Enable pgvector extension on PostgreSQL
        if ($driver === 'pgsql') {
            DB::statement('CREATE EXTENSION IF NOT EXISTS vector');
        }

        Schema::create('embeddings', function (Blueprint $table) use ($driver) {
            $table->id();
            $table->foreignId('chunk_id')->constrained('document_chunks')->cascadeOnDelete();
            $table->foreignId('workspace_id')->constrained('workspaces')->cascadeOnDelete();
            $table->foreignId('document_id')->constrained('documents')->cascadeOnDelete();
            $table->foreignId('embedding_model_id')->constrained('embedding_models')->cascadeOnDelete();
            if ($driver !== 'pgsql') {
                $table->text('embedding')->nullable();
            }
            $table->timestamp('created_at')->useCurrent();
        });

        if ($driver === 'pgsql') {
            // Add vector column using pgvector (1536 dimensions for OpenAI text-embedding-3-small)
            DB::statement('ALTER TABLE embeddings ADD COLUMN embedding vector(1536)');

            // Create index for similarity search (HNSW works with empty tables)
            DB::statement('CREATE INDEX embeddings_embedding_idx ON embeddings USING hnsw (embedding vector_cosine_ops)');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('embeddings');
    }
};
