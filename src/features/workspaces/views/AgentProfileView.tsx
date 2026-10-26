import React, { useEffect, useState } from 'react';
import { useTranslation } from '../../../i18n/LanguageContext';
import { apiClient } from '../../../services/apiClient';
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
      setLlmModels(modelsRes.data);
      if (membersRes.members) {
        setWorkspaceStaff(membersRes.members.map(m => m.user));
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
        auto_assign_staff_ids: current.filter(id => id !== staffId),
      });
    } else {
      setProfile({
        ...profile,
        auto_assign_staff_ids: [...current, staffId],
      });
    }
  };

  const handleSelectAllStaff = () => {
    const allIds = workspaceStaff.map(s => s.id);
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile.name.trim()) {
      setMessage({ type: 'error', text: isEn ? 'Agent name is required' : 'اسم الوكيل مطلوب' });
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

      setMessage({ type: 'success', text: isEn ? 'Agent profile updated successfully!' : 'تم حفظ وتطبيق إعدادات ملف الوكيل بنجاح!' });
      setTimeout(() => setMessage(null), 3500);
    } catch (err: any) {
      console.error('Failed to save profile:', err);
      setMessage({ type: 'error', text: err.message || (isEn ? 'Failed to save' : 'فشل حفظ الإعدادات') });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="ws-view-loading">
        <div className="ws-view-spinner" />
        <p>{isEn ? 'Loading agent profile...' : 'جاري تحميل ملف الوكيل...'}</p>
      </div>
    );
  }

  return (
    <div className="ws-profile-container">
      {/* Header */}
      <div className="ws-profile-header">
        <div>
          <h1 className="ws-profile-title">{isEn ? 'Agent Profile' : 'إعدادات ملف الوكيل (Agent Profile)'}</h1>
          <p className="ws-profile-subtitle">
            {isEn
              ? 'Configure prompt instructions, model routing, knowledge retrieval, and automated case escalation'
              : 'تحديد سلوك الوكيل، تعليمات النظام، نموذج LLM المعتمد، وقواعد الإنشاء التلقائي لحالات الدعم'}
          </p>
        </div>
      </div>

      {message && (
        <div className={`ws-profile-alert ws-profile-alert--${message.type}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSave} className="ws-profile-form">
        
        {/* SECTION 1: IDENTITY & ROLE */}
        <div className="ws-profile-card">
          <h3 className="ws-profile-card-title">🤖 {isEn ? '1. Agent Identity & Description' : '١. هوية الوكيل والدور العام'}</h3>
          
          <div className="ws-profile-group">
            <label className="ws-profile-label">{isEn ? 'Agent Name' : 'اسم الوكيل'} *</label>
            <input
              type="text"
              className="ws-profile-input"
              value={profile.name}
              onChange={e => setProfile({ ...profile, name: e.target.value })}
              placeholder={isEn ? 'e.g. University Admission Assistant' : 'مثال: المساعد الذكي لشؤون القبول والتسجيل'}
              required
            />
          </div>

          <div className="ws-profile-group">
            <label className="ws-profile-label">{isEn ? 'Agent Description' : 'وصف مختصر للوكيل'}</label>
            <textarea
              className="ws-profile-textarea"
              value={profile.description}
              onChange={e => setProfile({ ...profile, description: e.target.value })}
              placeholder={isEn ? 'Explain the main purpose of this agent in the workspace...' : 'وضح الغرض الرئيسي للوكيل داخل هذه المساحة...'}
              rows={2}
            />
          </div>

          <div className="ws-profile-group">
            <label className="ws-profile-label">{isEn ? 'Agent Operational Status' : 'الحالة التشغيلية للوكيل'}</label>
            <select
              className="ws-profile-select"
              value={profile.status}
              onChange={e => setProfile({ ...profile, status: e.target.value })}
            >
              <option value="active">{isEn ? 'Active (Answering live users)' : 'نشط (يجيب على المستعلمين)'}</option>
              <option value="training">{isEn ? 'Training Mode (Testing only)' : 'وضع التدريب والاختبار فقط'}</option>
              <option value="inactive">{isEn ? 'Inactive (Offline)' : 'متوقف مؤقتاً'}</option>
            </select>
          </div>
        </div>

        {/* SECTION 2: SYSTEM INSTRUCTIONS & BEHAVIOR */}
        <div className="ws-profile-card">
          <h3 className="ws-profile-card-title">📝 {isEn ? '2. System Prompt & Behavioral Instructions' : '٢. تعليمات النظام (System Prompt)'}</h3>
          <p className="ws-profile-card-desc">
            {isEn
              ? 'Defines role persona, answer boundaries, tone of voice, knowledge base utilization, and human transfer rules.'
              : 'تحدد طبيعة الدور، أسلوب الرد والتواصل، حدود الإجابات، طريقة استخدام معلومات قاعدة المعرفة، والتعامل مع نقص المعلومات.'}
          </p>

          <div className="ws-profile-group">
            <label className="ws-profile-label">{isEn ? 'Core System Prompt' : 'نص تعليمات النظام'}</label>
            <textarea
              className="ws-profile-textarea ws-profile-textarea--large"
              value={profile.system_instructions}
              onChange={e => setProfile({ ...profile, system_instructions: e.target.value })}
              placeholder={isEn
                ? 'You are an intelligent university advisor. Always answer politely using retrieved knowledge. If information is insufficient, inform the user clearly and refer them to staff...'
                : 'أنت مرشد جامعي ذكي. أجب بلباقة واحترافية بالاعتماد على قاعدة المعرفة المسترجعة. إذا لم تتوفر معلومات كافية، وضّح ذلك للمستعلم وأرشده لتحويل المحادثة لموظف بشري...'}
              rows={7}
            />
          </div>

          <div className="ws-profile-toggle-box">
            <label className="ws-profile-checkbox-label">
              <input
                type="checkbox"
                checked={profile.use_knowledge_base}
                onChange={e => setProfile({ ...profile, use_knowledge_base: e.target.checked })}
              />
              <div>
                <strong>📚 {isEn ? 'Rely on Knowledge Base' : 'الاعتماد على قاعدة المعرفة الخاصة بالمساحة'}</strong>
                <p>
                  {isEn
                    ? 'When enabled, the agent strictly uses documents and vector chunks belonging only to this workspace.'
                    : 'عند التفعيل، يعتمد الوكيل حصراً على مستندات ومتجهات قاعدة المعرفة الخاصة بمساحة العمل الحالية دون أي مساحة أخرى.'}
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* SECTION 3: LLM MODEL CONFIGURATION */}
        <div className="ws-profile-card">
          <h3 className="ws-profile-card-title">⚡ {isEn ? '3. Language Model (LLM)' : '٣. اختيار نموذج الذكاء الاصطناعي (LLM)'}</h3>
          <p className="ws-profile-card-desc">
            {isEn
              ? 'Only globally enabled models configured in system settings can be selected for this workspace.'
              : 'تظهر هنا فقط النماذج المفعّلة والمُعدّة مسبقاً في الإعدادات العامة للنظام.'}
          </p>

          {llmModels.length === 0 ? (
            <div className="ws-profile-empty-models">
              <span>⚠️</span>
              <p>{isEn ? 'No enabled LLM models are configured globally. Please configure models in platform settings.' : 'لا توجد نماذج LLM مفعّلة في الإعدادات العامة للنظام حالياً.'}</p>
            </div>
          ) : (
            <div className="ws-profile-models-grid">
              {llmModels.map(model => {
                const isSelected = profile.selected_llm_model_id === model.id;
                return (
                  <div
                    key={model.id}
                    className={`ws-profile-model-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => setProfile({ ...profile, selected_llm_model_id: model.id })}
                  >
                    <div className="ws-profile-model-badge" style={{ background: model.badge_color || '#0878F9' }}>
                      {model.provider.charAt(0).toUpperCase()}
                    </div>
                    <div className="ws-profile-model-info">
                      <div className="ws-profile-model-name-row">
                        <strong>{model.name}</strong>
                        {model.is_recommended && (
                          <span className="ws-profile-recommended-tag">⭐ {isEn ? 'Recommended' : 'موصى به'}</span>
                        )}
                      </div>
                      <small className="ws-profile-model-provider">{model.provider} · {model.model_identifier}</small>
                    </div>
                    <input
                      type="radio"
                      name="selected_llm_model"
                      checked={isSelected}
                      onChange={() => setProfile({ ...profile, selected_llm_model_id: model.id })}
                    />
                  </div>
                );
              })}
            </div>
          )}

          {/* Temperature & Token Limits */}
          <div className="ws-profile-hyperparams">
            <div className="ws-profile-group">
              <label className="ws-profile-label">
                {isEn ? 'Temperature (Creativity)' : 'درجة الإبداعية (Temperature)'}: <strong>{profile.temperature}</strong>
              </label>
              <input
                type="range"
                min="0"
                max="1.5"
                step="0.05"
                value={profile.temperature}
                onChange={e => setProfile({ ...profile, temperature: parseFloat(e.target.value) })}
                className="ws-profile-range"
              />
              <div className="ws-profile-range-hints">
                <span>0.0 ({isEn ? 'Precise / Deterministic' : 'دقيق ومحدد'})</span>
                <span>1.5 ({isEn ? 'Creative' : 'إبداعي'})</span>
              </div>
            </div>

            <div className="ws-profile-group">
              <label className="ws-profile-label">{isEn ? 'Max Output Tokens' : 'الحد الأقصى لرموز الإجابة'}</label>
              <input
                type="number"
                min={256}
                max={16384}
                className="ws-profile-input"
                value={profile.max_tokens}
                onChange={e => setProfile({ ...profile, max_tokens: parseInt(e.target.value) || 2048 })}
              />
            </div>
          </div>
        </div>

        {/* SECTION 4: SUPPORT CASE AUTO-CREATION & STAFF ROUTING */}
        <div className="ws-profile-card">
          <h3 className="ws-profile-card-title">🎫 {isEn ? '4. Support Cases & Staff Routing' : '٤. شروط حالات الدعم والإسناد التلقائي'}</h3>
          <p className="ws-profile-card-desc">
            {isEn
              ? 'Configure automatic case generation when customer issues satisfy specific approved conditions.'
              : 'تتيح تفعيل إنشاء حالات الدعم تلقائياً بواسطة الذكاء الاصطناعي وفق الشروط المعتمدة، مع خيار إسناد الموظفين تلقائياً.'}
          </p>

          {/* Auto-create Toggle */}
          <div className="ws-profile-toggle-box">
            <label className="ws-profile-checkbox-label">
              <input
                type="checkbox"
                checked={profile.support_case_auto_create}
                onChange={e => setProfile({ ...profile, support_case_auto_create: e.target.checked })}
              />
              <div>
                <strong>⚙️ {isEn ? 'Enable Automatic Support Case Creation' : 'تفعيل إنشاء حالات الدعم تلقائياً'}</strong>
                <p>
                  {isEn
                    ? 'When enabled, the AI monitors conversations and opens support cases based on specified conditions.'
                    : 'عند تفعيل هذا الخيار، يقوم الذكاء الاصطناعي بإنشاء حالة دعم عند استيفاء شروط محددة واستخراج بياناتها من المحادثة.'}
                </p>
              </div>
            </label>
          </div>

          {profile.support_case_auto_create && (
            <div className="ws-profile-group ws-profile-indent">
              <label className="ws-profile-label">
                {isEn ? 'Support Case Conditions / Requirements' : 'متطلبات وشروط إنشاء حالات الدعم'} *
              </label>
              <textarea
                className="ws-profile-textarea"
                value={profile.support_case_conditions}
                onChange={e => setProfile({ ...profile, support_case_conditions: e.target.value })}
                placeholder={isEn
                  ? 'Define the exact conditions (e.g. system errors, financial complaints, repeated negative sentiment, explicit human request)...'
                  : 'حدد الشروط المعتمدة بدقة (مثل: مشاكل سداد، طلب تحويل صريح، شكوى أكاديمية رسمية، تعذر إيجاد حل في قاعدة المعرفة)...'}
                rows={3}
                required={profile.support_case_auto_create}
              />
            </div>
          )}

          {/* Independent Staff Auto-Assign Toggle */}
          <div className="ws-profile-toggle-box" style={{ marginTop: 14 }}>
            <label className="ws-profile-checkbox-label">
              <input
                type="checkbox"
                checked={profile.staff_auto_assign}
                onChange={e => setProfile({ ...profile, staff_auto_assign: e.target.checked })}
              />
              <div>
                <strong>👥 {isEn ? 'Enable Automatic Staff Assignment' : 'تفعيل اختيار وإسناد الموظفين تلقائياً'}</strong>
                <p>
                  {isEn
                    ? 'Automatically assign created cases to eligible workspace staff members.'
                    : 'خيار مستقل لتفعيل توزيع الحالات على موظفي مساحة العمل المحددين تلقائياً.'}
                </p>
              </div>
            </label>
          </div>

          {/* Staff Member Checklist for Auto-Assignment */}
          {profile.staff_auto_assign && (
            <div className="ws-profile-staff-box ws-profile-indent">
              <div className="ws-profile-staff-header">
                <div>
                  <strong>{isEn ? 'Eligible Staff Members for Routing:' : 'الموظفون المؤهلون للإسناد التلقائي في هذه المساحة:'}</strong>
                  <p>{isEn ? 'Select all or specific staff to receive auto-assigned tickets.' : 'اختر جميع الموظفين أو بعضهم لتوزيع الحالات المنشأة عليهم.'}</p>
                </div>
                <div className="ws-profile-staff-quick">
                  <button type="button" className="ws-profile-sub-btn" onClick={handleSelectAllStaff}>
                    {isEn ? 'Select All' : 'تحديد الكل'}
                  </button>
                  <button type="button" className="ws-profile-sub-btn" onClick={handleDeselectAllStaff}>
                    {isEn ? 'Deselect All' : 'إلغاء التحديد'}
                  </button>
                </div>
              </div>

              {workspaceStaff.length === 0 ? (
                <p className="ws-profile-no-staff">
                  {isEn ? 'No staff members assigned to this workspace yet.' : 'لا يوجد موظفون مضافون لهذه المساحة حالياً.'}
                </p>
              ) : (
                <div className="ws-profile-staff-grid">
                  {workspaceStaff.map(member => {
                    const isChecked = profile.auto_assign_staff_ids.includes(member.id);
                    return (
                      <label key={member.id} className={`ws-profile-staff-item ${isChecked ? 'active' : ''}`}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleStaffId(member.id)}
                        />
                        <div className="ws-profile-staff-item-info">
                          <span>{member.name}</span>
                          <small>{member.email}</small>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="ws-profile-submit-wrap">
          <button
            type="submit"
            className="ws-profile-submit-btn"
            disabled={saving || !profile.name.trim()}
          >
            {saving ? (isEn ? 'Saving Configuration...' : 'جاري الحفظ والتطبيق...') : (exists ? (isEn ? 'Update Agent Profile' : 'تحديث ملف الوكيل') : (isEn ? 'Save Profile' : 'حفظ ملف الوكيل'))}
          </button>
        </div>
      </form>
    </div>
  );
};
