import React, { useState } from 'react';
import { Workspace, WorkspaceChannelConfig } from '../../../types';
import { workspaceService } from '../../../services/apiServices';
import { Card, CardHeader, CardContent, CardFooter } from '../../../design-system/components/Card';
import { Button } from '../../../design-system/components/Button';
import { Input } from '../../../design-system/components/Input';
import { Badge } from '../../../design-system/components/Badge';
import { Globe, MessageSquare, CheckCircle, Save, QrCode } from 'lucide-react';
import { useTranslation } from '../../../i18n/LanguageContext';

export interface WorkspaceChannelsTabProps {
  workspace: Workspace;
  onUpdated: (updated: Workspace) => void;
}

export const WorkspaceChannelsTab: React.FC<WorkspaceChannelsTabProps> = ({
  workspace,
  onUpdated,
}) => {
  const { language, t } = useTranslation();
  const isEn = language === 'en';

  const [config, setConfig] = useState<WorkspaceChannelConfig>(workspace.channelConfig);
  const [isSaving, setIsSaving] = useState(false);
  const [showSavedToast, setShowSavedToast] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    const updated = await workspaceService.updateChannelConfig(workspace.id, config);
    setIsSaving(false);
    onUpdated(updated);
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 3000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {showSavedToast && (
        <div className="ah-alert-success">
          <CheckCircle size={18} />
          <span>{isEn ? 'Channel configurations saved successfully!' : 'تم حفظ إعدادات قنوات الاتصال بنجاح!'}</span>
        </div>
      )}

      <div>
        <h3 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: 800 }}>
          {isEn ? 'Workspace Communication Channels' : 'قنوات التواصل المتاحة للطلاب'}
        </h3>
        <p style={{ margin: 0, fontSize: '13px', color: 'var(--ah-text-secondary)' }}>
          {isEn
            ? 'Configure how students access this Workspace Agent. All enabled channels share the same Agent Profile and Knowledge.'
            : 'حدد نقاط الوصول التي يتفاعل الطلاب من خلالها مع وكيل هذا القسم (عبر الودجت في الموقع أو الواتساب).'}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
        {/* Channel 1: Web Widget */}
        <Card>
          <CardHeader
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Globe size={20} color="#0066FF" />
                <span>{isEn ? 'University Web Widget' : 'ودجت موقع الجامعة (Web Widget)'}</span>
              </div>
            }
            action={
              <Badge variant={config.webWidget.enabled ? 'success' : 'neutral'} dot>
                {config.webWidget.enabled ? (isEn ? 'Enabled' : 'مفعل') : (isEn ? 'Disabled' : 'معطل')}
              </Badge>
            }
          />
          <CardContent>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <label className="ah-checkbox-row">
                <input
                  type="checkbox"
                  checked={config.webWidget.enabled}
                  onChange={e => setConfig({
                    ...config,
                    webWidget: { ...config.webWidget, enabled: e.target.checked }
                  })}
                />
                <span className="ah-checkbox-label">
                  {isEn ? 'Enable Web Widget for this Department' : 'تفعيل نافذة المحادثة في بوابة الكلية'}
                </span>
              </label>

              <Input
                label={isEn ? 'Widget Display Title' : 'عنوان نافذة المحادثة'}
                value={config.webWidget.title}
                onChange={e => setConfig({
                  ...config,
                  webWidget: { ...config.webWidget, title: e.target.value }
                })}
              />

              <Input
                label={isEn ? 'Greeting Message' : 'رسالة الترحيب التلقائية'}
                value={config.webWidget.greeting}
                onChange={e => setConfig({
                  ...config,
                  webWidget: { ...config.webWidget, greeting: e.target.value }
                })}
              />

              <div className="ah-input-group">
                <label className="ah-input-label">{isEn ? 'Screen Placement' : 'موضع الودجت على الشاشة'}</label>
                <select
                  className="ah-input"
                  value={config.webWidget.position}
                  onChange={e => setConfig({
                    ...config,
                    webWidget: { ...config.webWidget, position: e.target.value as any }
                  })}
                >
                  <option value="bottom-right">أسفل اليمين (Bottom Right)</option>
                  <option value="bottom-left">أسفل اليسار (Bottom Left)</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Channel 2: WhatsApp Business API */}
        <Card>
          <CardHeader
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <MessageSquare size={20} style={{ color: '#25D366' }} />
                <span>{isEn ? 'WhatsApp Business Channel' : 'قناة واتساب الأعمال (WhatsApp)'}</span>
              </div>
            }
            action={
              <Badge variant={config.whatsapp.enabled ? 'success' : 'neutral'} dot>
                {config.whatsapp.enabled ? (isEn ? 'Connected' : 'متصل') : (isEn ? 'Disconnected' : 'غير متصل')}
              </Badge>
            }
          />
          <CardContent>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <label className="ah-checkbox-row">
                <input
                  type="checkbox"
                  checked={config.whatsapp.enabled}
                  onChange={e => setConfig({
                    ...config,
                    whatsapp: {
                      ...config.whatsapp,
                      enabled: e.target.checked,
                      status: e.target.checked ? 'connected' : 'disconnected'
                    }
                  })}
                />
                <span className="ah-checkbox-label">
                  {isEn ? 'Enable WhatsApp Automated Agent' : 'ربط استفسارات الواتساب بوكيل هذا القسم'}
                </span>
              </label>

              <Input
                label={isEn ? 'Official WhatsApp Number' : 'رقم الواتساب الرسمي المعتمد'}
                placeholder="+966 50 000 0000"
                value={config.whatsapp.phoneNumber}
                onChange={e => setConfig({
                  ...config,
                  whatsapp: { ...config.whatsapp, phoneNumber: e.target.value }
                })}
              />

              <div style={{
                backgroundColor: 'var(--ah-bg-subtle)',
                padding: '12px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: 12
              }}>
                <QrCode size={36} color="#0066FF" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: '11.5px', color: 'var(--ah-text-secondary)', lineHeight: 1.4 }}>
                  {isEn
                    ? 'Cloud Webhook connected to Meta WhatsApp Business API endpoint.'
                    : 'الربط مشفر ومربوط بنقطة الـ Webhook السحابية الرسمية لجامعة العلوم والتكنولوجيا.'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
        <Button
          variant="primary"
          icon={<Save size={16} />}
          isLoading={isSaving}
          onClick={handleSave}
        >
          {isEn ? 'Save Channel Settings' : 'حفظ إعدادات القنوات'}
        </Button>
      </div>
    </div>
  );
};
