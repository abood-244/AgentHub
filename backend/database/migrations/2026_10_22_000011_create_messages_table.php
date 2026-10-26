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
        Schema::create('messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('conversation_id')->constrained('conversations')->cascadeOnDelete();
            $table->string('sender_type', 20); // end_user, ai, staff, system
            $table->unsignedBigInteger('sender_id')->nullable(); // user_id for staff, null for ai/system
            $table->text('content');
            $table->json('metadata')->nullable();
            $table->json('sources_used')->nullable(); // references to document chunks used
            $table->decimal('confidence_score', 4, 3)->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['conversation_id', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('messages');
    }
};
