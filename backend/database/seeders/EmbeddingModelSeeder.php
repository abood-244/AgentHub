<?php

namespace Database\Seeders;

use App\Models\EmbeddingModel;
use Illuminate\Database\Seeder;

class EmbeddingModelSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $models = [
            [
                'name' => 'text-embedding-3-small',
                'provider' => 'OpenAI',
                'model_identifier' => 'text-embedding-3-small',
                'dimensions' => 1536,
                'is_enabled' => true,
                'description' => 'نموذج تضمين OpenAI الاقتصادي والسريع',
                'description_en' => 'OpenAI\'s affordable and fast embedding model',
            ],
            [
                'name' => 'text-embedding-3-large',
                'provider' => 'OpenAI',
                'model_identifier' => 'text-embedding-3-large',
                'dimensions' => 3072,
                'is_enabled' => true,
                'description' => 'نموذج تضمين OpenAI الأكثر دقة',
                'description_en' => 'OpenAI\'s most accurate embedding model',
            ],
            [
                'name' => 'text-embedding-004',
                'provider' => 'Google',
                'model_identifier' => 'text-embedding-004',
                'dimensions' => 768,
                'is_enabled' => true,
                'description' => 'نموذج تضمين Google الحديث',
                'description_en' => 'Google\'s latest embedding model',
            ],
            [
                'name' => 'embed-multilingual-v3.0',
                'provider' => 'Cohere',
                'model_identifier' => 'embed-multilingual-v3.0',
                'dimensions' => 1024,
                'is_enabled' => false,
                'description' => 'نموذج تضمين Cohere متعدد اللغات',
                'description_en' => 'Cohere\'s multilingual embedding model',
            ],
        ];

        foreach ($models as $model) {
            EmbeddingModel::updateOrCreate(
                ['model_identifier' => $model['model_identifier']],
                $model
            );
        }
    }
}
