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
import { WorkspaceStatusBadge } from '../../design-system/components/Badge';
import { Tabs, TabItem } from '../../design-system/components/Tabs';
import { Button } from '../../design-system/components/Button';
import { Input } from '../../design-system/components/Input';
import { Card, CardHeader, CardContent, CardFooter } from '../../design-system/components/Card';
import { SupportCaseItem } from '../dashboard/components/SupportCaseItem';
import { WorkspaceSetupCard } from './components/WorkspaceSetupCard';
import { AddKnowledgeModal } from './components/AddKnowledgeModal';
import { AssignStaffModal } from './components/AssignStaffModal';
import { WorkspaceChannelsTab } from './components/WorkspaceChannelsTab';
import { WorkspaceSettingsTab } from './components/WorkspaceSettingsTab';
import { TestChatView } from './components/TestChatView';
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  Database,
  Users,
  MessageSquare,
  LifeBuoy,
  CheckCircle,
  FileText,
  Globe,
  Plus,
  ShieldCheck,
  Cpu,
  Trash2,
  Radio,
  Settings,
  Sparkles,
  Info
} from 'lucide-react';
import { useTranslation } from '../../i18n/LanguageContext';

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
  const isEn = language === 'en';

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [agentProfile, setAgentProfile] = useState<AgentProfile | null>(null);
  const [knowledgeList, setKnowledgeList] = useState<KnowledgeSource[]>([]);
  const [casesList, setCasesList] = useState<SupportCase[]>([]);
  const [assignedStaff, setAssignedStaff] = useState<User[]>([]);
  const [globalModels, setGlobalModels] = useState<LLMModel[]>([]);
  
  // Modals & Sub-views
  const [isAddKnowledgeOpen, setIsAddKnowledgeOpen] = useState(false);
  const [isAssignStaffOpen, setIsAssignStaffOpen] = useState(false);
  const [isTestChatActive, setIsTestChatActive] = useState(false);
  
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveAlert, setShowSaveAlert] = useState(false);

  // Load Workspace data
  const loadWorkspaceData = async () => {
    const ws = await workspaceService.getById(workspaceId);
    if (ws) setWorkspace(ws);

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
  };

  useEffect(() => {
    loadWorkspaceData();
  }, [workspaceId]);

  if (!workspace) {
    return <div className="ah-ws-detail-loading">Loading workspace...</div>;
  }

  const selectedModel = globalModels.find(m => m.id === agentProfile?.selectedLLMModelId) || null;

  // If in interactive Test Chat mode
  if (isTestChatActive && agentProfile) {
    return (
      <TestChatView
        workspace={workspace}
        agentProfile={agentProfile}
        selectedModel={selectedModel}
        onBack={() => setIsTestChatActive(false)}
        onMarkWorkspaceActive={async () => {
          await workspaceService.updateStatus(workspace.id, 'active');
          await loadWorkspaceData();
          setIsTestChatActive(false);
        }}
      />
    );
  }

  const tabs: TabItem[] = [
    { id: 'overview', label: t('tabOverview') },
    { id: 'agent', label: t('tabAgent'), icon: <Bot size={15} /> },
    { id: 'knowledge', label: t('tabKnowledge'), count: knowledgeList.length, icon: <Database size={15} /> },
    { id: 'staff', label: t('tabStaff'), count: assignedStaff.length, icon: <Users size={15} /> },
    { id: 'channels', label: isEn ? 'Channels' : 'القنوات', icon: <Radio size={15} /> },
    { id: 'inbox', label: t('tabInbox'), icon: <MessageSquare size={15} /> },
    { id: 'support-cases', label: t('tabSupportCases'), count: casesList.length, icon: <LifeBuoy size={15} /> },
    { id: 'settings', label: isEn ? 'Settings' : 'الإعدادات', icon: <Settings size={15} /> },
  ];

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
    <div className="ah-ws-detail">
      {/* Top Header & Breadcrumb with Back Arrow */}
      <div className="ah-ws-detail__nav">
        <button
          type="button"
          className="ah-ws-detail__back-btn"
          onClick={onBack}
        >
          {isRTL ? <ArrowRight size={18} /> : <ArrowLeft size={18} />}
          <span>{isEn ? 'Back to Workspaces' : 'العودة لمساحات العمل'}</span>
        </button>
      </div>

      {/* Workspace Banner */}
      <div className="ah-ws-detail__banner">
        <div className="ah-ws-detail__title-col">
          <div className="ah-ws-detail__title-row">
            <h2 className="ah-ws-detail__title">
              {isEn ? workspace.nameEn : workspace.name}
            </h2>
            <WorkspaceStatusBadge
              status={workspace.status}
              label={isEn ? (workspace.status === 'active' ? 'Active' : 'Paused') : undefined}
            />
          </div>
          <p className="ah-ws-detail__description">
            {isEn ? workspace.descriptionEn : workspace.description}
          </p>
        </div>

        {/* Selected Model Pill */}
        <div className="ah-ws-detail__model-badge">
          <Cpu size={16} color="#0066FF" />
          <div className="ah-ws-detail__model-badge-info">
            <span className="ah-ws-detail__model-badge-sub">Selected Global LLM:</span>
            <span className="ah-ws-detail__model-badge-name">
              {selectedModel?.name || 'OpenAI GPT-4o'}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs Row (Wraps cleanly without horizontal scrollbar) */}
      <div className="ah-ws-detail__tabs-box">
        <Tabs
          items={tabs}
          activeId={activeTab}
          onChange={setActiveTab}
          variant="underline"
        />
      </div>

      {/* TAB 1: OVERVIEW (Setup Progress Checklist & Summary) */}
      {activeTab === 'overview' && (
        <div className="ah-ws-overview-tab">
          {/* Setup Progress Checklist Card */}
          <WorkspaceSetupCard
            workspace={workspace}
            onNavigateTab={setActiveTab}
            onOpenTestChat={() => setIsTestChatActive(true)}
          />

          {/* Quick Metrics */}
          <div className="ah-dashboard__kpis">
            <div className="ah-stat-widget">
              <div className="ah-stat-widget__main">
                <span className="ah-stat-widget__label">{t('statKnowledgeSources')}</span>
                <span className="ah-stat-widget__value">{workspace.knowledgeSourcesCount}</span>
              </div>
              <div className="ah-stat-widget__icon-box"><Database size={22} /></div>
            </div>

            <div className="ah-stat-widget">
              <div className="ah-stat-widget__main">
                <span className="ah-stat-widget__label">{t('statAgent')}</span>
                <span className="ah-stat-widget__value">{workspace.agentsCount}</span>
              </div>
              <div className="ah-stat-widget__icon-box"><Bot size={22} /></div>
            </div>

            <div className="ah-stat-widget">
              <div className="ah-stat-widget__main">
                <span className="ah-stat-widget__label">{t('statStaff')}</span>
                <span className="ah-stat-widget__value">{workspace.staffCount}</span>
              </div>
              <div className="ah-stat-widget__icon-box"><Users size={22} /></div>
            </div>

            <div className="ah-stat-widget">
              <div className="ah-stat-widget__main">
                <span className="ah-stat-widget__label">{t('supportStatus')}</span>
                <span className="ah-stat-widget__value">{casesList.length}</span>
              </div>
              <div className="ah-stat-widget__icon-box"><LifeBuoy size={22} /></div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: AGENT PROFILE (Configure Agent & Select Global LLM Model) */}
      {activeTab === 'agent' && agentProfile && (
        <div className="ah-agent-config">
          {showSaveAlert && (
            <div className="ah-alert-success">
              <CheckCircle size={18} />
              <span>{t('savedSuccess')}</span>
            </div>
          )}

          {/* AI Architecture Hierarchy Notice */}
          <div className="ah-arch-notice">
            <div className="ah-arch-notice__icon">
              <Cpu size={22} color="#0066FF" />
            </div>
            <div className="ah-arch-notice__content">
              <h4 className="ah-arch-notice__title">
                {isEn ? 'AI Architecture Relationship' : 'علاقة بنية الذكاء الاصطناعي في AgentHub'}
              </h4>
              <p className="ah-arch-notice__desc">
                {isEn
                  ? 'Global LLM Models → Workspace → Selected LLM Model → Agent Profile → Knowledge Sources (RAG)'
                  : 'النماذج العالمية (Global LLM) ← مساحة العمل ← اختيار النموذج ← تخصيص الوكيل (Agent Profile) ← المعرفة الجامعية (RAG)'}
              </p>
            </div>
            {onNavigateToGlobalModels && (
              <Button
                variant="outline"
                size="sm"
                onClick={onNavigateToGlobalModels}
              >
                {t('navLLMModels')}
              </Button>
            )}
          </div>

          <div className="ah-agent-form-grid">
            {/* Left: Configuration Form */}
            <div className="ah-agent-form-main">
              <Card>
                <CardHeader
                  title={t('agentConfigTitle')}
                  subtitle={t('agentConfigSubtitle')}
                />
                <CardContent>
                  <div className="ah-form-stack">
                    {/* Select Global LLM Model */}
                    <div className="ah-input-group">
                      <label className="ah-input-label">{t('selectedLLMModel')}</label>
                      <div className="ah-model-selector-grid">
                        {globalModels.map(model => {
                          const isSelected = model.id === agentProfile.selectedLLMModelId;
                          return (
                            <div
                              key={model.id}
                              className={`ah-model-option-card ${isSelected ? 'ah-model-option-card--selected' : ''}`}
                              onClick={() => {
                                setAgentProfile({
                                  ...agentProfile,
                                  selectedLLMModelId: model.id,
                                });
                              }}
                            >
                              <div className="ah-model-option__top">
                                <span className="ah-model-option__name">{model.name}</span>
                                <span
                                  className="ah-model-option__provider"
                                  style={{ backgroundColor: `${model.badgeColor}15`, color: model.badgeColor }}
                                >
                                  {model.provider}
                                </span>
                              </div>
                              <p className="ah-model-option__desc">
                                {isEn ? model.descriptionEn : model.description}
                              </p>
                              <div className="ah-model-option__meta">
                                <span>Context: {(model.contextWindow / 1000).toFixed(0)}k tokens</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Agent Name */}
                    <Input
                      label={isEn ? 'Agent Profile Name' : 'اسم الوكيل التفاعلي'}
                      value={agentProfile.name}
                      onChange={e => setAgentProfile({ ...agentProfile, name: e.target.value })}
                    />

                    {/* System Instructions / Prompt */}
                    <div className="ah-input-group">
                      <label className="ah-input-label">{t('systemInstructions')}</label>
                      <textarea
                        className="ah-prompt-textarea"
                        rows={6}
                        value={agentProfile.systemInstructions}
                        onChange={e => setAgentProfile({ ...agentProfile, systemInstructions: e.target.value })}
                        placeholder="Define agent persona, bounds, rules and tone..."
                      />
                    </div>

                    {/* Temperature Slider */}
                    <div className="ah-slider-group">
                      <div className="ah-slider-header">
                        <label className="ah-input-label">{t('temperature')}</label>
                        <span className="ah-slider-val">{agentProfile.temperature}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={agentProfile.temperature}
                        onChange={e => setAgentProfile({ ...agentProfile, temperature: parseFloat(e.target.value) })}
                        className="ah-range-input"
                      />
                      <div className="ah-slider-hints">
                        <span>دقيق ومتوافق تماماً (0.0)</span>
                        <span>إبداعي وتفاعلي (1.0)</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Escalation to Support Cases Rules */}
              <Card>
                <CardHeader
                  title={t('escalationRules')}
                  subtitle={isEn ? 'Automate handover to human staff when confidence is low' : 'التحويل التلقائي لحالة دعم عند تعذر الرد أو انخفاض الثقة'}
                />
                <CardContent>
                  <div className="ah-form-stack">
                    <label className="ah-checkbox-row">
                      <input
                        type="checkbox"
                        checked={agentProfile.escalationRules.autoCreateSupportCase}
                        onChange={e =>
                          setAgentProfile({
                            ...agentProfile,
                            escalationRules: {
                              ...agentProfile.escalationRules,
                              autoCreateSupportCase: e.target.checked,
                            },
                          })
                        }
                      />
                      <span className="ah-checkbox-label">{t('autoCreateCase')}</span>
                    </label>

                    <div className="ah-slider-group">
                      <div className="ah-slider-header">
                        <label className="ah-input-label">{t('confidenceThreshold')}</label>
                        <span className="ah-slider-val">
                          {(agentProfile.escalationRules.confidenceThreshold * 100).toFixed(0)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.5"
                        max="0.95"
                        step="0.05"
                        value={agentProfile.escalationRules.confidenceThreshold}
                        onChange={e =>
                          setAgentProfile({
                            ...agentProfile,
                            escalationRules: {
                              ...agentProfile.escalationRules,
                              confidenceThreshold: parseFloat(e.target.value),
                            },
                          })
                        }
                        className="ah-range-input"
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    variant="primary"
                    isLoading={isSaving}
                    onClick={handleSaveAgent}
                  >
                    {t('saveChanges')}
                  </Button>
                </CardFooter>
              </Card>
            </div>

            {/* Right: Linked Knowledge Sources & Guardrails Summary */}
            <div className="ah-agent-sidebar-cards">
              <Card>
                <CardHeader
                  title={isEn ? 'Linked Knowledge (RAG)' : 'المعرفة المربوطة (RAG)'}
                  action={
                    <Button variant="ghost" size="sm" onClick={() => setActiveTab('knowledge')}>
                      {t('viewAll')}
                    </Button>
                  }
                />
                <CardContent>
                  <div className="ah-linked-kn-list">
                    {knowledgeList.map(kn => (
                      <div key={kn.id} className="ah-linked-kn-item">
                        <FileText size={18} color="#0066FF" />
                        <div className="ah-linked-kn-info">
                          <span className="ah-linked-kn-title">{isEn ? kn.titleEn : kn.title}</span>
                          <span className="ah-linked-kn-sub">{kn.sizeFormatted} • {kn.documentCount} items</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader
                  title={isEn ? 'University Guardrails' : 'حواجز الحماية الجامعية'}
                />
                <CardContent>
                  <div className="ah-guardrail-list">
                    <div className="ah-guardrail-item">
                      <ShieldCheck size={18} color="#12B76A" />
                      <span>حظر الإفصاح عن البيانات الحساسة وأرقام الهوية</span>
                    </div>
                    <div className="ah-guardrail-item">
                      <ShieldCheck size={18} color="#12B76A" />
                      <span>الاستناد فقط للوائح المعتمدة وتجنب التخمين</span>
                    </div>
                    <div className="ah-guardrail-item">
                      <ShieldCheck size={18} color="#12B76A" />
                      <span>تحويل تلقائي لقضايا التظلمات والمنح الاستثنائية</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: KNOWLEDGE (Upload & Manage RAG Sources) */}
      {activeTab === 'knowledge' && (
        <div className="ah-knowledge-section">
          <div className="ah-knowledge-header-bar">
            <div>
              <h3 className="ah-section-title">{t('tabKnowledge')}</h3>
              <p className="ah-section-sub">
                {isEn ? 'University handbooks, policies, and FAQs indexed for retrieval-augmented generation.' : 'اللوائح والأسئلة الشائعة المفهرسة لتمكين الوكيل من الإجابة الدقيقة.'}
              </p>
            </div>
            <Button
              variant="primary"
              icon={<Plus size={16} />}
              onClick={() => setIsAddKnowledgeOpen(true)}
            >
              {t('addKnowledgeSource')}
            </Button>
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
                        <button
                          type="button"
                          className="ah-icon-btn ah-icon-btn--sm"
                          onClick={() => handleDeleteKnowledge(kn.id)}
                          title="Delete source"
                        >
                          <Trash2 size={16} color="#F04438" />
                        </button>
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

      {/* TAB 4: STAFF (Optional Global Staff Assignment) */}
      {activeTab === 'staff' && (
        <div className="ah-ws-staff">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
            <div>
              <h3 className="ah-section-title">{t('tabStaff')} ({assignedStaff.length})</h3>
              <p className="ah-section-sub">
                {isEn
                  ? 'Assign university counselors from the global directory. Staff assignment is optional (AI-only mode is supported).'
                  : 'تعيين الكوادر الجامعية المسجلة مركزياً. تعيين الموظفين اختياري (يدعم القسم وضع الذكاء الاصطناعي المستقل بالكامل).'}
              </p>
            </div>
            <Button
              variant="primary"
              icon={<Plus size={16} />}
              onClick={() => setIsAssignStaffOpen(true)}
            >
              {isEn ? 'Assign Staff Member' : 'تعيين موظف للقسم'}
            </Button>
          </div>

          {assignedStaff.length === 0 && (
            <div style={{
              backgroundColor: 'var(--ah-bg-subtle)',
              border: '1.5px dashed var(--ah-border-strong)',
              borderRadius: '12px',
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
              <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--ah-text-secondary)', maxWidth: 460 }}>
                {isEn
                  ? 'No staff members are assigned. Inquiries will be resolved autonomously by the agent, and escalated cases will queue in the unassigned folder.'
                  : 'لم يتم تعيين كوادر بشرية. سيقوم الوكيل بالإجابة المستقلة على الطلاب، وستُحفظ الحالات غير المحلولة في صندوق الانتظار.'}
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
                        <span style={{ fontSize: '11px', color: 'var(--ah-text-secondary)' }}>
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

      {/* TAB 5: CHANNELS (Web Widget & WhatsApp) */}
      {activeTab === 'channels' && (
        <WorkspaceChannelsTab
          workspace={workspace}
          onUpdated={updated => setWorkspace(updated)}
        />
      )}

      {/* TAB 6: INBOX (Workspace Specific) */}
      {activeTab === 'inbox' && (
        <div className="ah-ws-inbox">
          <h3 className="ah-section-title">{t('tabInbox')}</h3>
          <p className="ah-section-sub">
            {isEn ? `Incoming messages routed to ${workspace.nameEn || workspace.name}` : `صندوق المحادثات الواردة لقسم ${workspace.name}`}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Card>
              <CardContent>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: '#EBF3FE', color: '#0066FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <MessageSquare size={18} />
                    </div>
                    <div>
                      <h4 style={{ margin: '0 0 2px', fontSize: '13.5px', fontWeight: 700 }}>سعود فهد الشمري</h4>
                      <p style={{ margin: 0, fontSize: '12px', color: 'var(--ah-text-secondary)' }}>هل تقبلون التحويل من كلية الهندسة إلى علوم الحاسب؟</p>
                    </div>
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--ah-text-tertiary)' }}>منذ 15 دقيقة</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 7: SUPPORT CASES (Workspace Specific) */}
      {activeTab === 'support-cases' && (
        <div className="ah-ws-cases-section">
          <h3 className="ah-section-title">{t('tabSupportCases')} ({casesList.length})</h3>
          <div className="ah-dashboard__cases-list">
            {casesList.map(item => (
              <SupportCaseItem key={item.id} item={item} />
            ))}
            {casesList.length === 0 && (
              <p className="ah-ws-empty__text">لا توجد حالات دعم مفتوحة حالياً في هذا القسم.</p>
            )}
          </div>
        </div>
      )}

      {/* TAB 8: SETTINGS (Workspace Specific Settings) */}
      {activeTab === 'settings' && (
        <WorkspaceSettingsTab
          workspace={workspace}
          onUpdated={updated => setWorkspace(updated)}
        />
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
