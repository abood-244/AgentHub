<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained('workspaces')->cascadeOnDelete();
            $table->string('title');
            $table->string('title_en')->nullable();
            $table->string('source_type', 20); // csv, markdown
            $table->string('storage_type', 20); // vector, normal
            $table->longText('original_content')->nullable();
            $table->string('file_path')->nullable();
            $table->bigInteger('file_size')->nullable();
            $table->integer('records_count')->nullable();
            $table->integer('columns_count')->nullable();
            $table->integer('chunks_count')->default(0);
            $table->integer('total_tokens')->default(0);
            $table->string('processing_status', 20)->default('pending');
            // pending, processing, completed, failed, partial
            $table->text('error_message')->nullable();
            $table->timestamp('last_indexed_at')->nullable();
            $table->timestamps();

            $table->index(['workspace_id', 'processing_status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('documents');
    }
};
