import React from 'react';
import { Card, CardContent } from '../../design-system/components/Card';
import { Badge } from '../../design-system/components/Badge';
import { useTranslation } from '../../i18n/LanguageContext';
import { MessageSquare, CheckCheck, Clock } from 'lucide-react';

export const GlobalInboxScreen: React.FC = () => {
  const { language, t } = useTranslation();
  const isEn = language === 'en';

  const mockConversations = [
    {
      id: 'inv-1',
      student: 'عبدالرحمن العتيبي',
      department: 'القبول والتسجيل',
      departmentEn: 'Admissions & Registration',
      preview: 'أريد معرفة موعد اختبار المفاضلة لكلية الطب البشري',
      previewEn: 'I want to know the entrance exam date for College of Medicine',
      channel: 'موقع الجامعة',
      time: 'منذ 8 دقائق',
      unread: true,
      handler: 'AI Agent'
    },
    {
      id: 'inv-2',
      student: 'نورة السبيعي',
      department: 'الشؤون المالية',
      departmentEn: 'Financial Affairs',
      preview: 'تم سداد القسط الثاني وأرغب برفع إيصال البنك',
      previewEn: 'Second installment paid, uploading receipt',
      channel: 'واتساب',
      time: 'منذ 25 دقيقة',
      unread: false,
      handler: 'موظف (أ. فهد)'
    },
    {
      id: 'inv-3',
      student: 'خالد المطيري',
      department: 'تقنية المعلومات',
      departmentEn: 'IT Support',
      preview: 'نسيت كلمة مرور البريد الجامعي ولا أستطيع دخول البلاك بورد',
      previewEn: 'Forgot university email password and cannot access Blackboard',
      channel: 'المحادثة الحية',
      time: 'منذ ساعتين',
      unread: false,
      handler: 'AI Agent (Resolved)'
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <h2 style={{ margin: '0 0 6px 0', fontSize: '1.45rem', fontWeight: 800 }}>
          {t('navInbox')}
        </h2>
        <p style={{ margin: 0, fontSize: '13px', color: 'var(--ah-text-secondary)' }}>
          {isEn
            ? 'Unified cross-workspace student communications stream across web widgets, WhatsApp, and portals.'
            : 'صندوق الوارد الموحد للمحادثات عبر كافة الأقسام والقنوات (الواتساب، بوابة الطالب، والموقع).'}
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {mockConversations.map(c => (
          <Card key={c.id} variant="interactive">
            <CardContent>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 42,
                    height: 42,
                    borderRadius: 12,
                    backgroundColor: '#EBF3FE',
                    color: '#0066FF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <MessageSquare size={20} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 700, fontSize: '14px' }}>{c.student}</span>
                      <Badge variant="neutral" size="sm">
                        {isEn ? c.departmentEn : c.department}
                      </Badge>
                    </div>
                    <span style={{ fontSize: '12.5px', color: 'var(--ah-text-secondary)' }}>
                      {isEn ? c.previewEn : c.preview}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                  <span style={{ fontSize: '11px', color: 'var(--ah-text-tertiary)' }}>{c.time}</span>
                  <Badge variant={c.unread ? 'primary' : 'neutral'} size="sm">
                    {c.handler}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
