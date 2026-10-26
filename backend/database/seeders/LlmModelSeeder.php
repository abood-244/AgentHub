<?php

namespace Database\Seeders;

use App\Models\LlmModel;
use Illuminate\Database\Seeder;

class LlmModelSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $models = [
            [
                'name' => 'GPT-4o',
                'provider' => 'OpenAI',
                'model_identifier' => 'gpt-4o',
                'context_window' => 128000,
                'is_enabled' => true,
                'description' => 'نموذج OpenAI الأحدث والأكثر قدرة، يدعم النصوص والصور',
                'description_en' => 'OpenAI\'s latest and most capable model, supports text and vision',
                'badge_color' => '#10a37f',
                'is_recommended' => true,
            ],
            [
                'name' => 'GPT-4o Mini',
                'provider' => 'OpenAI',
                'model_identifier' => 'gpt-4o-mini',
                'context_window' => 128000,
                'is_enabled' => true,
                'description' => 'نموذج OpenAI الاقتصادي مع أداء ممتاز',
                'description_en' => 'OpenAI\'s affordable model with excellent performance',
                'badge_color' => '#10a37f',
                'is_recommended' => false,
            ],
            [
                'name' => 'Claude 3.5 Sonnet',
                'provider' => 'Anthropic',
                'model_identifier' => 'claude-3-5-sonnet-20241022',
                'context_window' => 200000,
                'is_enabled' => true,
                'description' => 'نموذج Anthropic المتوازن بين الأداء والتكلفة',
                'description_en' => 'Anthropic\'s balanced model between performance and cost',
                'badge_color' => '#d97706',
                'is_recommended' => false,
            ],
            [
                'name' => 'Claude 3.5 Haiku',
                'provider' => 'Anthropic',
                'model_identifier' => 'claude-3-5-haiku-20241022',
                'context_window' => 200000,
                'is_enabled' => true,
                'description' => 'نموذج Anthropic السريع والاقتصادي',
                'description_en' => 'Anthropic\'s fast and affordable model',
                'badge_color' => '#d97706',
                'is_recommended' => false,
            ],
            [
                'name' => 'Gemini 2.0 Flash',
                'provider' => 'Google',
                'model_identifier' => 'gemini-2.0-flash',
                'context_window' => 1000000,
                'is_enabled' => true,
                'description' => 'نموذج Google السريع مع نافذة سياق ضخمة',
                'description_en' => 'Google\'s fast model with massive context window',
                'badge_color' => '#4285f4',
                'is_recommended' => false,
            ],
            [
                'name' => 'DeepSeek V3',
                'provider' => 'DeepSeek',
                'model_identifier' => 'deepseek-chat',
                'context_window' => 64000,
                'is_enabled' => false,
                'description' => 'نموذج DeepSeek المفتوح المصدر عالي الأداء',
                'description_en' => 'DeepSeek\'s high-performance open-source model',
                'badge_color' => '#6366f1',
                'is_recommended' => false,
            ],
            [
                'name' => 'Llama 3.1 70B',
                'provider' => 'Meta',
                'model_identifier' => 'llama-3.1-70b',
                'context_window' => 128000,
                'is_enabled' => false,
                'description' => 'نموذج Meta المفتوح المصدر الكبير',
                'description_en' => 'Meta\'s large open-source model',
                'badge_color' => '#0668E1',
                'is_recommended' => false,
            ],
        ];

        foreach ($models as $model) {
            LlmModel::updateOrCreate(
                ['model_identifier' => $model['model_identifier']],
                $model
            );
        }
    }
}
