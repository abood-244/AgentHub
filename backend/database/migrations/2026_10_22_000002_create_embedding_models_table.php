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
        Schema::create('embedding_models', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('provider'); // OpenAI, Google, Cohere
            $table->string('model_identifier'); // e.g. text-embedding-3-small
            $table->integer('dimensions')->default(1536);
            $table->boolean('is_enabled')->default(false);
            $table->text('description')->nullable();
            $table->text('description_en')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('embedding_models');
    }
};
