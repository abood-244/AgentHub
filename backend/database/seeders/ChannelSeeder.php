<?php

namespace Database\Seeders;

use App\Models\Channel;
use Illuminate\Database\Seeder;

class ChannelSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $channels = [
            [
                'name' => 'ودجت الويب',
                'name_en' => 'Web Widget',
                'type' => 'web_widget',
                'icon' => 'globe',
                'is_enabled' => true,
                'config' => [
                    'default_title' => 'مساعد AgentHub',
                    'default_primary_color' => '#0878F9',
                    'default_position' => 'bottom-right',
                ],
            ],
            [
                'name' => 'واتساب',
                'name_en' => 'WhatsApp',
                'type' => 'whatsapp',
                'icon' => 'message-circle',
                'is_enabled' => false,
                'config' => null,
            ],
            [
                'name' => 'الدردشة الحية',
                'name_en' => 'Live Chat',
                'type' => 'live_chat',
                'icon' => 'message-square',
                'is_enabled' => false,
                'config' => null,
            ],
            [
                'name' => 'مايكروسوفت تيمز',
                'name_en' => 'Microsoft Teams',
                'type' => 'teams',
                'icon' => 'users',
                'is_enabled' => false,
                'config' => null,
            ],
        ];

        foreach ($channels as $channel) {
            Channel::updateOrCreate(
                ['type' => $channel['type']],
                $channel
            );
        }
    }
}
