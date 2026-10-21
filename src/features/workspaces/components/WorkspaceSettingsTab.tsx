import React, { useState } from 'react';
import { Workspace } from '../../../types';
import { workspaceService } from '../../../services/apiServices';
import { Card, CardHeader, CardContent, CardFooter } from '../../../design-system/components/Card';
import { Button } from '../../../design-system/components/Button';
import { Input } from '../../../design-system/components/Input';
import { Save, CheckCircle, Sliders, Globe, Shield, AlertCircle } from 'lucide-react';
import { useTranslation } from '../../../i18n/LanguageContext';
import { useAgentHubAuth } from '../../../context/AuthContext';

export interface WorkspaceSettingsTabProps {
  workspace: Workspace;
  onUpdated: (updated: Workspace) => void;
}

export const WorkspaceSettingsTab: React.FC<WorkspaceSettingsTabProps> = ({
  workspace,
  onUpdated,
}) => {
  const { language, t } = useTranslation();
  const { role } = useAgentHubAuth();
  const isEn = language === 'en';

  const isSystemAdmin = role === 'System Administrator' || role === 'system_administrator' || role === 'system_admin';

  const [name, setName] = useState(workspace.name);
  const [nameEn, setNameEn] = useState(workspace.nameEn);
  const [description, setDescription] = useState(workspace.description);
  const [defaultLang, setDefaultLang] = useState(workspace.defaultLanguage || 'ar');
  const [status, setStatus] = useState(workspace.status);
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSave = async () => {
    if (!isSystemAdmin) return;
    try {
      setIsSaving(true);
      setErrorMessage(null);
      const updated = await workspaceService.update(workspace.id, {
        name,
        nameEn,
        description,
        defaultLanguage: defaultLang,
        status,
      });
      setIsSaving(false);
      onUpdated(updated);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (err: any) {
      setIsSaving(false);
      setErrorMessage(err?.data?.message || err.message || (isEn ? 'Failed to update workspace.' : 'فشل في تحديث إعدادات مساحة العمل.'));
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {showToast && (
        <div className="ah-alert-success">
          <CheckCircle size={18} />
          <span>{isEn ? 'Workspace settings updated successfully!' : 'تم تحديث إعدادات مساحة العمل بنجاح!'}</span>
        </div>
      )}

      {errorMessage && (
        <div style={{
          backgroundColor: '#FEE2E2',
          border: '1px solid #FCA5A5',
          borderRadius: 8,
          padding: '10px 14px',
          color: '#991B1B',
          fontSize: '13px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <AlertCircle size={16} />
          <span>{errorMessage}</span>
        </div>
      )}

      {!isSystemAdmin && (
        <div style={{
          backgroundColor: '#F8FAFC',
          border: '1px solid #E2E8F0',
          borderRadius: 8,
          padding: '10px 14px',
          color: '#475569',
          fontSize: '13px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <Shield size={16} color="#64748B" />
          <span>
            {isEn
              ? 'Read-Only Mode: Workspace settings can only be modified by the System Administrator.'
              : 'وضع القراءة فقط: تعديل إعدادات مساحة العمل متاح حصرياً لمدير النظام الجامعي.'}
          </span>
        </div>
      )}

      <div>
        <h3 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: 800 }}>
          {isEn ? 'Workspace-Specific Settings' : 'إعدادات مساحة العمل (خاصة بهذا القسم)'}
        </h3>
        <p style={{ margin: 0, fontSize: '13px', color: 'var(--ah-text-secondary)' }}>
          {isEn
            ? 'These settings affect only this department and do not modify global university platform defaults.'
            : 'هذه الإعدادات تنطبق حصرياً على هذا القسم ولا تؤثر على الإعدادات العامة للمنصة في الجامعة.'}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
        {/* Department Info */}
        <Card>
          <CardHeader
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Sliders size={18} color="#0066FF" />
                <span>{isEn ? 'Department Metadata' : 'بيانات وهوية القسم'}</span>
              </div>
            }
          />
          <CardContent>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Input
                label={isEn ? 'Workspace Name (Arabic)' : 'اسم القسم (بالعربية)'}
                value={name}
                onChange={e => setName(e.target.value)}
                disabled={!isSystemAdmin}
              />

              <Input
                label={isEn ? 'Workspace Name (English)' : 'اسم القسم (بالإنجليزية)'}
                value={nameEn}
                onChange={e => setNameEn(e.target.value)}
                disabled={!isSystemAdmin}
              />

              <div className="ah-input-group">
                <label className="ah-input-label">{isEn ? 'Description' : 'وصف مهام القسم'}</label>
                <textarea
                  className="ah-prompt-textarea"
                  rows={3}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  disabled={!isSystemAdmin}
                  style={!isSystemAdmin ? { backgroundColor: '#F1F5F9', cursor: 'not-allowed' } : {}}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Operational Status & Language */}
        <Card>
          <CardHeader
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Globe size={18} color="#0066FF" />
                <span>{isEn ? 'Operational Language & Status' : 'حالة التشغيل واللغة'}</span>
              </div>
            }
          />
          <CardContent>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="ah-input-group">
                <label className="ah-input-label">{isEn ? 'Default Response Language' : 'اللغة الافتراضية لردود الوكيل'}</label>
                <select
                  className="ah-input"
                  value={defaultLang}
                  onChange={e => setDefaultLang(e.target.value as any)}
                  disabled={!isSystemAdmin}
                >
                  <option value="ar">العربية (Arabic - Default)</option>
                  <option value="en">English (الإنجليزية)</option>
                </select>
              </div>

              <div className="ah-input-group">
                <label className="ah-input-label">{isEn ? 'Operational Status' : 'حالة مساحة العمل'}</label>
                <select
                  className="ah-input"
                  value={status}
                  onChange={e => setStatus(e.target.value as any)}
                  disabled={!isSystemAdmin}
                >
                  <option value="active">نشط (Active - Ready for students)</option>
                  <option value="paused">متوقف مؤقتاً (Paused / Under Setup)</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {isSystemAdmin && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
          <Button
            variant="primary"
            icon={<Save size={16} />}
            isLoading={isSaving}
            onClick={handleSave}
          >
            {isEn ? 'Save Workspace Settings' : 'حفظ إعدادات القسم'}
          </Button>
        </div>
      )}
    </div>
  );
};
