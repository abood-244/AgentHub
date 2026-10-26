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
        Schema::create('agent_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained('workspaces')->cascadeOnDelete();
            $table->string('name');
            $table->text('description')->nullable();
            $table->text('system_instructions')->nullable();
            $table->foreignId('selected_llm_model_id')->nullable()
                ->constrained('llm_models')->nullOnDelete();
            $table->decimal('temperature', 3, 2)->default(0.70);
            $table->integer('max_tokens')->default(2048);
            $table->boolean('use_knowledge_base')->default(true);

            // Support Case auto-creation settings
            $table->boolean('support_case_auto_create')->default(false);
            $table->text('support_case_conditions')->nullable();

            // Staff auto-assignment settings
            $table->boolean('staff_auto_assign')->default(false);
            $table->json('auto_assign_staff_ids')->nullable();

            $table->string('status', 20)->default('active'); // active, training, inactive

            $table->timestamps();

            // Only one agent profile per workspace
            $table->unique('workspace_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('agent_profiles');
    }
};
