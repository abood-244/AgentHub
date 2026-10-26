import React, { useEffect, useState } from 'react';
import { useTranslation } from '../../../i18n/LanguageContext';
import { apiClient } from '../../../services/apiClient';
import { Globe, MessageCircle, MessageSquare, Users, Radio } from 'lucide-react';

interface ChannelItem {
  id: number;
  name: string;
  name_en: string;
  type: string;
  icon: string;
  is_globally_enabled: boolean;
  is_linked: boolean;
  is_active: boolean;
}

interface ChannelsViewProps {
  workspaceId: string;
}

export const ChannelsView: React.FC<ChannelsViewProps> = ({ workspaceId }) => {
  const { language } = useTranslation();
  const isEn = language === 'en';
  const [channels, setChannels] = useState<ChannelItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChannels();
  }, [workspaceId]);

  const loadChannels = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<{ data: ChannelItem[] }>(`/workspaces/${workspaceId}/channels`);
      setChannels(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleLink = async (ch: ChannelItem) => {
    try {
      if (ch.is_linked) {
        await apiClient.post(`/workspaces/${workspaceId}/channels/${ch.id}/unlink`);
      } else {
        await apiClient.post(`/workspaces/${workspaceId}/channels/${ch.id}/link`);
      }
      loadChannels();
    } catch (err) {
      console.error(err);
    }
  };

  const toggleActive = async (ch: ChannelItem) => {
    try {
      if (ch.is_active) {
        await apiClient.post(`/workspaces/${workspaceId}/channels/${ch.id}/deactivate`);
      } else {
        await apiClient.post(`/workspaces/${workspaceId}/channels/${ch.id}/activate`);
      }
      loadChannels();
    } catch (err) {
      console.error(err);
    }
  };

  const renderChannelIcon = (iconName: string) => {
    switch (iconName) {
      case 'globe':
        return <Globe size={24} style={{ color: '#0284C7' }} />;
      case 'message-circle':
        return <MessageCircle size={24} style={{ color: '#059669' }} />;
      case 'message-square':
        return <MessageSquare size={24} style={{ color: '#7C3AED' }} />;
      case 'users':
        return <Users size={24} style={{ color: '#EA580C' }} />;
      default:
        return <Radio size={24} style={{ color: '#0284C7' }} />;
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
    <div dir="rtl">
      <div className="ws-view-header">
        <h1 className="ws-view-title">{isEn ? 'Channels' : 'القنوات'}</h1>
        <p className="ws-view-subtitle">
          {isEn
            ? 'Connect communication channels to this workspace'
            : 'ربط قنوات الاتصال والتكاملات بمساحة العمل'}
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
          gap: 16,
        }}
      >
        {channels.map((ch) => (
          <div
            key={ch.id}
            style={{
              padding: 22,
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: 20,
              boxShadow: '0 2px 10px rgba(10, 25, 47, 0.03)',
              transition: 'all 0.2s ease',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  marginBottom: 16,
                }}
              >
                <div
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 16,
                    background: '#F1F5F9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {renderChannelIcon(ch.icon)}
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 800,
                      color: '#0A192F',
                    }}
                  >
                    {isEn ? ch.name_en : ch.name}
                  </div>
                  <div
                    style={{
                      fontSize: 12.5,
                      color: '#64748B',
                      marginTop: 2,
                    }}
                  >
                    {ch.type.replace('_', ' ')}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button
                  className={`ws-btn ${ch.is_linked ? 'ws-btn--danger' : 'ws-btn--primary'}`}
                  onClick={() => toggleLink(ch)}
                >
                  {ch.is_linked
                    ? isEn
                      ? 'Unlink'
                      : 'إلغاء الربط'
                    : isEn
                    ? 'Link'
                    : 'ربط'}
                </button>
                {ch.is_linked && (
                  <button
                    className={`ws-btn ${ch.is_active ? '' : 'ws-btn--primary'}`}
                    onClick={() => toggleActive(ch)}
                  >
                    {ch.is_active
                      ? isEn
                        ? 'Deactivate'
                        : 'إيقاف'
                      : isEn
                      ? 'Activate'
                      : 'تفعيل'}
                  </button>
                )}
              </div>

              <div style={{ marginTop: 10, display: 'flex', gap: 6 }}>
                {ch.is_linked && (
                  <span
                    style={{
                      fontSize: 11.5,
                      padding: '3px 10px',
                      borderRadius: 9999,
                      background: '#DCFCE7',
                      color: '#15803D',
                      fontWeight: 700,
                    }}
                  >
                    {isEn ? 'Linked' : 'مربوطة'}
                  </span>
                )}
                {ch.is_active && (
                  <span
                    style={{
                      fontSize: 11.5,
                      padding: '3px 10px',
                      borderRadius: 9999,
                      background: '#EFF6FF',
                      color: '#1D4ED8',
                      fontWeight: 700,
                    }}
                  >
                    {isEn ? 'Active' : 'نشطة'}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
