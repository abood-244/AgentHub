import React, { useEffect, useState } from 'react';
import { useTranslation } from '../../../i18n/LanguageContext';
import { apiClient } from '../../../services/apiClient';
import {
  Settings,
  Building,
  Save,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Clock,
  Key,
  ShieldAlert,
  X,
  Radio,
  FileText,
  Activity,
} from 'lucide-react';
import './WorkspaceSettingsView.css';

interface WorkspaceData {
  id: number | string;
  name: string;
  description: string | null;
  status: string;
  created_at?: string;
  updated_at?: string;
}

interface WorkspaceSettingsViewProps {
  workspaceId: string;
  onBack: () => void;
}

export const WorkspaceSettingsView: React.FC<WorkspaceSettingsViewProps> = ({
  workspaceId,
  onBack,
}) => {
  const { language } = useTranslation();
  const isEn = language === 'en';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('active');
  const [createdAt, setCreatedAt] = useState<string | null>(null);

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState('');

  useEffect(() => {
    loadWorkspace();
  }, [workspaceId]);

  const loadWorkspace = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<{ workspace: WorkspaceData }>(`/workspaces/${workspaceId}`);
      if (res.workspace) {
        setName(res.workspace.name || '');
        setDescription(res.workspace.description || '');
        setStatus(res.workspace.status || 'active');
        setCreatedAt(res.workspace.created_at || null);
      }
    } catch (err: any) {
      console.error(err);
      setFeedback({
        type: 'error',
        message:
          err.response?.data?.message ||
          (isEn ? 'Failed to load workspace data.' : 'فشل تحميل بيانات مساحة العمل من الخادم.'),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!name.trim()) {
      setFeedback({
        type: 'error',
        message: isEn ? 'Workspace name is required.' : 'اسم مساحة العمل مطلوب ولا يمكن تركه فارغاً.',
      });
      return;
    }

    try {
      setSaving(true);
      setFeedback(null);

      await apiClient.put(`/workspaces/${workspaceId}`, {
        name: name.trim(),
        description: description.trim() || null,
        status,
      });

      setFeedback({
        type: 'success',
        message: isEn
          ? 'Workspace settings updated and saved successfully in database!'
          : 'تم حفظ وتحديث إعدادات مساحة العمل بنجاح في قاعدة البيانات!',
      });
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      console.error(err);
      setFeedback({
        type: 'error',
        message:
          err.response?.data?.message ||
          (isEn ? 'Failed to save changes.' : 'حدث خطأ أثناء حفظ التعديلات.'),
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (deleteConfirmInput !== name) return;

    try {
      setDeleting(true);
      await apiClient.delete(`/workspaces/${workspaceId}`);
      setShowDeleteModal(false);
      onBack();
    } catch (err: any) {
      console.error(err);
      setFeedback({
        type: 'error',
        message:
          err.response?.data?.message ||
          (isEn ? 'Failed to delete workspace.' : 'فشل في حذف مساحة العمل.'),
      });
      setShowDeleteModal(false);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="ws-view-loading">
        <div className="ws-view-spinner" />
        <p>{isEn ? 'Loading workspace settings...' : 'جاري تحميل إعدادات مساحة العمل...'}</p>
      </div>
    );
  }

  return (
    <div className="ws-settings-page" dir="rtl">
      {/* ── 1. Top Executive Header ── */}
      <div className="ws-settings-hero">
        <div className="ws-settings-hero__info">
          <div className="ws-settings-hero__avatar">
            <Building size={28} className="ws-settings-hero__icon" />
          </div>
          <div>
            <div className="ws-settings-hero__title-row">
              <h1 className="ws-settings-hero__title">
                {isEn ? 'Workspace Settings' : 'إعدادات مساحة العمل'}
              </h1>
              <span
                className={`ws-settings-hero__status-pill ws-settings-hero__status-pill--${status}`}
              >
                {status === 'active'
                  ? isEn ? 'Active & Ready' : 'نشط وجاهز'
                  : status === 'paused'
                  ? isEn ? 'Maintenance' : 'صيانة مؤقتة'
                  : isEn ? 'Archived' : 'مؤرشف'}
              </span>
            </div>
            <p className="ws-settings-hero__subtitle">
              {isEn
                ? 'Manage organizational parameters, operational readiness, and lifecycle rules.'
                : 'إدارة البيانات العامة لمساحة العمل، حالتها التشغيلية، وإعدادات النظام.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          className="ws-settings-save-btn"
          onClick={() => handleSave()}
          disabled={saving || !name.trim()}
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

      {/* ── Feedback Message ── */}
      {feedback && (
        <div className={`ws-settings-alert ws-settings-alert--${feedback.type}`}>
          {feedback.type === 'success' ? (
            <CheckCircle2 size={18} className="ws-alert-icon" />
          ) : (
            <AlertCircle size={18} className="ws-alert-icon" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* ── 2. Settings Content Form ── */}
      <form onSubmit={handleSave} className="ws-settings-form-layout">
        {/* Card 1: General Info */}
        <div className="ws-settings-card">
          <div className="ws-card-header">
            <h3 className="ws-card-title">
              <Building size={18} className="ws-card-title-icon" />
              <span>{isEn ? 'General Department Information' : 'المعلومات العامة وتوصيف القسم'}</span>
            </h3>
            <p className="ws-card-subtitle">
              {isEn
                ? 'Primary departmental identity, visible to users and academic staff.'
                : 'الاسم الرسمي للمساحة ونطاق المهام المعتمد الذي يظهر في لوحة الإدارة وقنوات التواصل.'}
            </p>
          </div>

          <div className="ws-settings-fields">
            <div className="ws-settings-group">
              <label className="ws-settings-label">
                {isEn ? 'Workspace Name' : 'اسم مساحة العمل'} <span className="ws-required">*</span>
              </label>
              <input
                type="text"
                className="ws-settings-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={isEn ? 'e.g. College of Computing & Information' : 'مثال: كلية الحاسبات وتكنولوجيا المعلومات'}
                required
              />
            </div>

            <div className="ws-settings-group">
              <label className="ws-settings-label">
                {isEn ? 'Responsibilities & Scope' : 'الوصف والمهام ونطاق العمل'}
              </label>
              <textarea
                className="ws-settings-textarea"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={
                  isEn
                    ? 'Describe the academic programs, responsibilities, and target audience of this workspace...'
                    : 'صف اختصاصات هذا القسم، البرامج الدراسية، والخدمات الأكاديمية المقدمة للطلاب...'
                }
              />
            </div>
          </div>
        </div>

        {/* Card 2: Operational Lifecycle */}
        <div className="ws-settings-card">
          <div className="ws-card-header">
            <h3 className="ws-card-title">
              <Activity size={18} className="ws-card-title-icon" />
              <span>{isEn ? 'Operational Status & Availability' : 'الحالة التشغيلية وسياسة العمل'}</span>
            </h3>
            <p className="ws-card-subtitle">
              {isEn
                ? 'Controls whether AI agents and public channels answer queries or enter maintenance mode.'
                : 'تحدد إمكانية استقبال استفسارات الطلبة وتفعيل الوكلاء أو إيقافهم مؤقتاً لأعمال الصيانة والتحديث.'}
            </p>
          </div>

          <div className="ws-status-cards-grid">
            {/* Active Status */}
            <div
              className={`ws-status-card ${
                status === 'active' ? 'ws-status-card--active' : ''
              }`}
              onClick={() => setStatus('active')}
            >
              <div className="ws-status-card__top">
                <span className="ws-status-dot ws-status-dot--green" />
                <span className="ws-status-card__badge ws-status-card__badge--green">
                  {isEn ? 'Active' : 'نشط'}
                </span>
              </div>
              <strong className="ws-status-card__title">
                {isEn ? 'Active & Ready' : 'نشط وجاهز للعمل'}
              </strong>
              <p className="ws-status-card__desc">
                {isEn
                  ? 'AI Agent responds live on web and channels; all knowledge retrieval active.'
                  : 'الوكيل الذكي يجيب فورياً على الاستفسارات، وقاعدة المعرفة والقنوات مفعلة بالكامل.'}
              </p>
            </div>

            {/* Paused Status */}
            <div
              className={`ws-status-card ${
                status === 'paused' ? 'ws-status-card--paused' : ''
              }`}
              onClick={() => setStatus('paused')}
            >
              <div className="ws-status-card__top">
                <span className="ws-status-dot ws-status-dot--amber" />
                <span className="ws-status-card__badge ws-status-card__badge--amber">
                  {isEn ? 'Paused' : 'صيانة'}
                </span>
              </div>
              <strong className="ws-status-card__title">
                {isEn ? 'Paused (Maintenance)' : 'متوقف مؤقتاً (صيانة)'}
              </strong>
              <p className="ws-status-card__desc">
                {isEn
                  ? 'Temporarily halts automated AI answers during updates or document training.'
                  : 'إيقاف الردود التلقائية مؤقتاً أثناء مراجعة المستندات أو تحديث تعليمات الوكيل.'}
              </p>
            </div>

            {/* Archived Status */}
            <div
              className={`ws-status-card ${
                status === 'archived' ? 'ws-status-card--archived' : ''
              }`}
              onClick={() => setStatus('archived')}
            >
              <div className="ws-status-card__top">
                <span className="ws-status-dot ws-status-dot--gray" />
                <span className="ws-status-card__badge ws-status-card__badge--gray">
                  {isEn ? 'Archived' : 'مؤرشف'}
                </span>
              </div>
              <strong className="ws-status-card__title">
                {isEn ? 'Archived (Read Only)' : 'مؤرشف (للقراءة فقط)'}
              </strong>
              <p className="ws-status-card__desc">
                {isEn
                  ? 'Workspace is closed and locked for historical audits and report inspection.'
                  : 'مساحة العمل مغلقة ومحفوظة لسجلات التدقيق الأكاديمي والتقارير الإحصائية فقط.'}
              </p>
            </div>
          </div>
        </div>

        {/* Card 3: System Metadata */}
        <div className="ws-settings-card ws-settings-card--meta">
          <div className="ws-meta-grid">
            <div className="ws-meta-item">
              <Key size={15} className="ws-meta-icon" />
              <div>
                <span className="ws-meta-label">{isEn ? 'Workspace ID' : 'معرّف مساحة العمل'}</span>
                <code className="ws-meta-value">#{workspaceId}</code>
              </div>
            </div>

            <div className="ws-meta-item">
              <Clock size={15} className="ws-meta-icon" />
              <div>
                <span className="ws-meta-label">{isEn ? 'Created At' : 'تاريخ الإنشاء'}</span>
                <span className="ws-meta-value">
                  {createdAt
                    ? new Date(createdAt).toLocaleDateString(isEn ? 'en-US' : 'ar-SA', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : isEn ? 'System Default' : 'نظامي'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 4: Danger Zone */}
        <div className="ws-settings-card ws-settings-card--danger">
          <div className="ws-danger-header">
            <div className="ws-danger-icon-box">
              <ShieldAlert size={22} />
            </div>
            <div>
              <h3 className="ws-danger-title">
                {isEn ? 'Danger Zone' : 'منطقة الإجراءات الخطرة'}
              </h3>
              <p className="ws-danger-subtitle">
                {isEn
                  ? 'Permanent workspace deletion will erase all documents, vectors, conversations, and agent logs.'
                  : 'حذف مساحة العمل إجراء نهائي سيؤدي إلى مسح المستندات والمتجهات والمحادثات وحالات الدعم التابعة لها كلياً.'}
              </p>
            </div>
          </div>

          <div className="ws-danger-action">
            <button
              type="button"
              className="ws-danger-trigger-btn"
              onClick={() => setShowDeleteModal(true)}
            >
              <Trash2 size={16} />
              <span>{isEn ? 'Delete Workspace Permanently' : 'حذف مساحة العمل نهائياً'}</span>
            </button>
          </div>
        </div>
      </form>

      {/* ── 3. Delete Confirmation Modal (Modal Popup) ── */}
      {showDeleteModal && (
        <div className="ws-modal-backdrop" onClick={() => setShowDeleteModal(false)}>
          <div
            className="ws-modal-dialog ws-modal-dialog--danger"
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            <div className="ws-modal-header ws-modal-header--danger">
              <div className="ws-modal-title-row">
                <AlertTriangle size={20} className="ws-danger-modal-icon" />
                <h3>{isEn ? 'Confirm Permanent Workspace Deletion' : 'تأكيد الحذف النهائي لمساحة العمل'}</h3>
              </div>
              <button
                type="button"
                className="ws-modal-close"
                onClick={() => setShowDeleteModal(false)}
                aria-label={isEn ? 'Close' : 'إغلاق'}
              >
                <X size={18} />
              </button>
            </div>

            <div className="ws-modal-body">
              <div className="ws-danger-alert-box">
                <p>
                  {isEn
                    ? 'This action cannot be undone. All documents, vector embeddings, conversations, support cases, and agent configurations belonging to this workspace will be deleted forever.'
                    : 'هذا الإجراء غير قابل للتراجع. سيتم مسح قاعدة المعرفة بالكامل، المتجهات الذكية، سجلات المحادثات، وحالات الدعم المرتبطة بهذه المساحة إلى الأبد.'}
                </p>
              </div>

              <div className="ws-settings-group">
                <label className="ws-settings-label">
                  {isEn
                    ? `Please type "${name}" to confirm:`
                    : `لتأكيد الحذف النهائي، الرجاء كتابة اسم مساحة العمل "${name}":`}
                </label>
                <input
                  type="text"
                  className="ws-settings-input ws-settings-input--danger"
                  value={deleteConfirmInput}
                  onChange={(e) => setDeleteConfirmInput(e.target.value)}
                  placeholder={name}
                  autoFocus
                />
              </div>
            </div>

            <div className="ws-modal-footer">
              <button
                type="button"
                className="ws-profile-btn ws-profile-btn--outline"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmInput('');
                }}
              >
                {isEn ? 'Cancel' : 'إلغاء'}
              </button>

              <button
                type="button"
                className="ws-danger-delete-btn"
                disabled={deleteConfirmInput !== name || deleting}
                onClick={handleDelete}
              >
                {deleting ? (
                  <>
                    <div className="ws-btn-spinner" />
                    <span>{isEn ? 'Deleting...' : 'جاري الحذف...'}</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    <span>{isEn ? 'Delete Workspace' : 'تأكيد الحذف نهائياً'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
