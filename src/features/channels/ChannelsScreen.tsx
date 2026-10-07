import React from 'react';
import { Card, CardContent } from '../../design-system/components/Card';
import { Badge } from '../../design-system/components/Badge';
import { Button } from '../../design-system/components/Button';
import { mockChannels } from '../../services/mockData';
import { useTranslation } from '../../i18n/LanguageContext';
import { Globe, MessageSquare, MessageCircle, Users, Plus, CheckCircle2 } from 'lucide-react';

export const ChannelsScreen: React.FC = () => {
  const { language, t } = useTranslation();
  const isEn = language === 'en';

  const getChannelIcon = (type: string) => {
    switch (type) {
      case 'whatsapp': return <MessageSquare size={24} style={{ color: '#25D366' }} />;
      case 'live_chat': return <MessageCircle size={24} style={{ color: '#0066FF' }} />;
      case 'teams': return <Users size={24} style={{ color: '#6264A7' }} />;
      default: return <Globe size={24} style={{ color: '#0066FF' }} />;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ margin: '0 0 6px 0', fontSize: '1.45rem', fontWeight: 800 }}>
            {t('navChannels')}
          </h2>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--ah-text-secondary)' }}>
            {isEn
              ? 'Omnichannel integrations connecting university students to AgentHub AI agents.'
              : 'قنوات الاتصال الموحدة التي تتيح للطلاب التفاعل مع وكلاء الأقسام (الموقع، واتساب، وتيمز).'}
          </p>
        </div>
        <Button variant="primary" icon={<Plus size={16} />}>
          {isEn ? 'Connect New Channel' : 'ربط قناة جديدة'}
        </Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
        {mockChannels.map(c => (
          <Card key={c.id}>
            <CardContent>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    backgroundColor: 'var(--ah-bg-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {getChannelIcon(c.type)}
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: 700 }}>
                      {isEn ? c.nameEn : c.name}
                    </h4>
                    <span style={{ fontSize: '12px', color: 'var(--ah-text-secondary)' }}>
                      {isEn ? `Active in ${c.activeWorkspacesCount} Workspaces` : `مفعل في ${c.activeWorkspacesCount} مساحات عمل`}
                    </span>
                  </div>
                </div>

                <Badge variant={c.isConnected ? 'success' : 'neutral'} dot>
                  {c.isConnected ? (isEn ? 'Connected' : 'متصل') : (isEn ? 'Disabled' : 'غير متصل')}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
