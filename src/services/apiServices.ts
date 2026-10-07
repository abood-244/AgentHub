import {
  Workspace,
  WorkspaceStatus,
  LLMModel,
  AgentProfile,
  KnowledgeSource,
  SupportCase,
  SupportCaseStatus,
  Channel,
  User,
  WorkspaceChannelConfig,
  WorkspaceSetupProgress,
  TestChatMessage,
} from '../types';

import {
  mockWorkspaces,
  mockLLMModels,
  mockAgentProfiles,
  mockKnowledgeSources,
  mockSupportCases,
  mockChannels,
  mockGlobalStaff,
} from './mockData';

// In-memory reactive stores simulating database records
let workspacesState: Workspace[] = [...mockWorkspaces];
const agentProfilesState: Record<string, AgentProfile> = { ...mockAgentProfiles };
let knowledgeSourcesState: KnowledgeSource[] = [...mockKnowledgeSources];
let supportCasesState: SupportCase[] = [...mockSupportCases];
let globalStaffState: User[] = [...mockGlobalStaff];

const delay = (ms = 100) => new Promise(resolve => setTimeout(resolve, ms));

export const workspaceService = {
  async getAll(): Promise<Workspace[]> {
    await delay();
    return [...workspacesState];
  },

  async getById(id: string): Promise<Workspace | null> {
    await delay();
    const item = workspacesState.find(w => w.id === id);
    return item ? { ...item } : null;
  },

  async create(data: {
    name: string;
    nameEn?: string;
    description: string;
    descriptionEn?: string;
    category?: Workspace['category'];
    selectedLLMModelId?: string;
  }): Promise<Workspace> {
    await delay();
    const id = `ws-${Date.now().toString(36)}`;
    const newWorkspace: Workspace = {
      id,
      name: data.name,
      nameEn: data.nameEn || data.name,
      slug: (data.nameEn || data.name).toLowerCase().replace(/\s+/g, '-'),
      description: data.description,
      descriptionEn: data.descriptionEn || data.description,
      category: data.category || 'admissions',
      status: 'paused', // Initially paused until setup & tested
      iconName: 'Building',
      themeColor: '#0066FF',
      knowledgeSourcesCount: 0,
      agentsCount: 1,
      staffCount: 0,
      selectedLLMModelId: data.selectedLLMModelId || 'model-gpt4o',
      defaultLanguage: 'ar',
      assignedStaffIds: [],
      channelConfig: {
        webWidget: {
          enabled: false,
          title: `مساعد ${data.name}`,
          primaryColor: '#0066FF',
          position: 'bottom-right',
          greeting: `مرحباً بك في قسم ${data.name}، كيف يمكنني مساعدتك؟`
        },
        whatsapp: {
          enabled: false,
          phoneNumber: '',
          status: 'disconnected'
        }
      },
      setupProgress: {
        workspaceSettings: 'configured',
        knowledge: 'not_configured',
        agentProfile: 'in_progress',
        llmModel: 'configured',
        staff: 'not_configured',
        channels: 'not_configured',
        testAgent: 'not_configured',
        isReadyForTesting: false,
        isLiveReady: false,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    workspacesState = [newWorkspace, ...workspacesState];

    // Seed initial agent profile
    agentProfilesState[id] = {
      id: `agent-prof-${id}`,
      workspaceId: id,
      name: `مساعد ${data.name} الذكي`,
      description: `وكيل مخصص للرد على استفسارات الطلاب في ${data.name}.`,
      selectedLLMModelId: newWorkspace.selectedLLMModelId,
      systemInstructions: `أنت المساعد الرسمي المعتمد لقسم ${data.name} في جامعة العلوم والتكنولوجيا.
استخدم المعرفة الجامعية المتاحة للإجابة بدقة ووضوح.
إذا لم تكن المعلومة متوفرة في الوثائق المرفقة، قم بتحويل الاستفسار فوراً إلى موظفي القسم ولا تقدم معلومات غير مؤكدة.`,
      temperature: 0.25,
      maxTokens: 1200,
      status: 'training',
      escalationRules: {
        enabled: true,
        confidenceThreshold: 0.75,
        fallbackStaffGroupId: 'staff-general',
        autoCreateSupportCase: true,
      },
      linkedKnowledgeSourceIds: [],
    };

    return newWorkspace;
  },

  async update(id: string, data: Partial<Workspace>): Promise<Workspace> {
    await delay();
    const index = workspacesState.findIndex(w => w.id === id);
    if (index === -1) throw new Error('Workspace not found');
    const updated = { ...workspacesState[index], ...data, updatedAt: new Date().toISOString() };
    workspacesState[index] = updated;
    return updated;
  },

  async updateSetupProgress(id: string, progressUpdates: Partial<WorkspaceSetupProgress>): Promise<Workspace> {
    const ws = await this.getById(id);
    if (!ws) throw new Error('Workspace not found');
    const newProgress = { ...ws.setupProgress, ...progressUpdates };
    
    // Check if ready for testing
    const hasKnowledge = newProgress.knowledge === 'configured' || newProgress.knowledge === 'ready';
    const hasAgent = newProgress.agentProfile === 'configured' || newProgress.agentProfile === 'ready';
    const hasModel = newProgress.llmModel === 'configured' || newProgress.llmModel === 'ready';
    
    newProgress.isReadyForTesting = hasKnowledge && hasAgent && hasModel;
    if (newProgress.testAgent === 'ready') {
      newProgress.isLiveReady = true;
    }

    return this.update(id, { setupProgress: newProgress });
  },

  async updateStatus(id: string, status: WorkspaceStatus): Promise<Workspace> {
    return this.update(id, { status });
  },

  async updateChannelConfig(id: string, config: WorkspaceChannelConfig): Promise<Workspace> {
    const ws = await this.update(id, { channelConfig: config });
    const hasAnyChannel = config.webWidget.enabled || config.whatsapp.enabled;
    await this.updateSetupProgress(id, {
      channels: hasAnyChannel ? 'ready' : 'not_configured'
    });
    return ws;
  },

  async selectLLMModel(workspaceId: string, modelId: string): Promise<Workspace> {
    await agentProfileService.update(workspaceId, { selectedLLMModelId: modelId });
    const ws = await this.update(workspaceId, { selectedLLMModelId: modelId });
    await this.updateSetupProgress(workspaceId, { llmModel: 'ready' });
    return ws;
  },

  async assignStaff(workspaceId: string, staffId: string): Promise<Workspace> {
    const ws = await this.getById(workspaceId);
    if (!ws) throw new Error('Workspace not found');
    const staffIds = Array.from(new Set([...ws.assignedStaffIds, staffId]));
    const updated = await this.update(workspaceId, {
      assignedStaffIds: staffIds,
      staffCount: staffIds.length,
    });
    await this.updateSetupProgress(workspaceId, { staff: 'ready' });
    return updated;
  },

  async removeStaff(workspaceId: string, staffId: string): Promise<Workspace> {
    const ws = await this.getById(workspaceId);
    if (!ws) throw new Error('Workspace not found');
    const staffIds = ws.assignedStaffIds.filter(id => id !== staffId);
    return this.update(workspaceId, {
      assignedStaffIds: staffIds,
      staffCount: staffIds.length,
    });
  },

  async getAssignedStaff(workspaceId: string): Promise<User[]> {
    await delay();
    const ws = await this.getById(workspaceId);
    if (!ws) return [];
    return globalStaffState.filter(s => ws.assignedStaffIds.includes(s.id));
  },

  async getAllGlobalStaff(): Promise<User[]> {
    await delay();
    return [...globalStaffState];
  }
};

export const llmModelService = {
  async getAll(): Promise<LLMModel[]> {
    await delay();
    return [...mockLLMModels];
  },

  async getById(id: string): Promise<LLMModel | null> {
    await delay();
    const model = mockLLMModels.find(m => m.id === id);
    return model ? { ...model } : null;
  }
};

export const agentProfileService = {
  async getByWorkspaceId(workspaceId: string): Promise<AgentProfile | null> {
    await delay();
    const profile = agentProfilesState[workspaceId];
    if (profile) return { ...profile };

    return {
      id: `agent-prof-${workspaceId}`,
      workspaceId,
      name: 'مساعد الذكاء الاصطناعي الأكاديمي',
      description: 'وكيل مخصص للرد على استفسارات الطلاب والتنسيق مع لوائح الكلية.',
      selectedLLMModelId: 'model-gpt4o',
      systemInstructions: 'أنت ممثل رسمي للقسم الجامعي. جاوب باحترافية ودقة استناداً إلى الوثائق المرفقة.',
      temperature: 0.3,
      maxTokens: 1000,
      status: 'active',
      escalationRules: {
        enabled: true,
        confidenceThreshold: 0.75,
        fallbackStaffGroupId: 'staff-general',
        autoCreateSupportCase: true,
      },
      linkedKnowledgeSourceIds: [],
    };
  },

  async update(workspaceId: string, data: Partial<AgentProfile>): Promise<AgentProfile> {
    await delay();
    const current = await this.getByWorkspaceId(workspaceId);
    const updated: AgentProfile = { ...(current as AgentProfile), ...data };
    agentProfilesState[workspaceId] = updated;
    await workspaceService.updateSetupProgress(workspaceId, { agentProfile: 'ready' });
    return updated;
  }
};

export const supportCaseService = {
  async getAll(filter?: { workspaceId?: string; status?: string }): Promise<SupportCase[]> {
    await delay();
    let result = [...supportCasesState];
    if (filter?.workspaceId) {
      result = result.filter(c => c.workspaceId === filter.workspaceId);
    }
    if (filter?.status && filter.status !== 'all') {
      result = result.filter(c => c.status === filter.status);
    }
    return result;
  },

  async create(data: Omit<SupportCase, 'id' | 'caseNumber' | 'createdAt' | 'relativeTime' | 'relativeTimeEn'>): Promise<SupportCase> {
    await delay();
    const newCase: SupportCase = {
      ...data,
      id: `case-${Date.now().toString(36)}`,
      caseNumber: `CAS-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: new Date().toISOString(),
      relativeTime: 'الآن',
      relativeTimeEn: 'Just now',
    };
    supportCasesState = [newCase, ...supportCasesState];
    return newCase;
  },

  async updateStatus(id: string, status: SupportCaseStatus): Promise<SupportCase> {
    await delay();
    const index = supportCasesState.findIndex(c => c.id === id);
    if (index === -1) throw new Error('Support Case not found');
    const updated = { ...supportCasesState[index], status };
    supportCasesState[index] = updated;
    return updated;
  }
};

export const knowledgeService = {
  async getByWorkspaceId(workspaceId: string): Promise<KnowledgeSource[]> {
    await delay();
    return knowledgeSourcesState.filter(k => k.workspaceId === workspaceId);
  },

  async add(item: Omit<KnowledgeSource, 'id' | 'lastIndexedAt'>): Promise<KnowledgeSource> {
    await delay();
    const newSource: KnowledgeSource = {
      ...item,
      id: `kn-${Date.now().toString(36)}`,
      lastIndexedAt: 'الآن',
    };
    knowledgeSourcesState = [newSource, ...knowledgeSourcesState];
    
    // Update workspace knowledge count & setup progress
    const ws = await workspaceService.getById(item.workspaceId);
    if (ws) {
      const currentList = knowledgeSourcesState.filter(k => k.workspaceId === item.workspaceId);
      await workspaceService.update(item.workspaceId, {
        knowledgeSourcesCount: currentList.length,
      });
      await workspaceService.updateSetupProgress(item.workspaceId, { knowledge: 'ready' });
    }

    return newSource;
  },

  async remove(id: string, workspaceId: string): Promise<void> {
    await delay();
    knowledgeSourcesState = knowledgeSourcesState.filter(k => k.id !== id);
    const remaining = knowledgeSourcesState.filter(k => k.workspaceId === workspaceId);
    await workspaceService.update(workspaceId, {
      knowledgeSourcesCount: remaining.length,
    });
    if (remaining.length === 0) {
      await workspaceService.updateSetupProgress(workspaceId, { knowledge: 'not_configured' });
    }
  }
};

export const channelService = {
  async getAll(): Promise<Channel[]> {
    await delay();
    return [...mockChannels];
  }
};

/* --- Simulated Test Chat Service --- */
export const testChatService = {
  async sendTestMessage(
    workspaceId: string,
    messageText: string
  ): Promise<TestChatMessage> {
    await delay(350);
    const ws = await workspaceService.getById(workspaceId);
    const profile = await agentProfileService.getByWorkspaceId(workspaceId);
    const knowledge = await knowledgeService.getByWorkspaceId(workspaceId);
    const assignedStaff = await workspaceService.getAssignedStaff(workspaceId);

    const queryLower = messageText.toLowerCase();

    // Check if the query asks for standard admission / information covered by knowledge base
    const isAnswerable =
      queryLower.includes('متطلبات') ||
      queryLower.includes('شروط') ||
      queryLower.includes('تسجيل') ||
      queryLower.includes('رسوم') ||
      queryLower.includes('admission') ||
      queryLower.includes('requirement') ||
      queryLower.includes('fee') ||
      queryLower.includes('hours') ||
      queryLower.includes('ساعات') ||
      queryLower.includes('مواعيد');

    if (isAnswerable && knowledge.length > 0) {
      // SUCCESSFUL ANSWER using Agent Profile + LLM Model + Knowledge
      const usedDoc = knowledge[0]?.title || 'دليل القبول المعتمد 2026/2027';
      return {
        id: `msg-${Date.now()}`,
        sender: 'agent',
        text: `بناءً على لائحة القسم المعتمدة في (${usedDoc}):
- الحد الأدنى للقبول في البرنامج هو معدل 80% في الثانوية العامة (القسم العلمي).
- تقديم أصل استمارة الثانوية وشهادة المعادلة للشهادات الصادرة من خارج الدولة.
- اجتياز اختبار تحديد المستوى والمقابلة الشخصية المعتمدة.

هل ترغب بمساعدتك في تفاصيل إجراءات التقديم الإلكتروني؟`,
        timestamp: 'الآن',
        sourcesUsed: [usedDoc],
        confidenceScore: 0.94,
        isEscalated: false,
      };
    } else {
      // AGENT CANNOT ANSWER -> ESCALATE TO SUPPORT CASE
      const assignedPerson = assignedStaff[0]?.name;
      const staffName = assignedPerson || undefined;

      // Automatically create Support Case
      const newCase = await supportCaseService.create({
        workspaceId,
        workspaceName: ws?.name || 'القسم الأكاديمي',
        workspaceNameEn: ws?.nameEn || 'Academic Dept',
        studentName: 'طالب في جلسة الاختبار التجريبي',
        actorRole: 'student',
        queryTitle: messageText,
        queryTitleEn: messageText,
        channel: 'live_chat',
        status: assignedPerson ? 'under_review' : 'open',
        priority: 'high',
        assignedStaffName: staffName,
      });

      return {
        id: `msg-${Date.now()}`,
        sender: 'agent',
        text: `عذراً، هذا الاستفسار يتطلب مراجعة بشرية خاصة ولا يتوفر له حكم قاطع في الوثائق المرفقة بقاعدة المعرفة الحالية.

لقد قمت بإنشاء حالة دعم (Support Case) فورية برقم #${newCase.caseNumber}.
${assignedPerson ? `تم تعيين الحالة تلقائياً إلى: ${assignedPerson} لمتابعتها والرد عليك.` : 'الحالة قيد الانتظار في صندوق القسم (لا يوجد موظف مخصص حالياً، تعمل المنصة في وضع الذكاء الاصطناعي المستقل).' }`,
        timestamp: 'الآن',
        confidenceScore: 0.42,
        isEscalated: true,
        escalatedSupportCaseId: newCase.id,
        escalatedStaffName: staffName,
      };
    }
  }
};
