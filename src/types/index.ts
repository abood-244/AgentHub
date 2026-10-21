export type WorkspaceStatus = 'active' | 'paused' | 'archived';
export type SetupStepStatus = 'not_configured' | 'in_progress' | 'configured' | 'ready';

export interface WorkspaceChannelConfig {
  webWidget: {
    enabled: boolean;
    title: string;
    primaryColor: string;
    position: 'bottom-right' | 'bottom-left';
    greeting: string;
  };
  whatsapp: {
    enabled: boolean;
    phoneNumber: string;
    status: 'connected' | 'disconnected' | 'pending';
  };
}

export interface WorkspaceSetupProgress {
  workspaceSettings: SetupStepStatus;
  knowledge: SetupStepStatus;
  agentProfile: SetupStepStatus;
  llmModel: SetupStepStatus;
  staff: SetupStepStatus;
  channels: SetupStepStatus;
  testAgent: SetupStepStatus;
  isReadyForTesting: boolean;
  isLiveReady: boolean;
}

export interface Workspace {
  id: string;
  name: string;
  nameEn: string;
  slug: string;
  description: string;
  descriptionEn: string;
  category: 'admissions' | 'student_affairs' | 'academic' | 'finance' | 'it' | 'hr';
  status: WorkspaceStatus;
  iconName: string;
  themeColor: string;
  knowledgeSourcesCount: number;
  agentsCount: number;
  staffCount: number;
  selectedLLMModelId: string;
  defaultLanguage: 'ar' | 'en';
  assignedStaffIds: string[];
  channelConfig: WorkspaceChannelConfig;
  setupProgress: WorkspaceSetupProgress;
  university_id?: number;
  access_level?: 'admin' | 'member' | 'viewer';
  createdAt: string;
  updatedAt: string;
}

export interface TestChatMessage {
  id: string;
  sender: 'user' | 'agent' | 'system';
  text: string;
  timestamp: string;
  sourcesUsed?: string[];
  confidenceScore?: number;
  isEscalated?: boolean;
  escalatedSupportCaseId?: string;
  escalatedStaffName?: string;
}

export type LLMProvider = 'OpenAI' | 'Anthropic' | 'Meta' | 'DeepSeek' | 'Google';

export interface LLMModel {
  id: string;
  name: string;
  provider: LLMProvider;
  modelIdentifier: string;
  contextWindow: number;
  isEnabled: boolean;
  description: string;
  descriptionEn: string;
  badgeColor: string;
  assignedWorkspacesCount: number;
  isRecommended?: boolean;
}

export interface AgentProfile {
  id: string;
  workspaceId: string;
  name: string;
  description: string;
  selectedLLMModelId: string;
  systemInstructions: string;
  temperature: number;
  maxTokens: number;
  status: 'active' | 'training' | 'inactive';
  escalationRules: {
    enabled: boolean;
    confidenceThreshold: number; // e.g. 0.75
    fallbackStaffGroupId: string;
    autoCreateSupportCase: boolean;
  };
  linkedKnowledgeSourceIds: string[];
}

export type KnowledgeType = 'document' | 'website' | 'faq' | 'database';
export type KnowledgeStatus = 'ready' | 'indexing' | 'error';

export interface KnowledgeSource {
  id: string;
  workspaceId: string;
  title: string;
  titleEn: string;
  type: KnowledgeType;
  status: KnowledgeStatus;
  documentCount: number;
  totalTokens: number;
  sizeFormatted: string;
  lastIndexedAt: string;
}

export type ChannelType = 'website' | 'whatsapp' | 'live_chat' | 'teams';

export interface Channel {
  id: string;
  name: string;
  nameEn: string;
  type: ChannelType;
  isConnected: boolean;
  activeWorkspacesCount: number;
  icon: string;
}

export type SupportCaseStatus = 'open' | 'under_review' | 'resolved' | 'transferred';
export type SupportCasePriority = 'low' | 'medium' | 'high' | 'urgent';
export type ActorRole = 'student' | 'staff' | 'ai';

export interface SupportCase {
  id: string;
  caseNumber: string;
  workspaceId: string;
  workspaceName: string;
  workspaceNameEn: string;
  studentName: string;
  actorRole: ActorRole;
  queryTitle: string;
  queryTitleEn: string;
  channel: ChannelType;
  status: SupportCaseStatus;
  priority: SupportCasePriority;
  relativeTime: string;
  relativeTimeEn: string;
  assignedStaffName?: string;
  resolutionSummary?: string;
  createdAt: string;
}

export interface InboxConversation {
  id: string;
  workspaceId: string;
  workspaceName: string;
  studentName: string;
  lastMessage: string;
  lastMessageEn: string;
  channel: ChannelType;
  timeAgo: string;
  unreadCount: number;
  status: 'open' | 'waiting' | 'resolved';
  handler: 'ai' | 'human';
}

export interface User {
  id: string;
  name: string;
  nameEn: string;
  email: string;
  role: 'system_admin' | 'workspace_manager' | 'staff_member';
  roleLabel: string;
  roleLabelEn: string;
  department: string;
  departmentEn: string;
  avatarUrl?: string;
  assignedWorkspaces: string[];
}

export interface UniversityOrganization {
  nameAr: string;
  nameEn: string;
  roleTitleAr: string;
  roleTitleEn: string;
  unreadNotificationsCount: number;
}

export type ApprovedRole =
  | 'System Administrator'
  | 'Staff'
  | 'Platform Administrator'
  | 'system_admin'
  | 'staff'
  | 'platform_admin'
  | 'platform_administrator'
  | 'system_administrator';
export type ApprovedRoleKey = 'system_administrator' | 'staff' | 'platform_administrator';

export interface InternalUniversity {
  id: number;
  name: string;
  slug: string;
  code: string | null;
}

export interface AuthorizedWorkspace {
  id: number | string;
  name: string;
  slug?: string;
  description?: string | null;
  status: string;
  access_level?: 'admin' | 'member' | 'viewer';
}

export interface InternalUser {
  id: number;
  clerk_user_id: string;
  name: string;
  email: string;
  role: ApprovedRole;
  role_key: ApprovedRoleKey;
  university: InternalUniversity | null;
  workspaces: AuthorizedWorkspace[];
  created_at?: string;
}

export interface UniversityDetails {
  id: number;
  name: string;
  slug: string;
  code: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  website: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ApiWorkspace {
  id: number;
  university_id: number;
  name: string;
  description: string | null;
  status: 'active' | 'paused' | 'archived';
  access_level: 'admin' | 'member' | 'viewer';
  created_at?: string;
  updated_at?: string;
}

