<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\AgentProfile;
use App\Models\Conversation;
use App\Models\Document;
use App\Models\EmbeddingModel;
use App\Models\EndUser;
use App\Models\LlmModel;
use App\Models\SupportCase;
use App\Models\University;
use App\Models\User;
use App\Models\Workspace;
use App\Models\WorkspaceMember;
use App\Services\ClerkTokenVerifierInterface;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class WorkspaceCompleteSprint2Test extends TestCase
{
    use RefreshDatabase;

    protected University $university;
    protected User $sysAdmin;
    protected User $staff;
    protected Workspace $workspace;
    protected EmbeddingModel $embeddingModel;
    protected LlmModel $llmModel;

    protected function mockVerifierWithSubject(string $sub): void
    {
        $mock = $this->createMock(ClerkTokenVerifierInterface::class);
        $mock->method('verifyToken')->willReturn((object) [
            'sub' => $sub,
            'iss' => 'https://amazing-sunbeam-6146.clerk.accounts.dev',
        ]);
        $this->app->instance(ClerkTokenVerifierInterface::class, $mock);
    }

    protected function authSysAdmin()
    {
        $this->mockVerifierWithSubject('clerk_sys_admin_test');
        return $this->withHeader('Authorization', 'Bearer valid_token');
    }

    protected function setUp(): void
    {
        parent::setUp();

        $this->university = University::create([
            'name' => 'جامعة الملك فهد',
            'slug' => 'kfupm',
            'status' => 'active',
        ]);

        $this->sysAdmin = User::create([
            'university_id' => $this->university->id,
            'name' => 'مسؤول النظام',
            'email' => 'admin@kfupm.edu.sa',
            'password' => bcrypt('password123'),
            'clerk_user_id' => 'clerk_sys_admin_test',
            'role' => UserRole::SYSTEM_ADMINISTRATOR,
        ]);

        $this->staff = User::create([
            'university_id' => $this->university->id,
            'name' => 'موظف الدعم الأكاديمي',
            'email' => 'staff@kfupm.edu.sa',
            'password' => bcrypt('password123'),
            'clerk_user_id' => 'clerk_staff_test',
            'role' => UserRole::STAFF,
        ]);

        $this->embeddingModel = EmbeddingModel::create([
            'name' => 'text-embedding-3-small',
            'provider' => 'OpenAI',
            'model_identifier' => 'text-embedding-3-small',
            'dimensions' => 1536,
            'max_tokens' => 8191,
            'is_enabled' => true,
        ]);

        $this->llmModel = LlmModel::create([
            'name' => 'GPT-4o Mini',
            'provider' => 'OpenAI',
            'model_identifier' => 'gpt-4o-mini',
            'is_enabled' => true,
            'is_recommended' => true,
        ]);

        $this->workspace = Workspace::create([
            'university_id' => $this->university->id,
            'name' => 'مساحة القبول والتسجيل',
            'status' => 'active',
            'selected_embedding_model_id' => $this->embeddingModel->id,
        ]);

        WorkspaceMember::create([
            'workspace_id' => $this->workspace->id,
            'user_id' => $this->staff->id,
            'access_level' => 'member',
        ]);
    }

    public function test_overview_stats_returns_real_system_counts()
    {
        $response = $this->authSysAdmin()
            ->getJson("/api/workspaces/{$this->workspace->id}/overview-stats");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'new_support_cases',
                    'staff_count',
                    'active_channels',
                    'last_db_update',
                    'total_conversations',
                    'total_end_users',
                ],
            ]);
    }

    public function test_workspace_members_endpoint_returns_assigned_staff()
    {
        $response = $this->authSysAdmin()
            ->getJson("/api/workspaces/{$this->workspace->id}/members");

        $response->assertStatus(200)
            ->assertJsonPath('members.0.user.id', $this->staff->id);
    }

    public function test_embedding_models_endpoint_returns_only_globally_enabled()
    {
        EmbeddingModel::create([
            'name' => 'Disabled Model',
            'provider' => 'Test',
            'model_identifier' => 'test-disabled',
            'dimensions' => 768,
            'max_tokens' => 2048,
            'is_enabled' => false,
        ]);

        $response = $this->authSysAdmin()
            ->getJson('/api/embedding-models?enabled=true');

        $response->assertStatus(200);
        $data = $response->json('data');
        $this->assertCount(1, $data);
        $this->assertEquals('text-embedding-3-small', $data[0]['name']);
    }

    public function test_workspace_embedding_model_can_be_selected_and_persisted()
    {
        $newEmbedding = EmbeddingModel::create([
            'name' => 'text-embedding-3-large',
            'provider' => 'OpenAI',
            'model_identifier' => 'text-embedding-3-large',
            'dimensions' => 3072,
            'max_tokens' => 8191,
            'is_enabled' => true,
        ]);

        $response = $this->authSysAdmin()
            ->putJson("/api/workspaces/{$this->workspace->id}", [
                'selected_embedding_model_id' => $newEmbedding->id,
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('workspace.selected_embedding_model_id', $newEmbedding->id);

        $this->assertDatabaseHas('workspaces', [
            'id' => $this->workspace->id,
            'selected_embedding_model_id' => $newEmbedding->id,
        ]);
    }

    public function test_document_markdown_creation_chunking_and_listing()
    {
        $response = $this->authSysAdmin()
            ->postJson("/api/workspaces/{$this->workspace->id}/documents", [
                'title' => 'شروط القبول والتسجيل ٢٠٢٦',
                'source_type' => 'markdown',
                'storage_type' => 'normal',
                'content' => "# شروط القبول\nيجب الحصول على معدل ٩٠٪ في الثانوية.\n\n# الوثائق المطلوبة\nصورة الهوية الوطنية والشهادة الأصلية.",
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.title', 'شروط القبول والتسجيل ٢٠٢٦')
            ->assertJsonPath('data.storage_type', 'normal');

        $docId = $response->json('data.id');

        // Check chunks were generated
        $chunksRes = $this->authSysAdmin()
            ->getJson("/api/workspaces/{$this->workspace->id}/documents/{$docId}/chunks");

        $chunksRes->assertStatus(200);
        $this->assertNotEmpty($chunksRes->json('data'));
    }

    public function test_csv_file_preview_workflow()
    {
        $csvContent = "Name,Major,GPA\nAhmed,Computer Science,3.9\nSara,Software Engineering,4.0\nOmar,Information Systems,3.5";
        $file = UploadedFile::fake()->createWithContent('students.csv', $csvContent);

        $response = $this->authSysAdmin()
            ->post("/api/workspaces/{$this->workspace->id}/documents/preview-csv", [
                'csv_file' => $file,
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.columns', ['Name', 'Major', 'GPA'])
            ->assertJsonPath('data.columns_count', 3)
            ->assertJsonPath('data.total_records', 3);
    }

    public function test_agent_profile_single_instance_enforcement_and_staff_routing()
    {
        // 1. Create first profile
        $res = $this->authSysAdmin()
            ->postJson("/api/workspaces/{$this->workspace->id}/agent-profile", [
                'name' => 'المرشد الأكاديمي الذكي',
                'system_instructions' => 'أنت مرشد أكاديمي بالجامعة. أجب بدقة.',
                'selected_llm_model_id' => $this->llmModel->id,
                'use_knowledge_base' => true,
                'support_case_auto_create' => true,
                'support_case_conditions' => 'عند وجود مشاكل بالقبول والتسجيل',
                'staff_auto_assign' => true,
                'auto_assign_staff_ids' => [$this->staff->id],
            ]);

        $res->assertStatus(201)
            ->assertJsonPath('data.name', 'المرشد الأكاديمي الذكي')
            ->assertJsonPath('data.auto_assign_staff_ids.0', $this->staff->id);

        // 2. Reject second profile in same workspace
        $res2 = $this->authSysAdmin()
            ->postJson("/api/workspaces/{$this->workspace->id}/agent-profile", [
                'name' => 'وكيل آخر',
            ]);

        $res2->assertStatus(422);
    }

    public function test_end_user_blocking_and_ai_pausing()
    {
        $endUser = EndUser::create([
            'workspace_id' => $this->workspace->id,
            'external_id' => 'student_123',
            'name' => 'خالد العتيبي',
            'phone' => '+966501234567',
        ]);

        // Pause AI
        $resPause = $this->authSysAdmin()
            ->postJson("/api/workspaces/{$this->workspace->id}/end-users/{$endUser->id}/pause-ai");
        $resPause->assertStatus(200)
            ->assertJsonPath('data.ai_responses_paused', true);

        // Block user
        $resBlock = $this->authSysAdmin()
            ->postJson("/api/workspaces/{$this->workspace->id}/end-users/{$endUser->id}/block");
        $resBlock->assertStatus(200)
            ->assertJsonPath('data.is_blocked', true);

        // Verify conversation message reject if user blocked
        $conv = Conversation::create([
            'workspace_id' => $this->workspace->id,
            'end_user_id' => $endUser->id,
            'handler' => 'human',
            'status' => 'open',
        ]);

        $msgRes = $this->authSysAdmin()
            ->postJson("/api/workspaces/{$this->workspace->id}/conversations/{$conv->id}/messages", [
                'content' => 'مرحباً، كيف أساعدك؟',
            ]);

        $msgRes->assertStatus(403);
    }

    public function test_support_case_full_lifecycle_and_assignment_logs()
    {
        // 1. Create case
        $createRes = $this->authSysAdmin()
            ->postJson("/api/workspaces/{$this->workspace->id}/support-cases", [
                'title' => 'تعذر دفع الرسوم الدراسية',
                'description' => 'الرسوم تظهر غير مسددة بالبوابة رغم إتمام الخصم البنكي',
                'priority' => 'high',
                'category' => 'مالي',
                'summary' => 'مشكلة تسوية بنكية',
                'required_action' => 'التحقق من حساب الجامعة المصرفي',
            ]);

        $createRes->assertStatus(201)
            ->assertJsonPath('data.status', 'new');

        $caseId = $createRes->json('data.id');

        // 2. Assign staff
        $assignRes = $this->authSysAdmin()
            ->postJson("/api/workspaces/{$this->workspace->id}/support-cases/{$caseId}/assign", [
                'assigned_staff_id' => $this->staff->id,
            ]);

        $assignRes->assertStatus(200)
            ->assertJsonPath('data.assigned_staff_id', $this->staff->id);

        // 3. Change status: new -> in_progress
        $statusRes = $this->authSysAdmin()
            ->postJson("/api/workspaces/{$this->workspace->id}/support-cases/{$caseId}/status", [
                'status' => 'in_progress',
            ]);

        $statusRes->assertStatus(200)
            ->assertJsonPath('data.status', 'in_progress');

        // 4. Change status: in_progress -> closed
        $closeRes = $this->authSysAdmin()
            ->postJson("/api/workspaces/{$this->workspace->id}/support-cases/{$caseId}/status", [
                'status' => 'closed',
            ]);

        $closeRes->assertStatus(200)
            ->assertJsonPath('data.status', 'closed');

        // 5. Verify follow-up logs
        $logsRes = $this->authSysAdmin()
            ->getJson("/api/workspaces/{$this->workspace->id}/support-cases/{$caseId}/logs");

        $logsRes->assertStatus(200);
        $actions = collect($logsRes->json('data'))->pluck('action')->toArray();
        $this->assertContains('created', $actions);
        $this->assertContains('assigned', $actions);
        $this->assertContains('status_changed', $actions);
    }

    public function test_test_chat_creates_isolated_test_conversation_not_in_real_conversations()
    {
        // Setup Agent Profile
        AgentProfile::create([
            'workspace_id' => $this->workspace->id,
            'name' => 'وكيل الاختبار',
            'system_instructions' => 'أنت مساعد اختباري.',
            'selected_llm_model_id' => $this->llmModel->id,
            'use_knowledge_base' => false,
        ]);

        $chatRes = $this->authSysAdmin()
            ->postJson("/api/workspaces/{$this->workspace->id}/test-chat", [
                'question' => 'ما هي شروط القبول؟',
            ]);

        $chatRes->assertStatus(200);

        // Real conversations must remain 0!
        $convsRes = $this->authSysAdmin()
            ->getJson("/api/workspaces/{$this->workspace->id}/conversations");

        $convsRes->assertStatus(200);
        $this->assertEmpty($convsRes->json('data'));
    }
}
