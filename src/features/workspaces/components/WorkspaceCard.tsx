import React from 'react';
import './WorkspaceCard.css';
import { Workspace } from '../../../types';
import { WorkspaceStatusBadge } from '../../../design-system/components/Badge';
import {
  MoreVertical,
  Database,
  Bot,
  Users,
  Building,
  GraduationCap,
  BookOpen,
  Landmark,
  MessageSquare,
  Briefcase
} from 'lucide-react';
import { useTranslation } from '../../../i18n/LanguageContext';

export interface WorkspaceCardProps {
  workspace: Workspace;
  onClick?: () => void;
  onOpenMenu?: (e: React.MouseEvent) => void;
}

export const WorkspaceCard: React.FC<WorkspaceCardProps> = ({
  workspace,
  onClick,
  onOpenMenu,
}) => {
  const { language, t } = useTranslation();
  const isEn = language === 'en';

  const name = isEn ? workspace.nameEn : workspace.name;
  const description = isEn ? workspace.descriptionEn : workspace.description;

  // Department icon mapping
  const renderCategoryIcon = () => {
    switch (workspace.category) {
      case 'admissions':
        return <Landmark size={24} style={{ color: '#7C3AED' }} />;
      case 'student_affairs':
        return <GraduationCap size={24} style={{ color: '#0284C7' }} />;
      case 'academic':
        return <BookOpen size={24} style={{ color: '#EA580C' }} />;
      case 'finance':
        return <Building size={24} style={{ color: '#059669' }} />;
      case 'it':
        return <MessageSquare size={24} style={{ color: '#9333EA' }} />;
      case 'hr':
      default:
        return <Users size={24} style={{ color: '#EA580C' }} />;
    }
  };

  const getCategoryBgColor = () => {
    switch (workspace.category) {
      case 'admissions': return '#F3E8FF';
      case 'student_affairs': return '#E0F2FE';
      case 'academic': return '#FFEDD5';
      case 'finance': return '#DCFCE7';
      case 'it': return '#F3E8FF';
      case 'hr': return '#FFEDD5';
      default: return '#EBF3FE';
    }
  };

  return (
    <article
      className="ah-workspace-card"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onClick?.()}
      dir="rtl"
    >
      <div className="ah-ws-card__body">
        {/* Category Icon Box (Right side in RTL) */}
        <div
          className="ah-ws-card__icon-box"
          style={{ backgroundColor: getCategoryBgColor() }}
        >
          {renderCategoryIcon()}
        </div>

        {/* Content Area */}
        <div className="ah-ws-card__content">
          {/* Top Row: Status pill on left, Name on right in RTL */}
          <div className="ah-ws-card__header-row">
            <span
              className={`ah-ws-card__status-pill ${
                workspace.status === 'active'
                  ? 'ah-ws-card__status-pill--active'
                  : 'ah-ws-card__status-pill--paused'
              }`}
            >
              {isEn
                ? workspace.status === 'active'
                  ? 'Active'
                  : 'Paused'
                : workspace.status === 'active'
                ? 'نشط'
                : 'متوقف'}
            </span>

            <h3 className="ah-ws-card__title">{name}</h3>
          </div>

          {/* Subtitle & Chevron Row */}
          <div className="ah-ws-card__desc-row">
            <svg
              className="ah-ws-card__chevron"
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
            >
              <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className="ah-ws-card__desc">{description}</p>
          </div>

          {/* Bottom Row: User & Agent Counts */}
          <div className="ah-ws-card__counts-row">
            <div className="ah-ws-card__count-item">
              <span>{workspace.agentsCount || 0} {isEn ? 'Agents' : 'وكلاء'}</span>
              <Bot size={15} className="ah-ws-card__count-icon" />
            </div>

            <div className="ah-ws-card__count-item">
              <span>{workspace.staffCount || 0} {isEn ? 'Users' : 'مستخدم'}</span>
              <Users size={15} className="ah-ws-card__count-icon" />
            </div>
          </div>
        </div>
      </div>
    </article>
  );
};
