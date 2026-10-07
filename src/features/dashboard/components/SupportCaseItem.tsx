import React from 'react';
import './SupportCaseItem.css';
import { SupportCase } from '../../../types';
import { SupportCaseStatusBadge } from '../../../design-system/components/Badge';
import { User, Bot, Headphones, Globe, MessageSquare, MessageCircle } from 'lucide-react';
import { useTranslation } from '../../../i18n/LanguageContext';

export interface SupportCaseItemProps {
  item: SupportCase;
  onClick?: () => void;
}

export const SupportCaseItem: React.FC<SupportCaseItemProps> = ({ item, onClick }) => {
  const { language, t } = useTranslation();
  const isEn = language === 'en';

  const queryTitle = isEn ? item.queryTitleEn : item.queryTitle;
  const relativeTime = isEn ? item.relativeTimeEn : item.relativeTime;

  // Actor Icon & Label
  const renderActor = () => {
    switch (item.actorRole) {
      case 'student':
        return (
          <div className="ah-case-item__actor">
            <div className="ah-case-item__avatar ah-case-item__avatar--student">
              <User size={18} />
            </div>
            <span className="ah-case-item__actor-label">{t('roleStudent')}</span>
          </div>
        );
      case 'ai':
        return (
          <div className="ah-case-item__actor">
            <div className="ah-case-item__avatar ah-case-item__avatar--ai">
              <Bot size={18} />
            </div>
            <span className="ah-case-item__actor-label">{t('roleAI')}</span>
          </div>
        );
      case 'staff':
      default:
        return (
          <div className="ah-case-item__actor">
            <div className="ah-case-item__avatar ah-case-item__avatar--staff">
              <Headphones size={18} />
            </div>
            <span className="ah-case-item__actor-label">{t('roleStaff')}</span>
          </div>
        );
    }
  };

  // Channel Icon & Name
  const renderChannel = () => {
    let icon = <Globe size={13} />;
    let name = t('channelWebsite');

    if (item.channel === 'whatsapp') {
      icon = <MessageSquare size={13} style={{ color: '#25D366' }} />;
      name = t('channelWhatsApp');
    } else if (item.channel === 'live_chat') {
      icon = <MessageCircle size={13} style={{ color: '#0066FF' }} />;
      name = t('channelLiveChat');
    }

    return (
      <span className="ah-case-item__channel">
        <span className="ah-case-item__channel-icon">{icon}</span>
        <span>{t('channelPrefix')} {name}</span>
      </span>
    );
  };

  return (
    <div
      className="ah-case-item"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onClick?.()}
    >
      {/* Actor Avatar and Role */}
      {renderActor()}

      {/* Query Content */}
      <div className="ah-case-item__content">
        <h4 className="ah-case-item__title">{queryTitle}</h4>
        <div className="ah-case-item__meta">
          {renderChannel()}
        </div>
      </div>

      {/* Status & Time */}
      <div className="ah-case-item__trailing">
        <SupportCaseStatusBadge status={item.status} />
        <span className="ah-case-item__time">{relativeTime}</span>
      </div>
    </div>
  );
};
