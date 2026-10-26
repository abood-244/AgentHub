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
        Schema::create('support_cases', function (Blueprint $table) {
            $table->id();
            $table->string('case_number', 20)->unique(); // SC-0001
            $table->foreignId('workspace_id')->constrained('workspaces')->cascadeOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->foreignId('end_user_id')->nullable()
                ->constrained('end_users')->nullOnDelete();
            $table->foreignId('conversation_id')->nullable()
                ->constrained('conversations')->nullOnDelete();
            $table->string('source', 20)->default('manual'); // manual, automatic
            $table->string('category')->nullable();
            $table->foreignId('assigned_staff_id')->nullable()
                ->constrained('users')->nullOnDelete();
            $table->text('summary')->nullable();
            $table->text('required_action')->nullable();
            $table->string('status', 20)->default('new'); // new, in_progress, closed
            $table->string('priority', 20)->default('medium'); // low, medium, high, urgent
            $table->foreignId('created_by_user_id')->nullable()
                ->constrained('users')->nullOnDelete();
            $table->timestamp('closed_at')->nullable();
            $table->timestamps();

            $table->index(['workspace_id', 'status']);
            $table->index(['workspace_id', 'assigned_staff_id']);
            $table->index(['workspace_id', 'priority']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('support_cases');
    }
};
