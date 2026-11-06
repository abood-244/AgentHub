import React, { useEffect, useState } from 'react';
import { useTranslation } from '../../../i18n/LanguageContext';
import { apiClient } from '../../../services/apiClient';
import {
  Bot,
  Sparkles,
  Cpu,
  Sliders,
  Database,
  Ticket,
  Users,
  CheckCircle2,
  AlertCircle,
  Eye,
  Save,
  X,
  FileText,
  Flame,
  HelpCircle,
  ShieldCheck,
  Check,
} from 'lucide-react';
import './AgentProfileView.css';

interface LlmModel {
  id: number;
  name: string;
  provider: string;
  model_identifier: string;
  is_enabled: boolean;
  is_recommended: boolean;
  badge_color: string;
  description: string;
  description_en: string;
}

interface StaffMember {
  id: number;
  name: string;
  email: string;
  role?: string;
}

interface AgentProfileData {
  id?: number;
  name: string;
  description: string;
  system_instructions: string;
  selected_llm_model_id: number | null;
  temperature: number;
  max_tokens: number;
  use_knowledge_base: boolean;
  support_case_auto_create: boolean;
  support_case_conditions: string;
  staff_auto_assign: boolean;
  auto_assign_staff_ids: number[];
  status: string;
  llm_model?: LlmModel | null;
}

const defaultProfile: AgentProfileData = {
  name: '',
  description: '',
  system_instructions: '',
  selected_llm_model_id: null,
  temperature: 0.7,
  max_tokens: 2048,
  use_knowledge_base: true,
  support_case_auto_create: false,
  support_case_conditions: '',
  staff_auto_assign: false,
  auto_assign_staff_ids: [],
  status: 'active',
};

interface AgentProfileViewProps {
  workspaceId: string;
}

type TabType = 'identity' | 'model' | 'routing';

