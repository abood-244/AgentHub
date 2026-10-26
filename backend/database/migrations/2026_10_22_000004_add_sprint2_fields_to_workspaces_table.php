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
        Schema::table('workspaces', function (Blueprint $table) {
            $table->string('name_en')->nullable()->after('name');
            $table->text('description_en')->nullable()->after('description');
            $table->string('slug')->nullable()->after('name_en');
            $table->string('category', 50)->nullable()->after('status');
            $table->string('default_language', 5)->default('ar')->after('category');
            $table->string('icon_name')->nullable()->after('default_language');
            $table->string('theme_color', 20)->nullable()->after('icon_name');
            $table->foreignId('selected_embedding_model_id')->nullable()->after('theme_color')
                ->constrained('embedding_models')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('workspaces', function (Blueprint $table) {
            $table->dropForeign(['selected_embedding_model_id']);
            $table->dropColumn([
                'name_en', 'description_en', 'slug', 'category',
                'default_language', 'icon_name', 'theme_color',
                'selected_embedding_model_id',
            ]);
        });
    }
};
