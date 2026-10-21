<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\University;
use App\Models\User;
use App\Models\Workspace;
use App\Models\WorkspaceMember;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use RuntimeException;

class SprintOneDemoSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * Configures the demo university, workspace, and 3 test accounts
     * using environment variables for the Clerk User IDs.
     */
    public function run(): void
    {
        // 1. Create or retrieve the Demo University
        $university = University::firstOrCreate(
            ['slug' => 'agenthub-demo-university'],
            [
                'name' => 'AgentHub Demo University',
                'code' => 'ADU',
                'contact_email' => 'info@agenthub-demo.edu',
                'contact_phone' => '+966-11-0000000',
                'website' => 'https://demo.agenthub.dev',
            ]
        );

        // 2. Create or retrieve the Demo Workspace under the University
        $workspace = Workspace::firstOrCreate(
            [
                'university_id' => $university->id,
                'name' => 'Demo Admissions Workspace',
            ],
            [
                'description' => 'Demo workspace for admissions and prospective student inquiries.',
                'status' => 'active',
            ]
        );

        // 3. Configure the 3 test users from environment variables
        $usersConfig = [
            [
                'role' => UserRole::SYSTEM_ADMINISTRATOR,
                'clerk_id' => config('clerk.test_identities.system_admin.clerk_id'),
                'name' => config('clerk.test_identities.system_admin.name', 'يوسف العتيبي'),
                'email' => config('clerk.test_identities.system_admin.email', 'admin@agenthub.test'),
                'university_id' => $university->id,
            ],
            [
                'role' => UserRole::STAFF,
                'clerk_id' => config('clerk.test_identities.staff.clerk_id'),
                'name' => config('clerk.test_identities.staff.name', 'أحمد المطيري'),
                'email' => config('clerk.test_identities.staff.email', 'staff@agenthub.test'),
                'university_id' => $university->id,
            ],
            [
                'role' => UserRole::PLATFORM_ADMINISTRATOR,
                'clerk_id' => config('clerk.test_identities.platform_admin.clerk_id'),
                'name' => config('clerk.test_identities.platform_admin.name', 'Platform Administrator'),
                'email' => config('clerk.test_identities.platform_admin.email', 'platform@agenthub.test'),
                'university_id' => null, // Platform Administrator has no single university binding
            ],
        ];

        $staffUser = null;

        foreach ($usersConfig as $cfg) {
            $clerkId = $cfg['clerk_id'];
            $email = $cfg['email'];

            if (empty($clerkId)) {
                $roleLabel = $cfg['role']->label();
                $this->command?->warn("Skipping {$roleLabel}: Clerk user ID is not configured in environment.");
                continue;
            }

            // Conflict detection: verify if email already belongs to a different Clerk User ID
            $existingByEmail = User::where('email', $email)->first();
            if ($existingByEmail && $existingByEmail->clerk_user_id !== $clerkId) {
                throw new RuntimeException(
                    "Conflict detected: Email '{$email}' already belongs to User ID {$existingByEmail->id} with clerk_user_id '{$existingByEmail->clerk_user_id}' (attempted to assign to '{$clerkId}')"
                );
            }

            // Idempotent upsert
            $user = User::updateOrCreate(
                ['clerk_user_id' => $clerkId],
                [
                    'name' => $cfg['name'],
                    'email' => $email,
                    'password' => Hash::make(Str::random(32)), // Unusable random hash
                    'role' => $cfg['role'],
                    'university_id' => $cfg['university_id'],
                ]
            );

            if ($cfg['role'] === UserRole::STAFF) {
                $staffUser = $user;
            }
        }

        // 4. Connect Staff user to Demo Workspace
        if ($staffUser) {
            WorkspaceMember::firstOrCreate(
                [
                    'workspace_id' => $workspace->id,
                    'user_id' => $staffUser->id,
                ],
                [
                    'access_level' => 'member',
                ]
            );
        }

        $this->command?->info('Sprint 1 demo seed completed successfully.');
    }
}
