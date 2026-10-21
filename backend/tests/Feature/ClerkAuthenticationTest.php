<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\University;
use App\Models\User;
use App\Models\Workspace;
use App\Models\WorkspaceMember;
use App\Services\ClerkTokenVerifierInterface;
use Database\Seeders\SprintOneDemoSeeder;
use Exception;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ClerkAuthenticationTest extends TestCase
{
    use RefreshDatabase;

    protected function mockVerifierWithSubject(string $sub): void
    {
        $mock = $this->createMock(ClerkTokenVerifierInterface::class);
        $mock->method('verifyToken')->willReturn((object) [
            'sub' => $sub,
            'iss' => 'https://amazing-sunbeam-6146.clerk.accounts.dev',
        ]);
        $this->app->instance(ClerkTokenVerifierInterface::class, $mock);
    }

    protected function mockVerifierWithException(string $message): void
    {
        $mock = $this->createMock(ClerkTokenVerifierInterface::class);
        $mock->method('verifyToken')->willThrowException(new Exception($message));
        $this->app->instance(ClerkTokenVerifierInterface::class, $mock);
    }

    /**
     * 1. Missing Bearer token returns 401.
     */
    public function test_missing_bearer_token_returns_401(): void
    {
        $response = $this->getJson('/api/me');

        $response->assertStatus(401)
            ->assertJson([
                'message' => 'Unauthenticated: Bearer token missing',
            ]);
    }

    /**
     * 2. Invalid or expired token returns 401.
     */
    public function test_invalid_or_expired_token_returns_401(): void
    {
        $this->mockVerifierWithException('Token has expired');

        $response = $this->withHeader('Authorization', 'Bearer invalid-token')
            ->getJson('/api/me');

        $response->assertStatus(401)
            ->assertJson([
                'message' => 'Unauthenticated: Token has expired',
            ]);
    }

    /**
     * 3. Valid token for a mapped user resolves the correct internal user.
     */
    public function test_valid_token_for_mapped_user_resolves_correct_internal_user(): void
    {
        $this->mockVerifierWithSubject('clerk_user_123');

        $university = University::create([
            'name' => 'Test University',
            'slug' => 'test-university',
            'code' => 'TU',
        ]);

        $user = User::create([
            'clerk_user_id' => 'clerk_user_123',
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'secret',
            'role' => UserRole::SYSTEM_ADMINISTRATOR,
            'university_id' => $university->id,
        ]);

        $response = $this->withHeader('Authorization', 'Bearer valid-token')
            ->getJson('/api/me');

        $response->assertStatus(200)
            ->assertJsonPath('user.id', $user->id)
            ->assertJsonPath('user.clerk_user_id', 'clerk_user_123')
            ->assertJsonPath('user.role', 'System Administrator')
            ->assertJsonPath('user.role_key', 'system_administrator')
            ->assertJsonPath('user.university.id', $university->id);
    }

    /**
     * 4. A valid Clerk token for an unknown internal user is rejected with 403.
     */
    public function test_valid_clerk_token_for_unknown_internal_user_is_rejected(): void
    {
        $this->mockVerifierWithSubject('clerk_unregistered_999');

        $response = $this->withHeader('Authorization', 'Bearer valid-token')
            ->getJson('/api/me');

        $response->assertStatus(403)
            ->assertJson([
                'message' => 'Forbidden: Clerk identity not registered as an AgentHub user',
            ]);
    }

    /**
     * 5. A user with a null or invalid internal role is rejected with 403.
     */
    public function test_user_with_null_internal_role_is_rejected(): void
    {
        $this->mockVerifierWithSubject('clerk_norole_555');

        User::create([
            'clerk_user_id' => 'clerk_norole_555',
            'name' => 'No Role User',
            'email' => 'norole@example.com',
            'password' => 'secret',
            'role' => null,
        ]);

        $response = $this->withHeader('Authorization', 'Bearer valid-token')
            ->getJson('/api/me');

        $response->assertStatus(403)
            ->assertJson([
                'message' => 'Forbidden: User has no assigned internal role',
            ]);
    }

    /**
     * 6. /api/me returns the internal role, ignoring any client-supplied role.
     */
    public function test_api_me_returns_internal_role_not_client_supplied_role(): void
    {
        $this->mockVerifierWithSubject('clerk_staff_101');

        $user = User::create([
            'clerk_user_id' => 'clerk_staff_101',
            'name' => 'Staff Member',
            'email' => 'staff101@example.com',
            'password' => 'secret',
            'role' => UserRole::STAFF,
        ]);

        // Attempt privilege escalation via headers or query parameters
        $response = $this->withHeaders([
            'Authorization' => 'Bearer valid-token',
            'X-Role' => 'Platform Administrator',
            'Role' => 'System Administrator',
        ])->getJson('/api/me?role=Platform+Administrator');

        $response->assertStatus(200)
            ->assertJsonPath('user.role', 'Staff')
            ->assertJsonPath('user.role_key', 'staff');
    }

    /**
     * 7. The three mapped users resolve to their intended roles.
     */
    public function test_the_three_mapped_users_resolve_to_intended_roles(): void
    {
        // Run the seeder
        $this->seed(SprintOneDemoSeeder::class);

        $systemAdminClerkId = config('clerk.test_identities.system_admin.clerk_id');
        $staffClerkId = config('clerk.test_identities.staff.clerk_id');
        $platformAdminClerkId = config('clerk.test_identities.platform_admin.clerk_id');

        // Verify System Administrator
        $this->mockVerifierWithSubject($systemAdminClerkId);
        $resAdmin = $this->withHeader('Authorization', 'Bearer token')->getJson('/api/me');
        $resAdmin->assertStatus(200)
            ->assertJsonPath('user.role', 'System Administrator')
            ->assertJsonPath('user.university.slug', 'agenthub-demo-university');

        // Verify Staff
        $this->mockVerifierWithSubject($staffClerkId);
        $resStaff = $this->withHeader('Authorization', 'Bearer token')->getJson('/api/me');
        $resStaff->assertStatus(200)
            ->assertJsonPath('user.role', 'Staff')
            ->assertJsonPath('user.workspaces.0.name', 'Demo Admissions Workspace');

        // Verify Platform Administrator (has no university)
        $this->mockVerifierWithSubject($platformAdminClerkId);
        $resPlatform = $this->withHeader('Authorization', 'Bearer token')->getJson('/api/me');
        $resPlatform->assertStatus(200)
            ->assertJsonPath('user.role', 'Platform Administrator')
            ->assertJsonPath('user.university', null);
    }

    /**
     * 8. The Staff user has the seeded workspace membership.
     */
    public function test_staff_user_has_seeded_workspace_membership(): void
    {
        $this->seed(SprintOneDemoSeeder::class);

        $staffClerkId = config('clerk.test_identities.staff.clerk_id');
        $staffUser = User::where('clerk_user_id', $staffClerkId)->firstOrFail();

        $this->assertCount(1, $staffUser->workspaces);
        $this->assertEquals('Demo Admissions Workspace', $staffUser->workspaces->first()->name);
        $this->assertEquals('member', $staffUser->workspaces->first()->pivot->access_level);
    }

    /**
     * 9. The seeder is idempotent.
     */
    public function test_seeder_is_idempotent(): void
    {
        // Run twice
        $this->seed(SprintOneDemoSeeder::class);
        $this->seed(SprintOneDemoSeeder::class);

        $this->assertEquals(1, University::where('slug', 'agenthub-demo-university')->count());
        $this->assertEquals(1, Workspace::where('name', 'Demo Admissions Workspace')->count());
        $this->assertEquals(3, User::whereNotNull('clerk_user_id')->count());
        $this->assertEquals(1, WorkspaceMember::count());
    }

    /**
     * 10. Invalid client-supplied role data cannot elevate permissions.
     */
    public function test_client_cannot_elevate_permissions_by_modifying_request_payload(): void
    {
        $this->mockVerifierWithSubject('clerk_staff_victim');

        User::create([
            'clerk_user_id' => 'clerk_staff_victim',
            'name' => 'Regular Staff',
            'email' => 'victim@example.com',
            'password' => 'secret',
            'role' => UserRole::STAFF,
        ]);

        $response = $this->withHeader('Authorization', 'Bearer token')
            ->json('GET', '/api/me', [
                'role' => 'System Administrator',
                'university_id' => 999,
                'clerk_user_id' => 'hacked_admin',
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('user.role', 'Staff')
            ->assertJsonPath('user.clerk_user_id', 'clerk_staff_victim');
    }
}
