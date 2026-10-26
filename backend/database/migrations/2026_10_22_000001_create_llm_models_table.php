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
        Schema::create('llm_models', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('provider'); // OpenAI, Anthropic, Google, Meta, DeepSeek
            $table->string('model_identifier'); // e.g. gpt-4o, claude-3.5-sonnet
            $table->integer('context_window')->default(4096);
            $table->boolean('is_enabled')->default(false);
            $table->text('description')->nullable();
            $table->text('description_en')->nullable();
            $table->string('badge_color', 20)->default('#6366f1');
            $table->boolean('is_recommended')->default(false);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('llm_models');
    }
};
