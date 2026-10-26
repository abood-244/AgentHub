import React, { useEffect, useState } from 'react';
import { useTranslation } from '../../../i18n/LanguageContext';
import { apiClient } from '../../../services/apiClient';
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

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
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
      }
    } catch (err: any) {
      console.error(err);
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || (isEn ? 'Failed to load workspace data.' : 'فشل تحميل بيانات مساحة العمل.'),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

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
        message: isEn ? 'Workspace settings saved successfully!' : 'تم حفظ إعدادات مساحة العمل بنجاح!',
      });
    } catch (err: any) {
      console.error(err);
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || (isEn ? 'Failed to save changes.' : 'حدث خطأ أثناء الحفظ.'),
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
      onBack();
    } catch (err: any) {
      console.error(err);
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || (isEn ? 'Failed to delete workspace.' : 'فشل في حذف مساحة العمل.'),
      });
      setShowDeleteConfirm(false);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="ws-view-loading">
        <div className="ws-view-spinner" />
      </div>
    );
  }

  return (
    <div className="ws-settings-container">
      {/* Header */}
      <div className="ws-view-header">
        <h1 className="ws-view-title">{isEn ? 'Workspace Settings' : 'إعدادات مساحة العمل'}</h1>
        <p className="ws-view-subtitle">
          {isEn
            ? 'Manage workspace general information, operational status, and lifecycle'
            : 'إدارة البيانات العامة لمساحة العمل وحالتها التشغيلية وإعدادات النظام'}
        </p>
      </div>

      {feedback && (
        <div className={`ws-alert ws-alert--${feedback.type}`} style={{ marginBottom: '20px' }}>
          <span>{feedback.type === 'success' ? '✓ ' : '⚠️ '}</span>
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="ws-settings-form">
        <div className="ws-card">
          <h3 className="ws-card__title">{isEn ? 'General Information' : 'المعلومات العامة'}</h3>

          <div className="ws-form-group">
            <label className="ws-form-label">{isEn ? 'Workspace Name *' : 'اسم مساحة العمل *'}</label>
            <input
              type="text"
              className="ws-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={isEn ? 'e.g. Admission & Registration Agent' : 'مثال: وكيل القبول والتسجيل'}
              required
            />
          </div>

          <div className="ws-form-group">
            <label className="ws-form-label">{isEn ? 'Description' : 'الوصف والمهام'}</label>
            <textarea
              className="ws-textarea"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={
                isEn
                  ? 'Describe the scope, audience, and responsibilities of this agent...'
                  : 'صف مهام هذا الوكيل والجمهور المستهدف ونطاق اختصاصه...'
              }
            />
          </div>

          <div className="ws-form-group">
            <label className="ws-form-label">{isEn ? 'Operational Status' : 'الحالة التشغيلية'}</label>
            <div className="ws-status-selector">
              <label className={`ws-status-pill ${status === 'active' ? 'ws-status-pill--active' : ''}`}>
                <input
                  type="radio"
                  name="ws_status"
                  value="active"
                  checked={status === 'active'}
                  onChange={() => setStatus('active')}
                />
                <span className="ws-status-dot ws-status-dot--green" />
                <span>{isEn ? 'Active & Ready' : 'نشط وجاهز للعمل'}</span>
              </label>

              <label className={`ws-status-pill ${status === 'paused' ? 'ws-status-pill--active' : ''}`}>
                <input
                  type="radio"
                  name="ws_status"
                  value="paused"
                  checked={status === 'paused'}
                  onChange={() => setStatus('paused')}
                />
                <span className="ws-status-dot ws-status-dot--yellow" />
                <span>{isEn ? 'Paused (Maintenance)' : 'متوقف مؤقتاً (صيانة)'}</span>
              </label>

              <label className={`ws-status-pill ${status === 'archived' ? 'ws-status-pill--active' : ''}`}>
                <input
                  type="radio"
                  name="ws_status"
                  value="archived"
                  checked={status === 'archived'}
                  onChange={() => setStatus('archived')}
                />
                <span className="ws-status-dot ws-status-dot--gray" />
                <span>{isEn ? 'Archived (Read Only)' : 'مؤرشف (للقراءة فقط)'}</span>
              </label>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
            <button type="submit" className="ws-btn ws-btn--primary" disabled={saving || !name.trim()}>
              <span>💾</span> {saving ? (isEn ? 'Saving...' : 'جاري الحفظ...') : isEn ? 'Save Changes' : 'حفظ التعديلات'}
            </button>
          </div>
        </div>
      </form>

      {/* Danger Zone */}
      <div className="ws-card ws-card--danger">
        <h3 className="ws-card__title" style={{ color: '#ef4444' }}>
          ⚠️ {isEn ? 'Danger Zone' : 'منطقة الإجراءات الخطرة'}
        </h3>
        <p style={{ color: '#94a3b8', fontSize: '13.5px', marginBottom: '16px' }}>
          {isEn
            ? 'Deleting this workspace will permanently erase all associated documents, embeddings, conversations, test records, and channel links. This action cannot be undone.'
            : 'حذف مساحة العمل سيؤدي إلى مسح نهائي لجميع المستندات والمتجهات والمحادثات وحالات الدعم المرتبطة بها. هذا الإجراء غير قابل للتراجع.'}
        </p>

        {!showDeleteConfirm ? (
          <button
            type="button"
            className="ws-btn ws-btn--danger"
            onClick={() => setShowDeleteConfirm(true)}
          >
            <span>🗑️</span> {isEn ? 'Delete Workspace' : 'حذف مساحة العمل'}
          </button>
        ) : (
          <div className="ws-delete-confirm-box">
            <p style={{ fontSize: '13.5px', color: '#f87171', marginBottom: '10px' }}>
              {isEn
                ? `To confirm deletion, please type "${name}" below:`
                : `لتأكيد الحذف النهائي، الرجاء كتابة اسم المساحة "${name}" في الحقل أدناه:`}
            </p>
            <input
              type="text"
              className="ws-input"
              style={{ borderColor: 'rgba(239, 68, 68, 0.4)', marginBottom: '12px' }}
              value={deleteConfirmInput}
              onChange={(e) => setDeleteConfirmInput(e.target.value)}
              placeholder={name}
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                className="ws-btn ws-btn--danger"
                disabled={deleteConfirmInput !== name || deleting}
                onClick={handleDelete}
              >
                {deleting ? (isEn ? 'Deleting...' : 'جاري الحذف...') : isEn ? 'Permanently Delete' : 'تأكيد الحذف النهائي'}
              </button>
              <button
                type="button"
                className="ws-btn ws-btn--secondary"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteConfirmInput('');
                }}
              >
                {isEn ? 'Cancel' : 'إلغاء'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
