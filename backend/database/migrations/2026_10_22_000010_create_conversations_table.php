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
        Schema::create('conversations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained('workspaces')->cascadeOnDelete();
            $table->foreignId('end_user_id')->constrained('end_users')->cascadeOnDelete();
            $table->string('channel_type', 50)->nullable();
            $table->string('handler', 20)->default('ai'); // ai, human, mixed
            $table->foreignId('assigned_staff_id')->nullable()
                ->constrained('users')->nullOnDelete();
            $table->string('status', 20)->default('open'); // open, waiting, resolved, closed
            $table->boolean('is_test')->default(false);
            $table->timestamp('started_at')->nullable();
            $table->timestamp('last_message_at')->nullable();
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();

            $table->index(['workspace_id', 'status']);
            $table->index(['workspace_id', 'handler']);
            $table->index(['workspace_id', 'is_test']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('conversations');
    }
};
