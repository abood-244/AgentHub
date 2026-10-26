<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Sprint 2: Seed LLM Models, Embedding Models, and Channels
        $this->call([
            LlmModelSeeder::class,
            EmbeddingModelSeeder::class,
            ChannelSeeder::class,
        ]);
    }
}