export const AgentProfileView: React.FC<AgentProfileViewProps> = ({ workspaceId }) => {
  const { language } = useTranslation();
  const isEn = language === 'en';

  const [profile, setProfile] = useState<AgentProfileData>(defaultProfile);
  const [exists, setExists] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [llmModels, setLlmModels] = useState<LlmModel[]>([]);
  const [workspaceStaff, setWorkspaceStaff] = useState<StaffMember[]>([]);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Active Tab
  const [activeTab, setActiveTab] = useState<TabType>('identity');

  // Preview Modal
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, [workspaceId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [profileRes, modelsRes, membersRes] = await Promise.all([
        apiClient.get<{ data: AgentProfileData | null; exists: boolean }>(`/workspaces/${workspaceId}/agent-profile`),
        apiClient.get<{ data: LlmModel[] }>('/llm-models?enabled=true'),
        apiClient.get<{ members: { user: StaffMember }[] }>(`/workspaces/${workspaceId}/members`).catch(() => ({ members: [] })),
      ]);

      if (profileRes.data && profileRes.exists) {
        setProfile({
          ...profileRes.data,
          auto_assign_staff_ids: profileRes.data.auto_assign_staff_ids || [],
        });
        setExists(true);
      }
      setLlmModels(modelsRes.data || []);
      if (membersRes.members) {
        setWorkspaceStaff(membersRes.members.map((m) => m.user));
      }
    } catch (err: any) {
      console.error('Failed to load agent profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStaffId = (staffId: number) => {
    const current = profile.auto_assign_staff_ids || [];
    if (current.includes(staffId)) {
      setProfile({
        ...profile,
        auto_assign_staff_ids: current.filter((id) => id !== staffId),
      });
    } else {
      setProfile({
        ...profile,
        auto_assign_staff_ids: [...current, staffId],
      });
    }
  };

  const handleSelectAllStaff = () => {
    const allIds = workspaceStaff.map((s) => s.id);
    setProfile({
      ...profile,
      auto_assign_staff_ids: allIds,
    });
  };

  const handleDeselectAllStaff = () => {
    setProfile({
      ...profile,
      auto_assign_staff_ids: [],
    });
  };

  // Preset Prompts for instant one-click template application
  const applyPromptPreset = (type: 'academic' | 'admission' | 'support') => {
    if (type === 'academic') {
      setProfile((prev) => ({
        ...prev,
        system_instructions: isEn
          ? 'You are an intelligent Academic Advisor AI for university students. Provide precise guidance regarding courses, graduation requirements, academic plans, and registration policies using the official university knowledge base. Always maintain an encouraging, academic tone, and clearly refer students to their academic department for unverified matters.'
          : 'أنت المرشد الأكاديمي الذكي لطلاب الجامعة. مهمتك تقديم إرشادات أكاديمية دقيقة حول الخطط الدراسية، متطلبات التخرج، شروط تسجيل المواد، واللوائح الأكاديمية بالاعتماد الحصري على قاعدة المعرفة الجامعية المعتمدة. تحدث بلباقة وأسلوب أكاديمي راقٍ، ووجه الطالب لمراجعة رئيس القسم في الحالات الاستثنائية.',
      }));
    } else if (type === 'admission') {
      setProfile((prev) => ({
        ...prev,
        system_instructions: isEn
          ? 'You are the official Admissions and Registration AI Assistant. Assist prospective and enrolled students with admission requirements, tuition fees, application deadlines, and required documentation based on university guidelines. Be welcoming, concise, and helpful.'
          : 'أنت المساعد الذكي المعتمد لشؤون القبول والتسجيل. تهدف إلى مساعدة الطلبة المستجدين والمقيدين في الإجابة عن شروط القبول، نسب القبول بالبرامج، الرسوم والمواعيد، والوثائق المطلوبة بدقة ووضوح. كن ودوداً ومباشراً وقدم إجابات مرتبة مدعمة بالشروط الرسمية.',
      }));
    } else {
      setProfile((prev) => ({
        ...prev,
        system_instructions: isEn
          ? 'You are the University Technical & Student Support Specialist. Help users troubleshoot portal issues, resolve inquiries, and explain university digital services. If an issue requires manual intervention, clarify the next steps and transfer the ticket to human support.'
          : 'أنت مسؤول الدعم الفني وخدمات الطلبة الذكي في الجامعة. ساعد المستخدمين في حل مشاكل البوابة الإلكترونية، توضيح الخدمات الجامعية الرقمية، وتلقي الاستفسارات الفنية. في حال تطلبت المشكلة تدخلاً برمجياً أو مالياً، قم بتوضيح الإجراء وأنشئ تذكرة دعم فني للموظف المختص.',
      }));
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!profile.name.trim()) {
      setMessage({ type: 'error', text: isEn ? 'Agent name is required' : 'اسم الوكيل مطلوب' });
      setActiveTab('identity');
      return;
    }

    try {
      setSaving(true);
      setMessage(null);

      const payload = {
        name: profile.name.trim(),
        description: profile.description?.trim() || null,
        system_instructions: profile.system_instructions?.trim() || null,
        selected_llm_model_id: profile.selected_llm_model_id,
        temperature: profile.temperature,
        max_tokens: profile.max_tokens,
        use_knowledge_base: profile.use_knowledge_base,
        support_case_auto_create: profile.support_case_auto_create,
        support_case_conditions: profile.support_case_conditions?.trim() || null,
        staff_auto_assign: profile.staff_auto_assign,
        auto_assign_staff_ids: profile.staff_auto_assign ? profile.auto_assign_staff_ids : [],
        status: profile.status,
      };

      if (exists) {
        const res = await apiClient.put<{ data: AgentProfileData }>(
          `/workspaces/${workspaceId}/agent-profile`,
          payload
        );
        setProfile({
          ...res.data,
          auto_assign_staff_ids: res.data.auto_assign_staff_ids || [],
        });
      } else {
        const res = await apiClient.post<{ data: AgentProfileData }>(
          `/workspaces/${workspaceId}/agent-profile`,
          payload
        );
        setProfile({
          ...res.data,
          auto_assign_staff_ids: res.data.auto_assign_staff_ids || [],
        });
        setExists(true);
      }

      setMessage({
        type: 'success',
        text: isEn
          ? 'Agent profile settings saved and active in the database!'
          : 'تم حفظ وتطبيق إعدادات ملف الوكيل بنجاح في قاعدة البيانات!',
      });
      setTimeout(() => setMessage(null), 4000);
    } catch (err: any) {
      console.error('Failed to save profile:', err);
      setMessage({
        type: 'error',
        text: err.message || (isEn ? 'Failed to save changes' : 'فشل حفظ الإعدادات في الخادم'),
      });
    } finally {
      setSaving(false);
    }
  };

  const selectedModelObj = llmModels.find((m) => m.id === profile.selected_llm_model_id);

  if (loading) {
    return (
      <div className="ws-view-loading">
        <div className="ws-view-spinner" />
        <p>{isEn ? 'Loading agent profile...' : 'جاري تحميل ملف الوكيل...'}</p>
      </div>
    );
  }

  return (
    <div className="ws-profile-container" dir="rtl">
      {/* ── 1. Top Executive Banner ── */}
      <div className="ws-profile-hero">
        <div className="ws-profile-hero__main">
          <div className="ws-profile-hero__avatar">
            <Bot size={28} className="ws-profile-hero__avatar-icon" />
            <span
              className={`ws-profile-hero__dot ${
                profile.status === 'active' ? 'ws-profile-hero__dot--active' : ''
              }`}
            />
          </div>

          <div className="ws-profile-hero__meta">
            <div className="ws-profile-hero__title-row">
              <h1 className="ws-profile-hero__title">
                {profile.name || (isEn ? 'Unnamed Agent' : 'وكيل غير مسمى')}
              </h1>
              <span
                className={`ws-profile-hero__status-badge ws-profile-hero__status-badge--${profile.status}`}
              >
                {profile.status === 'active'
                  ? isEn ? 'Active' : 'نشط'
                  : profile.status === 'training'
                  ? isEn ? 'Training Mode' : 'وضع التدريب'
                  : isEn ? 'Inactive' : 'متوقف'}
              </span>
            </div>
            <p className="ws-profile-hero__subtitle">
              {profile.description ||
                (isEn
                  ? 'Configure system instructions, LLM routing, and automated case creation.'
                  : 'تحديد سلوك الوكيل الذكي، تعليمات النظام، نموذج LLM المعتمد، وقواعد أتمتة الدعم.')}
            </p>
          </div>
        </div>

        <div className="ws-profile-hero__actions">
          {/* Quick Preview Modal Trigger */}
          <button
            type="button"
            className="ws-profile-btn ws-profile-btn--outline"
            onClick={() => setIsPreviewModalOpen(true)}
            title={isEn ? 'Preview Agent Card' : 'معاينة البطاقة الذكية'}
          >
            <Eye size={16} />
            <span>{isEn ? 'Agent Card' : 'بطاقة الوكيل'}</span>
          </button>

          {/* Save Button */}
          <button
            type="button"
            className="ws-profile-btn ws-profile-btn--primary"
            onClick={() => handleSave()}
            disabled={saving || !profile.name.trim()}
          >
            {saving ? (
              <>
                <div className="ws-btn-spinner" />
                <span>{isEn ? 'Saving...' : 'جاري الحفظ...'}</span>
              </>
            ) : (
              <>
                <Save size={16} />
                <span>{isEn ? 'Save Changes' : 'حفظ التعديلات'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Alert Messages ── */}
      {message && (
        <div className={`ws-profile-alert ws-profile-alert--${message.type}`}>
          {message.type === 'success' ? (
            <CheckCircle2 size={18} className="ws-profile-alert__icon" />
          ) : (
            <AlertCircle size={18} className="ws-profile-alert__icon" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* ── 2. Navigation Tabs ── */}
      <div className="ws-profile-tabs">
        <button
          type="button"
          className={`ws-profile-tab ${activeTab === 'identity' ? 'ws-profile-tab--active' : ''}`}
          onClick={() => setActiveTab('identity')}
        >
          <Bot size={17} />
          <span>{isEn ? 'Identity & Prompts' : 'الهوية وتعليمات النظام'}</span>
        </button>

        <button
          type="button"
          className={`ws-profile-tab ${activeTab === 'model' ? 'ws-profile-tab--active' : ''}`}
          onClick={() => setActiveTab('model')}
        >
          <Cpu size={17} />
          <span>{isEn ? 'LLM Model & Parameters' : 'النموذج والمعايير (LLM)'}</span>
          {selectedModelObj && (
            <span className="ws-profile-tab__tag">{selectedModelObj.name}</span>
          )}
        </button>

        <button
          type="button"
          className={`ws-profile-tab ${activeTab === 'routing' ? 'ws-profile-tab--active' : ''}`}
          onClick={() => setActiveTab('routing')}
        >
          <Ticket size={17} />
          <span>{isEn ? 'Support & Escalation' : 'أتمتة الدعم والإسناد'}</span>
          {profile.support_case_auto_create && (
            <span className="ws-profile-tab__dot" />
          )}
        </button>
      </div>

      {/* ── 3. Tab Contents ── */}
      <form onSubmit={handleSave} className="ws-profile-form">
        {/* ── TAB 1: IDENTITY & SYSTEM PROMPTS ── */}
        {activeTab === 'identity' && (
          <div className="ws-tab-pane">
            {/* Identity Card */}
            <div className="ws-profile-card">
              <div className="ws-card-header">
                <div>
                  <h3 className="ws-card-title">
                    {isEn ? 'Agent Identity & Scope' : 'هوية الوكيل والدور العام'}
                  </h3>
                  <p className="ws-card-subtitle">
                    {isEn
                      ? 'Define the official name, audience summary, and availability status.'
                      : 'تحديد الاسم الرسمي للوكيل الذكي، ملخص مهامه، وحالته التشغيلية.'}
                  </p>
                </div>
              </div>

              <div className="ws-form-grid">
                <div className="ws-profile-group">
                  <label className="ws-profile-label">
                    {isEn ? 'Agent Name' : 'اسم الوكيل'} <span className="ws-required">*</span>
                  </label>
                  <input
                    type="text"
                    className="ws-profile-input"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    placeholder={
                      isEn
                        ? 'e.g. University Admissions Assistant'
                        : 'مثال: المساعد الذكي لشؤون القبول والتسجيل'
                    }
                    required
                  />
                </div>

                <div className="ws-profile-group">
                  <label className="ws-profile-label">
                    {isEn ? 'Operational Status' : 'الحالة التشغيلية'}
                  </label>
                  <div className="ws-status-segmented">
                    <button
                      type="button"
                      className={`ws-status-seg-btn ${
                        profile.status === 'active' ? 'ws-status-seg-btn--active' : ''
                      }`}
                      onClick={() => setProfile({ ...profile, status: 'active' })}
                    >
                      <span className="ws-seg-dot ws-seg-dot--green" />
                      <span>{isEn ? 'Active' : 'نشط للمستخدمين'}</span>
                    </button>
                    <button
                      type="button"
                      className={`ws-status-seg-btn ${
                        profile.status === 'training' ? 'ws-status-seg-btn--training' : ''
                      }`}
                      onClick={() => setProfile({ ...profile, status: 'training' })}
                    >
                      <span className="ws-seg-dot ws-seg-dot--amber" />
                      <span>{isEn ? 'Training Mode' : 'وضع التدريب فقط'}</span>
                    </button>
                    <button
                      type="button"
                      className={`ws-status-seg-btn ${
                        profile.status === 'inactive' ? 'ws-status-seg-btn--inactive' : ''
                      }`}
                      onClick={() => setProfile({ ...profile, status: 'inactive' })}
                    >
                      <span className="ws-seg-dot ws-seg-dot--gray" />
                      <span>{isEn ? 'Inactive' : 'متوقف مؤقتاً'}</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="ws-profile-group" style={{ marginTop: 14 }}>
                <label className="ws-profile-label">
                  {isEn ? 'Agent Description / Scope' : 'وصف مختصر لمهام الوكيل'}
                </label>
                <textarea
                  className="ws-profile-textarea"
                  value={profile.description}
                  onChange={(e) => setProfile({ ...profile, description: e.target.value })}
                  placeholder={
                    isEn
                      ? 'Explain the main purpose of this agent in the workspace...'
                      : 'وضح الغرض الرئيسي للوكيل داخل هذه المساحة ونطاق اختصاصه...'
                  }
                  rows={2}
                />
              </div>
            </div>

            {/* System Prompt Card */}
            <div className="ws-profile-card">
              <div className="ws-card-header ws-card-header--between">
                <div>
                  <h3 className="ws-card-title">
                    {isEn ? 'System Instructions (Prompt)' : 'تعليمات النظام (System Prompt)'}
                  </h3>
                  <p className="ws-card-subtitle">
                    {isEn
                      ? 'Governs agent persona, tone, rules, and handling of missing information.'
                      : 'تتحكم في شخصية الوكيل، أسلوب الرد، حدود الصلاحية، وقواعد التصرف عند غياب المعلومة.'}
                  </p>
                </div>

                {/* Prompt Presets Quick Selector */}
                <div className="ws-preset-wrap">
                  <span className="ws-preset-label">
                    <Sparkles size={14} />
                    <span>{isEn ? 'Quick Presets:' : 'قوالب جاهزة:'}</span>
                  </span>
                  <div className="ws-preset-buttons">
                    <button
                      type="button"
                      className="ws-preset-btn"
                      onClick={() => applyPromptPreset('admission')}
                    >
                      {isEn ? 'Admissions' : 'قبول وتسجيل'}
                    </button>
                    <button
                      type="button"
                      className="ws-preset-btn"
                      onClick={() => applyPromptPreset('academic')}
                    >
                      {isEn ? 'Academic Advisor' : 'مرشد أكاديمي'}
                    </button>
                    <button
                      type="button"
                      className="ws-preset-btn"
                      onClick={() => applyPromptPreset('support')}
                    >
                      {isEn ? 'IT Support' : 'دعم فني'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="ws-profile-group">
                <div className="ws-textarea-wrapper">
                  <textarea
                    className="ws-profile-textarea ws-profile-textarea--prompt"
                    value={profile.system_instructions}
                    onChange={(e) =>
                      setProfile({ ...profile, system_instructions: e.target.value })
                    }
                    placeholder={
                      isEn
                        ? 'Enter instructions for the AI agent (e.g. You are an academic advisor...)'
                        : 'اكتب تعليمات النظام هنا (مثال: أنت مرشد أكاديمي ذكي، أجب بلباقة بالاعتماد على قاعدة المعرفة...)'
                    }
                    rows={8}
                  />
                  <div className="ws-textarea-stats">
                    <span>
                      {profile.system_instructions
                        ? profile.system_instructions.length
                        : 0}{' '}
                      {isEn ? 'characters' : 'حرف'}
                    </span>
                    <span>
                      {profile.system_instructions
                        ? profile.system_instructions.trim().split(/\s+/).filter(Boolean).length
                        : 0}{' '}
                      {isEn ? 'words' : 'كلمة'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Knowledge Base Toggle */}
              <div className="ws-profile-toggle-card">
                <label className="ws-toggle-label">
                  <input
                    type="checkbox"
                    className="ws-toggle-checkbox"
                    checked={profile.use_knowledge_base}
                    onChange={(e) =>
                      setProfile({ ...profile, use_knowledge_base: e.target.checked })
                    }
                  />
                  <div className="ws-toggle-slider" />
                  <div className="ws-toggle-info">
                    <div className="ws-toggle-title">
                      <Database size={16} />
                      <strong>
                        {isEn
                          ? 'Enforce Workspace Knowledge Base (RAG)'
                          : 'إلزام الوكيل بالاعتماد على قاعدة المعرفة (RAG)'}
                      </strong>
                    </div>
                    <p className="ws-toggle-desc">
                      {isEn
                        ? 'When enabled, the agent strictly references documents and vector chunks uploaded to this workspace.'
                        : 'عند التفعيل، يعتمد الوكيل حصراً على الوثائق والمستندات المرفوعة في قاعدة المعرفة لهذه المساحة لتوليد الإجابات الموثوقة.'}
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 2: LLM MODEL & PARAMETERS ── */}
        {activeTab === 'model' && (
          <div className="ws-tab-pane">
            <div className="ws-profile-card">
              <div className="ws-card-header">
                <div>
                  <h3 className="ws-card-title">
                    {isEn ? 'Select Large Language Model (LLM)' : 'اختيار نموذج الذكاء الاصطناعي'}
                  </h3>
                  <p className="ws-card-subtitle">
                    {isEn
                      ? 'Choose the foundational AI model approved by platform administration for this agent.'
                      : 'اختر النموذج الأساسي المعتمد في المنصة لمعالجة الاستفسارات وتوليد الإجابات.'}
                  </p>
                </div>
              </div>

              {llmModels.length === 0 ? (
                <div className="ws-empty-models">
                  <AlertCircle size={28} />
                  <p>
                    {isEn
                      ? 'No enabled LLM models are configured. Please contact platform administration.'
                      : 'لا توجد نماذج ذكاء اصطناعي مفعلة حالياً. يرجى التواصل مع إدارة المنصة.'}
                  </p>
                </div>
              ) : (
                <div className="ws-models-grid">
                  {llmModels.map((model) => {
                    const isSelected = profile.selected_llm_model_id === model.id;
                    return (
                      <div
                        key={model.id}
                        className={`ws-model-card ${isSelected ? 'ws-model-card--selected' : ''}`}
                        onClick={() =>
                          setProfile({ ...profile, selected_llm_model_id: model.id })
                        }
                      >
                        <div className="ws-model-card__header">
                          <div
                            className="ws-model-badge"
                            style={{ backgroundColor: model.badge_color || '#0878F9' }}
                          >
                            {model.provider.charAt(0).toUpperCase()}
                          </div>
                          {model.is_recommended && (
                            <span className="ws-recommended-tag">
                              <Sparkles size={12} />
                              <span>{isEn ? 'Recommended' : 'موصى به'}</span>
                            </span>
                          )}
                        </div>

                        <div className="ws-model-card__body">
                          <strong className="ws-model-name">{model.name}</strong>
                          <span className="ws-model-provider">
                            {model.provider} • {model.model_identifier}
                          </span>
                          <p className="ws-model-desc">
                            {isEn
                              ? model.description_en || model.description
                              : model.description || model.description_en}
                          </p>
                        </div>

                        <div className="ws-model-card__footer">
                          <span className="ws-model-radio">
                            {isSelected && <Check size={14} />}
                          </span>
                          <span className="ws-model-radio-label">
                            {isSelected
                              ? isEn ? 'Selected' : 'النموذج المعتمد'
                              : isEn ? 'Select' : 'اختيار'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Hyperparameters Slider */}
              <div className="ws-params-section">
                <div className="ws-param-card">
                  <div className="ws-param-header">
                    <div className="ws-param-title-wrap">
                      <Flame size={18} className="ws-param-icon" />
                      <div>
                        <strong>{isEn ? 'Temperature (Creativity)' : 'درجة الإبداعية (Temperature)'}</strong>
                        <p>{isEn ? 'Controls randomness in answers' : 'التحكم في التزام الوكيل بالنص الحرفي أو تنويع الصياغة'}</p>
                      </div>
                    </div>
                    <span className="ws-param-value-pill">{profile.temperature}</span>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max="1.5"
                    step="0.05"
                    value={profile.temperature}
                    onChange={(e) =>
                      setProfile({ ...profile, temperature: parseFloat(e.target.value) })
                    }
                    className="ws-range-slider"
                  />
                  <div className="ws-range-labels">
                    <span>0.0 ({isEn ? 'Strict / Exact' : 'دقيق وصارم'})</span>
                    <span>0.7 ({isEn ? 'Balanced' : 'متوازن ومناسب'})</span>
                    <span>1.5 ({isEn ? 'Creative' : 'إبداعي وحر'})</span>
                  </div>
                </div>

                <div className="ws-param-card">
                  <div className="ws-param-header">
                    <div className="ws-param-title-wrap">
                      <Sliders size={18} className="ws-param-icon" />
                      <div>
                        <strong>{isEn ? 'Max Output Tokens' : 'الحد الأقصى لرموز الإجابة'}</strong>
                        <p>{isEn ? 'Maximum length of generated response' : 'أقصى طول مسموح به لإجابة الوكيل في الرسالة الواحدة'}</p>
                      </div>
                    </div>
                    <span className="ws-param-value-pill">{profile.max_tokens}</span>
                  </div>

                  <input
                    type="number"
                    min={256}
                    max={16384}
                    step={256}
                    className="ws-profile-input ws-param-input"
                    value={profile.max_tokens}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        max_tokens: parseInt(e.target.value) || 2048,
                      })
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 3: SUPPORT & ESCALATION ROUTING ── */}
        {activeTab === 'routing' && (
          <div className="ws-tab-pane">
            <div className="ws-profile-card">
              <div className="ws-card-header">
                <div>
                  <h3 className="ws-card-title">
                    {isEn ? 'Support Cases & Escalation Automation' : 'أتمتة حالات الدعم وتوزيع المهام'}
                  </h3>
                  <p className="ws-card-subtitle">
                    {isEn
                      ? 'Enable AI to monitor user conversations and automatically open support cases when criteria are met.'
                      : 'تفعيل المراقبة الذكية لإنشاء حالات الدعم التلقائية وتحويل المشاكل الحرجة إلى الكوادر البشرية.'}
                  </p>
                </div>
              </div>

              {/* Auto Create Toggle */}
              <div className="ws-profile-toggle-card">
                <label className="ws-toggle-label">
                  <input
                    type="checkbox"
                    className="ws-toggle-checkbox"
                    checked={profile.support_case_auto_create}
                    onChange={(e) =>
                      setProfile({ ...profile, support_case_auto_create: e.target.checked })
                    }
                  />
                  <div className="ws-toggle-slider" />
                  <div className="ws-toggle-info">
                    <div className="ws-toggle-title">
                      <Ticket size={16} />
                      <strong>
                        {isEn
                          ? 'Automatic Support Case Creation'
                          : 'إنشاء حالات الدعم تلقائياً عند الحاجة'}
                      </strong>
                    </div>
                    <p className="ws-toggle-desc">
                      {isEn
                        ? 'AI detects student distress, complex inquiries, or explicit requests for staff and creates tickets.'
                        : 'يقوم الوكيل الذكي بتحليل المحادثة واكتشاف الحالات المعقدة أو طلبات التحدث مع موظف، وإنشاء حالة دعم تلقائية.'}
                    </p>
                  </div>
                </label>
              </div>

              {profile.support_case_auto_create && (
                <div className="ws-nested-box">
                  <label className="ws-profile-label">
                    {isEn ? 'Trigger Conditions for Ticket Creation' : 'شروط ومتطلبات إنشاء حالة الدعم'} <span className="ws-required">*</span>
                  </label>
                  <textarea
                    className="ws-profile-textarea"
                    value={profile.support_case_conditions}
                    onChange={(e) =>
                      setProfile({ ...profile, support_case_conditions: e.target.value })
                    }
                    placeholder={
                      isEn
                        ? 'e.g. When the student explicitly requests a human advisor, reports payment errors, or files academic appeals.'
                        : 'مثال: عندما يطلب الطالب صراحة التحدث مع مرشد بشري، أو وجود مشاكل في سداد الرسوم، أو تقديم طلب استئناف أكاديمي رسمي.'
                    }
                    rows={3}
                    required={profile.support_case_auto_create}
                  />
                </div>
              )}

              {/* Auto Assign Staff Toggle */}
              <div className="ws-profile-toggle-card" style={{ marginTop: 14 }}>
                <label className="ws-toggle-label">
                  <input
                    type="checkbox"
                    className="ws-toggle-checkbox"
                    checked={profile.staff_auto_assign}
                    onChange={(e) =>
                      setProfile({ ...profile, staff_auto_assign: e.target.checked })
                    }
                  />
                  <div className="ws-toggle-slider" />
                  <div className="ws-toggle-info">
                    <div className="ws-toggle-title">
                      <Users size={16} />
                      <strong>
                        {isEn
                          ? 'Automatic Staff Member Assignment'
                          : 'إسناد الحالات المنشأة تلقائياً لكوادر القسم'}
                      </strong>
                    </div>
                    <p className="ws-toggle-desc">
                      {isEn
                        ? 'Distribute created tickets among selected staff members in this workspace.'
                        : 'توزيع الحالات المنشأة بالتناوب أو بالتساوي على موظفي مساحة العمل المعتمدين.'}
                    </p>
                  </div>
                </label>
              </div>

              {profile.staff_auto_assign && (
                <div className="ws-nested-box">
                  <div className="ws-staff-header-row">
                    <div>
                      <strong>
                        {isEn
                          ? 'Eligible Staff Members for Routing:'
                          : 'الموظفون المؤهلون لاستقبال الإسناد التلقائي:'}
                      </strong>
                      <p>
                        {isEn
                          ? 'Select members who should receive automated cases.'
                          : 'حدد الموظفين المراد توزيع الحالات التلقائية عليهم في هذا القسم.'}
                      </p>
                    </div>

                    <div className="ws-staff-quick-actions">
                      <button
                        type="button"
                        className="ws-staff-btn"
                        onClick={handleSelectAllStaff}
                      >
                        {isEn ? 'Select All' : 'تحديد الكل'}
                      </button>
                      <button
                        type="button"
                        className="ws-staff-btn"
                        onClick={handleDeselectAllStaff}
                      >
                        {isEn ? 'Clear' : 'إلغاء التحديد'}
                      </button>
                    </div>
                  </div>

                  {workspaceStaff.length === 0 ? (
                    <div className="ws-no-staff-alert">
                      <Users size={18} />
                      <span>
                        {isEn
                          ? 'No staff members are assigned to this workspace yet.'
                          : 'لا يوجد موظفون معينون لمساحة العمل هذه حالياً. يمكنك إضافتهم من شاشة الموظفين.'}
                      </span>
                    </div>
                  ) : (
                    <div className="ws-staff-grid">
                      {workspaceStaff.map((member) => {
                        const isChecked = profile.auto_assign_staff_ids.includes(member.id);
                        return (
                          <label
                            key={member.id}
                            className={`ws-staff-item ${isChecked ? 'ws-staff-item--checked' : ''}`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleStaffId(member.id)}
                            />
                            <div className="ws-staff-item__info">
                              <span className="ws-staff-name">{member.name}</span>
                              <span className="ws-staff-email">{member.email}</span>
                            </div>
                            {isChecked && (
                              <CheckCircle2 size={16} className="ws-staff-check" />
                            )}
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Floating Sticky Action Bar ── */}
        <div className="ws-profile-floating-bar">
          <div className="ws-floating-info">
            <Bot size={18} />
            <span>
              {profile.name || (isEn ? 'Agent Configuration' : 'إعدادات الوكيل')}
            </span>
            <span className="ws-floating-sep">•</span>
            <span className="ws-floating-model">
              {selectedModelObj ? selectedModelObj.name : 'GPT-4o'}
            </span>
          </div>

          <div className="ws-floating-actions">
            <button
              type="button"
              className="ws-profile-btn ws-profile-btn--outline"
              onClick={() => setIsPreviewModalOpen(true)}
            >
              <Eye size={15} />
              <span>{isEn ? 'Preview Card' : 'معاينة البطاقة'}</span>
            </button>

            <button
              type="submit"
              className="ws-profile-btn ws-profile-btn--primary"
              disabled={saving || !profile.name.trim()}
            >
              {saving ? (
                <>
                  <div className="ws-btn-spinner" />
                  <span>{isEn ? 'Saving...' : 'جاري الحفظ...'}</span>
                </>
              ) : (
                <>
                  <Save size={15} />
                  <span>{isEn ? 'Save Agent Profile' : 'حفظ ملف الوكيل'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* ── 4. Agent Profile Preview Modal (Modal Popup) ── */}
      {isPreviewModalOpen && (
        <div className="ws-modal-backdrop" onClick={() => setIsPreviewModalOpen(false)}>
          <div
            className="ws-modal-dialog"
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            <div className="ws-modal-header">
              <div className="ws-modal-title-row">
                <Bot size={22} className="ws-modal-icon" />
                <h3>{isEn ? 'Agent Digital Identity Card' : 'البطاقة الرقمية للوكيل الذكي'}</h3>
              </div>
              <button
                type="button"
                className="ws-modal-close"
                onClick={() => setIsPreviewModalOpen(false)}
                aria-label={isEn ? 'Close' : 'إغلاق'}
              >
                <X size={18} />
              </button>
            </div>

            <div className="ws-modal-body">
              {/* Agent ID Hero in Modal */}
              <div className="ws-id-card">
                <div className="ws-id-card__top">
                  <div className="ws-id-card__avatar">
                    <Bot size={36} />
                  </div>
                  <div className="ws-id-card__details">
                    <h2 className="ws-id-card__name">{profile.name || (isEn ? 'Unnamed Agent' : 'الوكيل الذكي')}</h2>
                    <span className="ws-id-card__badge">
                      {profile.status === 'active' ? '🟢 نشط وجاهز' : profile.status === 'training' ? '🟡 وضع الاختبار' : '⚪ متوقف'}
                    </span>
                  </div>
                </div>

                <p className="ws-id-card__desc">
                  {profile.description || (isEn ? 'No description set.' : 'لا يوجد وصف مدخل لهذا الوكيل.')}
                </p>

                {/* Specs Grid */}
                <div className="ws-id-specs">
                  <div className="ws-spec-chip">
                    <Cpu size={14} />
                    <span>{isEn ? 'Model:' : 'النموذج:'} <strong>{selectedModelObj?.name || 'Default LLM'}</strong></span>
                  </div>
                  <div className="ws-spec-chip">
                    <Flame size={14} />
                    <span>{isEn ? 'Temp:' : 'الإبداعية:'} <strong>{profile.temperature}</strong></span>
                  </div>
                  <div className="ws-spec-chip">
                    <Database size={14} />
                    <span>{isEn ? 'RAG:' : 'المعرفة:'} <strong>{profile.use_knowledge_base ? 'مفعلة' : 'معطلة'}</strong></span>
                  </div>
                  <div className="ws-spec-chip">
                    <Ticket size={14} />
                    <span>{isEn ? 'Tickets:' : 'التذاكر:'} <strong>{profile.support_case_auto_create ? 'تلقائي' : 'يدوي'}</strong></span>
                  </div>
                </div>
              </div>

              {/* Sample Instructions Preview */}
              <div className="ws-modal-section">
                <h4>
                  <FileText size={15} />
                  <span>{isEn ? 'System Instructions Preview:' : 'مقتطف من تعليمات النظام:'}</span>
                </h4>
                <div className="ws-modal-prompt-box">
                  {profile.system_instructions
                    ? profile.system_instructions
                    : (isEn ? 'No system prompt defined yet.' : 'لم يتم تحديد تعليمات نظام بعد.')}
                </div>
              </div>
            </div>

            <div className="ws-modal-footer">
              <button
                type="button"
                className="ws-profile-btn ws-profile-btn--outline"
                onClick={() => setIsPreviewModalOpen(false)}
              >
                {isEn ? 'Close Preview' : 'إغلاق المعاينة'}
              </button>
              <button
                type="button"
                className="ws-profile-btn ws-profile-btn--primary"
                onClick={() => {
                  setIsPreviewModalOpen(false);
                  handleSave();
                }}
              >
                <Save size={16} />
                <span>{isEn ? 'Save & Deploy' : 'تطبيق وحفظ التعديلات'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
