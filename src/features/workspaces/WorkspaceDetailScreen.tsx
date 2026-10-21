import React, { useState, useEffect } from 'react';
import './WorkspaceDetailScreen.css';
import { Workspace, AgentProfile, KnowledgeSource, SupportCase, LLMModel, User } from '../../types';
import {
  workspaceService,
  agentProfileService,
  knowledgeService,
  supportCaseService,
  llmModelService
} from '../../services/apiServices';
import { Button } from '../../design-system/components/Button';
import { Card, CardHeader, CardContent } from '../../design-system/components/Card';
import { Input } from '../../design-system/components/Input';
import { WorkspaceSetupCard } from './components/WorkspaceSetupCard';
import { AddKnowledgeModal } from './components/AddKnowledgeModal';
import { AssignStaffModal } from './components/AssignStaffModal';
import { WorkspaceSettingsTab } from './components/WorkspaceSettingsTab';
import { TestChatView } from './components/TestChatView';
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  Database,
  Users,
  MessageSquare,
  FileText,
  Globe,
  Plus,
  ShieldAlert,
  Trash2,
  ChevronDown,
  ChevronLeft,
  Layers,
} from 'lucide-react';
import { useTranslation } from '../../i18n/LanguageContext';
import { useAgentHubAuth } from '../../context/AuthContext';

export interface WorkspaceDetailScreenProps {
  workspaceId: string;
  onBack: () => void;
  onNavigateToGlobalModels?: () => void;
}

