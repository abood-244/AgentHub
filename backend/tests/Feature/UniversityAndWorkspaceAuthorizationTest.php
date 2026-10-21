<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\University;
use App\Models\User;
use App\Models\Workspace;
use App\Models\WorkspaceMember;
use App\Services\ClerkTokenVerifierInterface;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UniversityAndWorkspaceAuthorizationTest extends TestCase
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

    protected function createUniversity(string $name = 'Demo University', string $slug = 'demo-university'): University
    {
        return University::create([
            'name' => $name,
            'slug' => $slug,
            'code' => strtoupper(substr($slug, 0, 4)),
            'contact_email' => "info@{$slug}.edu",
            'contact_phone' => '+966-11-0000000',
            'website' => "https://{$slug}.edu",
        ]);
    }

    protected function createUserWithRole(UserRole $role, ?int $universityId = null, string $clerkId = 'clerk_test_user'): User
    {
        return User::create([
            'clerk_user_id' => $clerkId,
            'name' => "User {$role->value}",
            'email' => "{$clerkId}@example.com",
            'password' => 'secret',
            'role' => $role,
            'university_id' => $universityId,
        ]);
    }

    /**
     * 1. System Administrator can retrieve their own university.
     */
    public function test_system_administrator_can_retrieve_own_university(): void
    {
        $this->mockVerifierWithSubject('clerk_sysadmin_1');
        $university = $this->createUniversity('King Saud University', 'ksu');
        $admin = $this->createUserWithRole(UserRole::SYSTEM_ADMINISTRATOR, $university->id, 'clerk_sysadmin_1');

        $response = $this->withHeader('Authorization', 'Bearer valid_token')
            ->getJson('/api/university');

        $response->assertStatus(200)
            ->assertJsonPath('university.id', $university->id)
            ->assertJsonPath('university.name', 'King Saud University')
            ->assertJsonPath('university.slug', 'ksu');
    }

    /**
     * 2. System Administrator can update permitted university fields.
     */
    public function test_system_administrator_can_update_permitted_university_fields(): void
    {
        $this->mockVerifierWithSubject('clerk_sysadmin_2');
        $university = $this->createUniversity('Original University', 'orig-uni');
        $admin = $this->createUserWithRole(UserRole::SYSTEM_ADMINISTRATOR, $university->id, 'clerk_sysadmin_2');

        $payload = [
            'name' => 'Updated University Name',
            'contact_email' => 'admissions@updated-uni.edu',
            'contact_phone' => '+966-11-9999999',
            'website' => 'https://updated-uni.edu',
        ];

        $response = $this->withHeader('Authorization', 'Bearer valid_token')
            ->putJson('/api/university', $payload);

        $response->assertStatus(200)
            ->assertJsonPath('message', 'University updated successfully.')
            ->assertJsonPath('university.name', 'Updated University Name')
            ->assertJsonPath('university.contact_email', 'admissions@updated-uni.edu');

        $this->assertDatabaseHas('universities', [
            'id' => $university->id,
            'name' => 'Updated University Name',
            'contact_email' => 'admissions@updated-uni.edu',
        ]);
    }

    /**
     * 3. System Administrator cannot read or update another university by supplying a different ID.
     */
    public function test_system_administrator_cannot_manipulate_or_update_another_university(): void
    {
        $this->mockVerifierWithSubject('clerk_sysadmin_3');
        $ownUniversity = $this->createUniversity('Own University', 'own-uni');
        $foreignUniversity = $this->createUniversity('Foreign University', 'foreign-uni');

        $admin = $this->createUserWithRole(UserRole::SYSTEM_ADMINISTRATOR, $ownUniversity->id, 'clerk_sysadmin_3');

        // Attempting to override university_id in PUT request body
        $response = $this->withHeader('Authorization', 'Bearer valid_token')
            ->putJson('/api/university', [
                'university_id' => $foreignUniversity->id,
                'name' => 'Malicious Update',
            ]);

        $response->assertStatus(403)
            ->assertJson([
                'message' => 'Forbidden: You cannot modify a university other than your own.',
            ]);

        $this->assertDatabaseHas('universities', [
            'id' => $foreignUniversity->id,
            'name' => 'Foreign University',
        ]);
    }

    /**
     * 4. Staff cannot access university administration endpoints.
     */
    public function test_staff_cannot_access_university_endpoints(): void
    {
        $this->mockVerifierWithSubject('clerk_staff_1');
        $university = $this->createUniversity();
        $staff = $this->createUserWithRole(UserRole::STAFF, $university->id, 'clerk_staff_1');

        // GET /api/university -> 403
        $getRes = $this->withHeader('Authorization', 'Bearer valid_token')
            ->getJson('/api/university');
        $getRes->assertStatus(403);

        // PUT /api/university -> 403
        $putRes = $this->withHeader('Authorization', 'Bearer valid_token')
            ->putJson('/api/university', ['name' => 'Hacked University']);
        $putRes->assertStatus(403);
    }

    /**
     * 5. Platform Administrator cannot perform unauthorized university operations.
     */
    public function test_platform_administrator_cannot_access_university_endpoints(): void
    {
        $this->mockVerifierWithSubject('clerk_platform_1');
        $platformAdmin = $this->createUserWithRole(UserRole::PLATFORM_ADMINISTRATOR, null, 'clerk_platform_1');

        $getRes = $this->withHeader('Authorization', 'Bearer valid_token')
            ->getJson('/api/university');
        $getRes->assertStatus(403);

        $putRes = $this->withHeader('Authorization', 'Bearer valid_token')
            ->putJson('/api/university', ['name' => 'Platform Hack']);
        $putRes->assertStatus(403);
    }

    /**
     * 6. System Administrator can list only their university's workspaces.
     */
    public function test_system_administrator_lists_only_own_university_workspaces(): void
    {
        $this->mockVerifierWithSubject('clerk_sysadmin_6');
        $ownUni = $this->createUniversity('Own Uni', 'own-uni-6');
        $otherUni = $this->createUniversity('Other Uni', 'other-uni-6');

        $admin = $this->createUserWithRole(UserRole::SYSTEM_ADMINISTRATOR, $ownUni->id, 'clerk_sysadmin_6');

        $ws1 = Workspace::create(['university_id' => $ownUni->id, 'name' => 'Own Workspace A']);
        $ws2 = Workspace::create(['university_id' => $ownUni->id, 'name' => 'Own Workspace B']);
        $foreignWs = Workspace::create(['university_id' => $otherUni->id, 'name' => 'Foreign Workspace']);

        $response = $this->withHeader('Authorization', 'Bearer valid_token')
            ->getJson('/api/workspaces');

        $response->assertStatus(200)
            ->assertJsonCount(2, 'workspaces')
            ->assertJsonPath('workspaces.0.name', 'Own Workspace A')
            ->assertJsonPath('workspaces.1.name', 'Own Workspace B');
    }

    /**
     * 7. System Administrator can create a workspace under their university.
     */
    public function test_system_administrator_can_create_workspace_under_own_university(): void
    {
        $this->mockVerifierWithSubject('clerk_sysadmin_7');
        $university = $this->createUniversity('Admin Uni', 'admin-uni-7');
        $admin = $this->createUserWithRole(UserRole::SYSTEM_ADMINISTRATOR, $university->id, 'clerk_sysadmin_7');

        $payload = [
            'name' => 'College of Computing Workspace',
            'description' => 'Workspace dedicated to computing department queries.',
            'status' => 'active',
        ];

        $response = $this->withHeader('Authorization', 'Bearer valid_token')
            ->postJson('/api/workspaces', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('message', 'Workspace created successfully.')
            ->assertJsonPath('workspace.name', 'College of Computing Workspace')
            ->assertJsonPath('workspace.university_id', $university->id)
            ->assertJsonPath('workspace.access_level', 'admin');

        $this->assertDatabaseHas('workspaces', [
            'name' => 'College of Computing Workspace',
            'university_id' => $university->id,
            'status' => 'active',
        ]);
    }

    /**
     * 8. System Administrator can retrieve and update a workspace belonging to their university.
     */
    public function test_system_administrator_can_retrieve_and_update_own_workspace(): void
    {
        $this->mockVerifierWithSubject('clerk_sysadmin_8');
        $university = $this->createUniversity();
        $admin = $this->createUserWithRole(UserRole::SYSTEM_ADMINISTRATOR, $university->id, 'clerk_sysadmin_8');

        $workspace = Workspace::create([
            'university_id' => $university->id,
            'name' => 'Old Workspace Name',
            'description' => 'Initial description',
            'status' => 'paused',
        ]);

        // GET /api/workspaces/{id}
        $getRes = $this->withHeader('Authorization', 'Bearer valid_token')
            ->getJson("/api/workspaces/{$workspace->id}");
        $getRes->assertStatus(200)
            ->assertJsonPath('workspace.id', $workspace->id)
            ->assertJsonPath('workspace.name', 'Old Workspace Name');

        // PUT /api/workspaces/{id}
        $putRes = $this->withHeader('Authorization', 'Bearer valid_token')
            ->putJson("/api/workspaces/{$workspace->id}", [
                'name' => 'Renamed Workspace',
                'status' => 'active',
            ]);
        $putRes->assertStatus(200)
            ->assertJsonPath('workspace.name', 'Renamed Workspace')
            ->assertJsonPath('workspace.status', 'active');

        $this->assertDatabaseHas('workspaces', [
            'id' => $workspace->id,
            'name' => 'Renamed Workspace',
            'status' => 'active',
        ]);
    }

    /**
     * 9. System Administrator cannot retrieve or update a workspace belonging to another university.
     */
    public function test_system_administrator_cannot_access_or_modify_foreign_workspace(): void
    {
        $this->mockVerifierWithSubject('clerk_sysadmin_9');
        $ownUni = $this->createUniversity('Own Uni', 'own-uni-9');
        $foreignUni = $this->createUniversity('Foreign Uni', 'foreign-uni-9');

        $admin = $this->createUserWithRole(UserRole::SYSTEM_ADMINISTRATOR, $ownUni->id, 'clerk_sysadmin_9');
        $foreignWs = Workspace::create(['university_id' => $foreignUni->id, 'name' => 'Secret Foreign WS']);

        // GET foreign workspace -> 403
        $getRes = $this->withHeader('Authorization', 'Bearer valid_token')
            ->getJson("/api/workspaces/{$foreignWs->id}");
        $getRes->assertStatus(403);

        // PUT foreign workspace -> 403
        $putRes = $this->withHeader('Authorization', 'Bearer valid_token')
            ->putJson("/api/workspaces/{$foreignWs->id}", ['name' => 'Hacked Workspace Name']);
        $putRes->assertStatus(403);

        $this->assertDatabaseHas('workspaces', [
            'id' => $foreignWs->id,
            'name' => 'Secret Foreign WS',
        ]);
    }

    /**
     * 10. Staff can list only workspaces for which they have a valid membership.
     */
    public function test_staff_can_list_only_workspaces_with_valid_membership(): void
    {
        $this->mockVerifierWithSubject('clerk_staff_10');
        $university = $this->createUniversity();
        $staff = $this->createUserWithRole(UserRole::STAFF, $university->id, 'clerk_staff_10');

        $wsMember = Workspace::create(['university_id' => $university->id, 'name' => 'Authorized Workspace']);
        $wsNonMember = Workspace::create(['university_id' => $university->id, 'name' => 'Unauthorized Workspace']);

        WorkspaceMember::create([
            'workspace_id' => $wsMember->id,
            'user_id' => $staff->id,
            'access_level' => 'member',
        ]);

        $response = $this->withHeader('Authorization', 'Bearer valid_token')
            ->getJson('/api/workspaces');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'workspaces')
            ->assertJsonPath('workspaces.0.id', $wsMember->id)
            ->assertJsonPath('workspaces.0.name', 'Authorized Workspace')
            ->assertJsonPath('workspaces.0.access_level', 'member');
    }

    /**
     * 11. Staff cannot retrieve a workspace without the required membership.
     */
    public function test_staff_cannot_retrieve_workspace_without_membership(): void
    {
        $this->mockVerifierWithSubject('clerk_staff_11');
        $university = $this->createUniversity();
        $staff = $this->createUserWithRole(UserRole::STAFF, $university->id, 'clerk_staff_11');

        $unauthorizedWs = Workspace::create(['university_id' => $university->id, 'name' => 'Staff Blocked WS']);

        $response = $this->withHeader('Authorization', 'Bearer valid_token')
            ->getJson("/api/workspaces/{$unauthorizedWs->id}");

        $response->assertStatus(403)
            ->assertJson([
                'message' => 'Forbidden: You are not a member of this workspace.',
            ]);
    }

    /**
     * 12. Staff cannot create a workspace.
     */
    public function test_staff_cannot_create_workspace(): void
    {
        $this->mockVerifierWithSubject('clerk_staff_12');
        $university = $this->createUniversity();
        $staff = $this->createUserWithRole(UserRole::STAFF, $university->id, 'clerk_staff_12');

        $response = $this->withHeader('Authorization', 'Bearer valid_token')
            ->postJson('/api/workspaces', [
                'name' => 'Staff Created Workspace',
            ]);

        $response->assertStatus(403)
            ->assertJson([
                'message' => 'Forbidden: Only System Administrators can create workspaces.',
            ]);

        $this->assertDatabaseMissing('workspaces', [
            'name' => 'Staff Created Workspace',
        ]);
    }

    /**
     * 13. Staff cannot update a workspace.
     */
    public function test_staff_cannot_update_workspace(): void
    {
        $this->mockVerifierWithSubject('clerk_staff_13');
        $university = $this->createUniversity();
        $staff = $this->createUserWithRole(UserRole::STAFF, $university->id, 'clerk_staff_13');

        $workspace = Workspace::create(['university_id' => $university->id, 'name' => 'Immutable By Staff']);
        WorkspaceMember::create([
            'workspace_id' => $workspace->id,
            'user_id' => $staff->id,
            'access_level' => 'member',
        ]);

        $response = $this->withHeader('Authorization', 'Bearer valid_token')
            ->putJson("/api/workspaces/{$workspace->id}", [
                'name' => 'Staff Tampered Name',
            ]);

        $response->assertStatus(403)
            ->assertJson([
                'message' => 'Forbidden: Only System Administrators can update workspaces.',
            ]);

        $this->assertDatabaseHas('workspaces', [
            'id' => $workspace->id,
            'name' => 'Immutable By Staff',
        ]);
    }

    /**
     * 14. Platform Administrator cannot create, retrieve, or update workspaces.
     */
    public function test_platform_administrator_cannot_perform_workspace_operations(): void
    {
        $this->mockVerifierWithSubject('clerk_platform_14');
        $platformAdmin = $this->createUserWithRole(UserRole::PLATFORM_ADMINISTRATOR, null, 'clerk_platform_14');

        $university = $this->createUniversity();
        $workspace = Workspace::create(['university_id' => $university->id, 'name' => 'Target WS']);

        // Listing workspaces -> returns empty collection in Sprint 1 scope
        $listRes = $this->withHeader('Authorization', 'Bearer valid_token')
            ->getJson('/api/workspaces');
        $listRes->assertStatus(200)
            ->assertJson(['workspaces' => []]);

        // POST /api/workspaces -> 403
        $createRes = $this->withHeader('Authorization', 'Bearer valid_token')
            ->postJson('/api/workspaces', ['name' => 'Platform WS']);
        $createRes->assertStatus(403);

        // GET /api/workspaces/{id} -> 403
        $getRes = $this->withHeader('Authorization', 'Bearer valid_token')
            ->getJson("/api/workspaces/{$workspace->id}");
        $getRes->assertStatus(403);

        // PUT /api/workspaces/{id} -> 403
        $putRes = $this->withHeader('Authorization', 'Bearer valid_token')
            ->putJson("/api/workspaces/{$workspace->id}", ['name' => 'Platform Edit']);
        $putRes->assertStatus(403);
    }

    /**
     * 15. Unauthenticated requests are rejected.
     */
    public function test_unauthenticated_requests_are_rejected_on_all_endpoints(): void
    {
        $this->getJson('/api/university')->assertStatus(401);
        $this->putJson('/api/university', ['name' => 'Test'])->assertStatus(401);
        $this->getJson('/api/workspaces')->assertStatus(401);
        $this->postJson('/api/workspaces', ['name' => 'Test'])->assertStatus(401);
        $this->getJson('/api/workspaces/1')->assertStatus(401);
        $this->putJson('/api/workspaces/1', ['name' => 'Test'])->assertStatus(401);
    }

    /**
     * 16. Malicious requests attempting to override university_id or role cannot elevate access.
     */
    public function test_malicious_requests_cannot_override_university_association(): void
    {
        $this->mockVerifierWithSubject('clerk_sysadmin_16');
        $ownUni = $this->createUniversity('Legit Uni', 'legit-uni');
        $targetUni = $this->createUniversity('Victim Uni', 'victim-uni');

        $admin = $this->createUserWithRole(UserRole::SYSTEM_ADMINISTRATOR, $ownUni->id, 'clerk_sysadmin_16');

        // Attempting to create workspace under Victim Uni
        $response = $this->withHeader('Authorization', 'Bearer valid_token')
            ->postJson('/api/workspaces', [
                'name' => 'Spoofed Workspace',
                'university_id' => $targetUni->id,
            ]);

        $response->assertStatus(403)
            ->assertJson([
                'message' => 'Forbidden: You cannot create a workspace for another university.',
            ]);

        $this->assertDatabaseMissing('workspaces', [
            'name' => 'Spoofed Workspace',
        ]);
    }

    /**
     * 17. Existing /api/me behavior continues to resolve the correct internal role and authorized workspace context.
     */
    public function test_existing_api_me_continues_to_resolve_correct_context(): void
    {
        $this->mockVerifierWithSubject('clerk_staff_17');
        $university = $this->createUniversity('Demo University', 'demo-uni-17');
        $staff = $this->createUserWithRole(UserRole::STAFF, $university->id, 'clerk_staff_17');

        $workspace = Workspace::create(['university_id' => $university->id, 'name' => 'Admissions Desk']);
        WorkspaceMember::create([
            'workspace_id' => $workspace->id,
            'user_id' => $staff->id,
            'access_level' => 'member',
        ]);

        $response = $this->withHeader('Authorization', 'Bearer valid_token')
            ->getJson('/api/me');

        $response->assertStatus(200)
            ->assertJsonPath('user.id', $staff->id)
            ->assertJsonPath('user.role', 'Staff')
            ->assertJsonPath('user.university.slug', 'demo-uni-17')
            ->assertJsonCount(1, 'user.workspaces')
            ->assertJsonPath('user.workspaces.0.name', 'Admissions Desk')
            ->assertJsonPath('user.workspaces.0.access_level', 'member');
    }
}
