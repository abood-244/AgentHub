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
        Schema::create('support_case_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('support_case_id')->constrained('support_cases')->cascadeOnDelete();
            $table->string('action', 30); // created, assigned, status_changed, note_added, escalated, closed
            $table->unsignedBigInteger('performed_by_user_id')->nullable();
            $table->json('details')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index('support_case_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('support_case_logs');
    }
};