export const WorkspaceDetailScreen: React.FC<WorkspaceDetailScreenProps> = ({
  workspaceId,
  onBack,
  onNavigateToGlobalModels,
}) => {
  const { language, t, isRTL } = useTranslation();
  const { role } = useAgentHubAuth();
  const isEn = language === 'en';

  const isStaff = role === 'Staff' || role === 'staff';

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'chat' | 'knowledge' | 'staff' | 'settings'>('overview');
  const [agentProfile, setAgentProfile] = useState<AgentProfile | null>(null);
  const [knowledgeList, setKnowledgeList] = useState<KnowledgeSource[]>([]);
  const [casesList, setCasesList] = useState<SupportCase[]>([]);
  const [assignedStaff, setAssignedStaff] = useState<User[]>([]);
  const [globalModels, setGlobalModels] = useState<LLMModel[]>([]);

  // Modals & Sub-views
  const [isAddKnowledgeOpen, setIsAddKnowledgeOpen] = useState(false);
  const [isAssignStaffOpen, setIsAssignStaffOpen] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [showSaveAlert, setShowSaveAlert] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [accessError, setAccessError] = useState<string | null>(null);

  // Load Workspace data
  const loadWorkspaceData = async () => {
    setIsLoading(true);
    setAccessError(null);
    try {
      const ws = await workspaceService.getById(workspaceId);
      if (!ws) {
        setAccessError(isEn ? 'Workspace not found.' : 'لم يتم العثور على مساحة العمل المطلوبة.');
        setIsLoading(false);
        return;
      }
      setWorkspace(ws);

      const agent = await agentProfileService.getByWorkspaceId(workspaceId);
      if (agent) setAgentProfile(agent);

      const kn = await knowledgeService.getByWorkspaceId(workspaceId);
      setKnowledgeList(kn);

      const cases = await supportCaseService.getAll({ workspaceId });
      setCasesList(cases);

      const staff = await workspaceService.getAssignedStaff(workspaceId);
      setAssignedStaff(staff);

      const models = await llmModelService.getAll();
      setGlobalModels(models);
    } catch (err: any) {
      if (err?.status === 403) {
        setAccessError(isEn ? 'Access denied: You do not have permission to view this workspace.' : 'غير مصرح: ليس لديك صلاحية للوصول إلى مساحة العمل هذه.');
      } else if (err?.status === 404) {
        setAccessError(isEn ? 'Workspace not found.' : 'لم يتم العثور على مساحة العمل المطلوبة.');
      } else {
        setAccessError(err?.message || (isEn ? 'Failed to load workspace.' : 'حدث خطأ أثناء تحميل بيانات مساحة العمل.'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadWorkspaceData();
  }, [workspaceId]);

  if (accessError) {
    return (
      <div className="ah-ws-detail" style={{ padding: 24, textAlign: 'center' }}>
        <div className="ah-ws-detail__nav">
          <button type="button" className="ah-ws-detail__back-btn" onClick={onBack}>
            {isRTL ? <ArrowRight size={18} /> : <ArrowLeft size={18} />}
            <span>{isEn ? 'Back to Workspaces' : 'العودة لمساحات العمل'}</span>
          </button>
        </div>
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 16,
          padding: 32,
          maxWidth: 500,
          margin: '40px auto',
          boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
          border: '1px solid #E2E8F0',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12,
        }}>
          <ShieldAlert size={48} color="#EF4444" />
          <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#1E293B', margin: 0 }}>
            {isEn ? 'Access Denied' : 'غير مصرح بالوصول'}
          </h3>
          <p style={{ fontSize: '14px', color: '#64748B', lineHeight: 1.6, margin: '4px 0 16px 0' }}>
            {accessError}
          </p>
          <Button variant="primary" onClick={onBack}>
            {isEn ? 'Back to Workspaces' : 'العودة لقائمة مساحات العمل'}
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading || !workspace) {
    return (
      <div style={{ textAlign: 'center', padding: '64px 0', color: '#64748b', fontSize: '14px' }}>
        {isEn ? 'Loading workspace...' : 'جاري تحميل تفاصيل مساحة العمل...'}
      </div>
    );
  }

  const selectedModel = globalModels.find(m => m.id === agentProfile?.selectedLLMModelId) || null;

  const handleSaveAgent = async () => {
    if (!agentProfile) return;
    setIsSaving(true);
    await agentProfileService.update(workspaceId, agentProfile);
    await workspaceService.selectLLMModel(workspaceId, agentProfile.selectedLLMModelId);
    await loadWorkspaceData();
    setIsSaving(false);
    setShowSaveAlert(true);
    setTimeout(() => setShowSaveAlert(false), 3000);
  };

  const handleDeleteKnowledge = async (id: string) => {
    await knowledgeService.remove(id, workspaceId);
    await loadWorkspaceData();
  };

  return (
    <div className="ah-ws-detail" dir="rtl">
      {/* Workspace Hero Header Card matching agenthub_workspace_details */}
      <section className="ah-ws-hero-card">
        <div className="ah-ws-hero-body">
          {/* Workspace Icon Box */}
          <div className="ah-ws-hero-icon-box">
            <svg className="ah-ws-hero-svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3L1 9L12 15L21 10.09V17H23V9M5 13.18V17.18C5 19.94 8.13 22 12 22C15.87 22 19 19.94 19 17.18V13.18L12 17L5 13.18Z" />
            </svg>
          </div>

          {/* Details & Status */}
          <div className="ah-ws-hero-content">
            <div className="ah-ws-hero-top">
              <h2 className="ah-ws-hero-title">
                {isEn ? workspace.nameEn : workspace.name}
              </h2>
              <span className={`ah-ws-hero-badge ${workspace.status === 'active' ? 'ah-ws-hero-badge--active' : 'ah-ws-hero-badge--paused'}`}>
                <span>{isEn ? (workspace.status === 'active' ? 'Active' : 'Paused') : (workspace.status === 'active' ? 'نشط' : 'متوقف')}</span>
                <span className="ah-ws-hero-badge-dot" />
              </span>
            </div>
            <p className="ah-ws-hero-desc">
              {isEn ? workspace.descriptionEn : workspace.description}
            </p>
          </div>
        </div>
      </section>

      {/* Navigation Tabs Bar matching agenthub_workspace_details */}
      <nav className="ah-ws-nav-tabs">
        <button
          type="button"
          className={`ah-ws-nav-tab ${activeTab === 'overview' ? 'ah-ws-nav-tab--active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <span>{isEn ? 'Overview' : 'نظرة عامة'}</span>
          {activeTab === 'overview' && <span className="ah-ws-nav-tab-indicator" />}
        </button>

        <button
          type="button"
          className={`ah-ws-nav-tab ${activeTab === 'chat' ? 'ah-ws-nav-tab--active' : ''}`}
          onClick={() => setActiveTab('chat')}
        >
          <span>{isEn ? 'Chat' : 'الدردشة'}</span>
          {activeTab === 'chat' && <span className="ah-ws-nav-tab-indicator" />}
        </button>

        <button
          type="button"
          className={`ah-ws-nav-tab ${activeTab === 'knowledge' ? 'ah-ws-nav-tab--active' : ''}`}
          onClick={() => setActiveTab('knowledge')}
        >
          <span>{isEn ? 'Knowledge Base' : 'قاعدة المعرفة'}</span>
          {activeTab === 'knowledge' && <span className="ah-ws-nav-tab-indicator" />}
        </button>

        <button
          type="button"
          className={`ah-ws-nav-tab ${activeTab === 'staff' ? 'ah-ws-nav-tab--active' : ''}`}
          onClick={() => setActiveTab('staff')}
        >
          <span>{isEn ? 'Staff' : 'الفريق'}</span>
          {activeTab === 'staff' && <span className="ah-ws-nav-tab-indicator" />}
        </button>

        <button
          type="button"
          className={`ah-ws-nav-tab ${activeTab === 'settings' ? 'ah-ws-nav-tab--active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          <span>{isEn ? 'Settings' : 'الإعدادات'}</span>
          {activeTab === 'settings' && <span className="ah-ws-nav-tab-indicator" />}
        </button>
      </nav>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="ah-ws-overview-content">
          {/* KPI Metrics */}
          <div className="ah-ws-kpi-grid">
            {/* KPI 1: Channels Count */}
            <div className="ah-ws-kpi-card">
              <div className="ah-ws-kpi-info">
                <span className="ah-ws-kpi-label">{isEn ? 'Channels Count' : 'عدد القنوات'}</span>
                <div className="ah-ws-kpi-val-row">
                  <span className="ah-ws-kpi-val">6</span>
                  <span className="ah-ws-kpi-tag">{isEn ? 'Active' : 'نشطة'}</span>
                </div>
              </div>
              <div className="ah-ws-kpi-icon-box">
                <MessageSquare size={22} strokeWidth={2} />
              </div>
            </div>

            {/* KPI 2: Users Count */}
            <div className="ah-ws-kpi-card">
              <div className="ah-ws-kpi-info">
                <span className="ah-ws-kpi-label">{isEn ? 'Users Count' : 'عدد المستخدمين'}</span>
                <div className="ah-ws-kpi-val-row">
                  <span className="ah-ws-kpi-val">{assignedStaff.length || 12}</span>
                  <span className="ah-ws-kpi-tag">↑ 20%</span>
                </div>
              </div>
              <div className="ah-ws-kpi-icon-box">
                <Users size={22} />
              </div>
            </div>
          </div>

          {/* Performance Chart Card */}
          <section className="ah-ws-chart-card">
            <div className="ah-ws-chart-header">
              <div className="ah-ws-chart-title-wrap">
                <h3 className="ah-ws-chart-title">{isEn ? 'Workspace Performance' : 'أداء المساحة'}</h3>
                <span className="ah-ws-chart-badge">+ 18%</span>
              </div>
              <button type="button" className="ah-ws-chart-filter-btn">
                <span>{isEn ? 'Conversations' : 'المحادثات'}</span>
                <ChevronDown size={14} />
              </button>
            </div>

            {/* SVG Line Graph with Gradient */}
            <div className="ah-ws-chart-body">
              <div className="ah-ws-chart-grid-lines">
                <div className="ah-ws-chart-line" />
                <div className="ah-ws-chart-line" />
                <div className="ah-ws-chart-line" />
                <div className="ah-ws-chart-line" />
                <div className="ah-ws-chart-line" />
                <div className="ah-ws-chart-line" />
                <div className="ah-ws-chart-line" />
              </div>

              <svg className="ah-ws-chart-svg" preserveAspectRatio="none" viewBox="0 0 320 80">
                <defs>
                  <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#0878F9" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#0878F9" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path d="M 0,60 L 30,52 L 60,38 L 100,52 L 140,38 L 180,62 L 225,44 L 270,48 L 315,22 L 315,80 L 0,80 Z" fill="url(#chartGradient)" />
                <path d="M 0,60 L 30,52 L 60,38 L 100,52 L 140,38 L 180,62 L 225,44 L 270,48 L 315,22" fill="none" stroke="#0878F9" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
                <circle cx="0" cy="60" fill="#0878F9" r="3.5" stroke="#FFFFFF" strokeWidth="2" />
                <circle cx="30" cy="52" fill="#0878F9" r="3.5" stroke="#FFFFFF" strokeWidth="2" />
                <circle cx="60" cy="38" fill="#0878F9" r="3.5" stroke="#FFFFFF" strokeWidth="2" />
                <circle cx="100" cy="52" fill="#0878F9" r="3.5" stroke="#FFFFFF" strokeWidth="2" />
                <circle cx="140" cy="38" fill="#0878F9" r="3.5" stroke="#FFFFFF" strokeWidth="2" />
                <circle cx="180" cy="62" fill="#0878F9" r="3.5" stroke="#FFFFFF" strokeWidth="2" />
                <circle cx="225" cy="44" fill="#0878F9" r="3.5" stroke="#FFFFFF" strokeWidth="2" />
                <circle cx="270" cy="48" fill="#0878F9" r="3.5" stroke="#FFFFFF" strokeWidth="2" />
                <circle cx="315" cy="22" fill="#0878F9" r="4.5" stroke="#FFFFFF" strokeWidth="2" />
              </svg>

              <div className="ah-ws-chart-labels">
                <span className="ah-ws-chart-label--active">{isEn ? 'Today' : 'اليوم'}</span>
                <span>{isEn ? 'Thu' : 'الخميس'}</span>
                <span>{isEn ? 'Wed' : 'الأربعاء'}</span>
                <span>{isEn ? 'Tue' : 'الثلاثاء'}</span>
                <span>{isEn ? 'Mon' : 'الإثنين'}</span>
                <span>{isEn ? 'Sun' : 'الأحد'}</span>
                <span>{isEn ? 'Sat' : 'السبت'}</span>
              </div>
            </div>
          </section>

          {/* Workspace Components List */}
          <section className="ah-ws-components-section">
            <div className="ah-ws-components-header">
              <h3 className="ah-ws-components-title">{isEn ? 'Workspace Components' : 'مكونات المساحة'}</h3>
              <button
                type="button"
                className="ah-ws-components-link"
                onClick={() => setActiveTab('settings')}
              >
                {isEn ? 'View all' : 'عرض الكل'}
              </button>
            </div>

            {/* Component 1: Agent Profile */}
            <div
              className="ah-ws-component-card"
              onClick={() => setActiveTab('settings')}
              role="button"
              tabIndex={0}
            >
              <div className="ah-ws-component-info-wrap">
                <div className="ah-ws-component-icon ah-ws-component-icon--blue">
                  <Bot size={22} />
                </div>
                <div>
                  <h4 className="ah-ws-component-title">{isEn ? 'Agent Profile Settings' : 'إعدادات Agent Profile'}</h4>
                  <p className="ah-ws-component-desc">{isEn ? 'Customize AI persona and behavior' : 'تخصيص هوية وسلوك الوكيل الذكي'}</p>
                </div>
              </div>
              <div className="ah-ws-component-meta">
                <span className="ah-ws-component-status-tag">{isEn ? 'Active' : 'مفعل'}</span>
                <ChevronLeft size={16} className="ah-ws-component-chevron" />
              </div>
            </div>

            {/* Component 2: Knowledge Base */}
            <div
              className="ah-ws-component-card"
              onClick={() => setActiveTab('knowledge')}
              role="button"
              tabIndex={0}
            >
              <div className="ah-ws-component-info-wrap">
                <div className="ah-ws-component-icon ah-ws-component-icon--purple">
                  <Database size={22} />
                </div>
                <div>
                  <h4 className="ah-ws-component-title">{isEn ? 'Knowledge Base' : 'قاعدة المعرفة'}</h4>
                  <p className="ah-ws-component-desc">{isEn ? 'Manage information sources and handbooks' : 'إدارة مصادر المعلومات والمستندات'}</p>
                </div>
              </div>
              <div className="ah-ws-component-meta">
                <span className="ah-ws-component-status-tag">{isEn ? 'Updated' : 'محدثة'}</span>
                <ChevronLeft size={16} className="ah-ws-component-chevron" />
              </div>
            </div>

            {/* Component 3: Chat and Conversations */}
            <div
              className="ah-ws-component-card"
              onClick={() => setActiveTab('chat')}
              role="button"
              tabIndex={0}
            >
              <div className="ah-ws-component-info-wrap">
                <div className="ah-ws-component-icon ah-ws-component-icon--orange">
                  <MessageSquare size={22} />
                </div>
                <div>
                  <h4 className="ah-ws-component-title">{isEn ? 'Chat & Conversations' : 'الدردشة والمحادثات'}</h4>
                  <p className="ah-ws-component-desc">{isEn ? 'Manage live student sessions and queries' : 'إدارة الجلسات الحية والرسائل'}</p>
                </div>
              </div>
              <div className="ah-ws-component-meta">
                <span className="ah-ws-component-status-tag">{isEn ? 'Connected' : 'متصل'}</span>
                <ChevronLeft size={16} className="ah-ws-component-chevron" />
              </div>
            </div>
          </section>

          {/* Action Button: Manage Components */}
          <div className="ah-ws-manage-action">
            <button
              type="button"
              className="ah-ws-manage-cta"
              onClick={() => setActiveTab('settings')}
            >
              <span>{isEn ? 'Manage Workspace Components' : 'إدارة مكونات المساحة'}</span>
              <Layers size={18} />
            </button>
          </div>

          {/* Setup Progress Checklist Card */}
          <WorkspaceSetupCard
            workspace={workspace}
            onNavigateTab={tab => {
              if (tab === 'agent' || tab === 'channels') setActiveTab('settings');
              else if (tab === 'knowledge') setActiveTab('knowledge');
              else if (tab === 'staff') setActiveTab('staff');
            }}
            onOpenTestChat={!isStaff ? () => setActiveTab('chat') : undefined}
          />
        </div>
      )}

      {/* TAB 2: CHAT */}
      {activeTab === 'chat' && agentProfile && (
        <div className="ah-ws-chat-container">
          <TestChatView
            workspace={workspace}
            agentProfile={agentProfile}
            selectedModel={selectedModel}
            onBack={() => setActiveTab('overview')}
            onMarkWorkspaceActive={async () => {
              await workspaceService.updateStatus(workspace.id, 'active');
              await loadWorkspaceData();
            }}
          />
        </div>
      )}

      {/* TAB 3: KNOWLEDGE BASE */}
      {activeTab === 'knowledge' && (
        <div className="ah-knowledge-section">
          <div className="ah-knowledge-header-bar">
            <div>
              <h3 className="ah-section-title">{isEn ? 'Knowledge Base' : 'قاعدة المعرفة'}</h3>
              <p className="ah-section-sub">
                {isEn ? 'University handbooks, policies, and FAQs indexed for retrieval-augmented generation.' : 'اللوائح والأسئلة الشائعة المفهرسة لتمكين الوكيل من الإجابة الدقيقة.'}
              </p>
            </div>
            {!isStaff && (
              <Button
                variant="primary"
                icon={<Plus size={16} />}
                onClick={() => setIsAddKnowledgeOpen(true)}
              >
                {t('addKnowledgeSource')}
              </Button>
            )}
          </div>

          <div className="ah-knowledge-grid">
            {knowledgeList.map(kn => (
              <Card key={kn.id}>
                <CardContent>
                  <div className="ah-kn-card-content">
                    <div className="ah-kn-icon-box">
                      {kn.type === 'document' ? <FileText size={24} color="#0066FF" /> : <Globe size={24} color="#12B76A" />}
                    </div>
                    <div className="ah-kn-info" style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                        <h4 className="ah-kn-title">{isEn ? kn.titleEn : kn.title}</h4>
                        {!isStaff && (
                          <button
                            type="button"
                            className="ah-icon-btn ah-icon-btn--sm"
                            onClick={() => handleDeleteKnowledge(kn.id)}
                            title="Delete source"
                          >
                            <Trash2 size={16} color="#F04438" />
                          </button>
                        )}
                      </div>
                      <div className="ah-kn-tags">
                        <span className="ah-kn-tag">{kn.type.toUpperCase()}</span>
                        <span className="ah-kn-tag">{kn.sizeFormatted}</span>
                        <span className="ah-kn-tag">{kn.totalTokens.toLocaleString()} tokens</span>
                      </div>
                      <span className="ah-kn-indexed">{t('lastIndexed')}: {kn.lastIndexedAt}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {knowledgeList.length === 0 && (
              <div className="ah-ws-empty" style={{ gridColumn: '1 / -1' }}>
                <p className="ah-ws-empty__text">
                  {isEn ? 'No knowledge sources added yet. Click Add Knowledge Source to upload handbooks.' : 'لم يتم إضافة مصادر معرفة بعد. انقر على إضافة مصدر معرفة لرفع اللوائح.'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: STAFF */}
      {activeTab === 'staff' && (
        <div className="ah-ws-staff">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
            <div>
              <h3 className="ah-section-title">{isEn ? 'Assigned Staff' : 'فريق العمل'} ({assignedStaff.length})</h3>
              <p className="ah-section-sub">
                {isEn
                  ? 'Assign university counselors from the global directory. Staff assignment is optional (AI-only mode is supported).'
                  : 'تعيين الكوادر الجامعية المسجلة مركزياً. تعيين الموظفين اختياري (يدعم القسم وضع الذكاء الاصطناعي المستقل بالكامل).'}
              </p>
            </div>
            {!isStaff && (
              <Button
                variant="primary"
                icon={<Plus size={16} />}
                onClick={() => setIsAssignStaffOpen(true)}
              >
                {isEn ? 'Assign Staff Member' : 'تعيين موظف للقسم'}
              </Button>
            )}
          </div>

          {assignedStaff.length === 0 && (
            <div style={{
              backgroundColor: '#f8fafc',
              border: '1.5px dashed #cbd5e1',
              borderRadius: '16px',
              padding: '24px 18px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8
            }}>
              <Users size={32} color="#0066FF" />
              <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700 }}>
                {isEn ? 'Operating in AI-Only Mode' : 'يعمل القسم في وضع الذكاء الاصطناعي الكامل'}
              </h4>
              <p style={{ margin: 0, fontSize: '12.5px', color: '#64748b', maxWidth: 460 }}>
                {isEn
                  ? 'No staff members are assigned. Inquiries will be resolved autonomously by the agent.'
                  : 'لم يتم تعيين كوادر بشرية. سيقوم الوكيل بالإجابة المستقلة على الطلاب.'}
              </p>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
            {assignedStaff.map(staff => (
              <Card key={staff.id}>
                <CardContent>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <img
                        src={staff.avatarUrl}
                        alt={staff.name}
                        style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }}
                      />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span style={{ fontSize: '13.5px', fontWeight: 700 }}>
                          {isEn ? staff.nameEn : staff.name}
                        </span>
                        <span style={{ fontSize: '11px', color: '#64748b' }}>
                          {isEn ? staff.roleLabelEn : staff.roleLabel}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: SETTINGS */}
      {activeTab === 'settings' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Workspace Settings (Name, Description, Status) */}
          <WorkspaceSettingsTab
            workspace={workspace}
            onUpdated={updated => setWorkspace(updated)}
          />

          {/* Agent Configuration within Settings for Full Admin Control */}
          {agentProfile && !isStaff && (
            <Card>
              <CardHeader
                title={isEn ? 'Agent Configuration' : 'تخصيص الوكيل الذكي (Agent Profile)'}
                subtitle={isEn ? 'Select model and system prompt for this workspace' : 'تحديد النموذج والتوجيهات والحرارة لهذا القسم'}
              />
              <CardContent>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {showSaveAlert && (
                    <div className="ah-alert-success">
                      <span>{t('savedSuccess')}</span>
                    </div>
                  )}

                  {/* Agent Name */}
                  <Input
                    label={isEn ? 'Agent Name' : 'اسم الوكيل'}
                    value={agentProfile.name}
                    onChange={e => setAgentProfile({ ...agentProfile, name: e.target.value })}
                  />

                  {/* System Instructions */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                      {isEn ? 'System Instructions' : 'توجيهات النظام (System Prompt)'}
                    </label>
                    <textarea
                      rows={5}
                      value={agentProfile.systemInstructions}
                      onChange={e => setAgentProfile({ ...agentProfile, systemInstructions: e.target.value })}
                      style={{
                        padding: 12,
                        borderRadius: 12,
                        border: '1px solid #cbd5e1',
                        fontSize: '13px',
                        outline: 'none',
                        fontFamily: 'inherit'
                      }}
                    />
                  </div>

                  <Button
                    variant="primary"
                    isLoading={isSaving}
                    onClick={handleSaveAgent}
                  >
                    {t('saveChanges')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Add Knowledge Modal */}
      <AddKnowledgeModal
        isOpen={isAddKnowledgeOpen}
        workspaceId={workspace.id}
        onClose={() => setIsAddKnowledgeOpen(false)}
        onAdded={() => loadWorkspaceData()}
      />

      {/* Assign Staff Modal */}
      <AssignStaffModal
        isOpen={isAssignStaffOpen}
        workspaceId={workspace.id}
        assignedStaffIds={workspace.assignedStaffIds}
        onClose={() => setIsAssignStaffOpen(false)}
        onStaffUpdated={() => loadWorkspaceData()}
      />
    </div>
  );
};
