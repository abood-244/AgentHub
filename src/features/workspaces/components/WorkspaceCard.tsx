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
    <div
      className="ah-workspace-card"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onClick?.()}
    >
      {/* Top Details Row */}
      <div className="ah-ws-card__top">
        <div
          className="ah-ws-card__icon-box"
          style={{ backgroundColor: getCategoryBgColor() }}
        >
          {renderCategoryIcon()}
        </div>

        <div className="ah-ws-card__info">
          <div className="ah-ws-card__headline">
            <h3 className="ah-ws-card__title">{name}</h3>
            <div className="ah-ws-card__badges-group">
              <WorkspaceStatusBadge
                status={workspace.status}
                label={isEn ? (workspace.status === 'active' ? 'Active' : 'Paused') : undefined}
              />
              <button
                type="button"
                className="ah-ws-card__menu-btn"
                aria-label="Workspace Options"
                onClick={e => {
                  e.stopPropagation();
                  onOpenMenu?.(e);
                }}
              >
                <MoreVertical size={18} />
              </button>
            </div>
          </div>
          <p className="ah-ws-card__desc">{description}</p>
        </div>
      </div>

      {/* Bottom 3-Column Metrics Row matching screenshot */}
      <div className="ah-ws-card__stats">
        <div className="ah-ws-card__stat-col">
          <span className="ah-ws-card__stat-icon">
            <Database size={17} color="#0066FF" />
          </span>
          <div className="ah-ws-card__stat-data">
            <span className="ah-ws-card__stat-num">{workspace.knowledgeSourcesCount}</span>
            <span className="ah-ws-card__stat-label">{t('statKnowledgeSources')}</span>
          </div>
        </div>

        <div className="ah-ws-card__stat-divider" />

        <div className="ah-ws-card__stat-col">
          <span className="ah-ws-card__stat-icon">
            <Bot size={17} color="#0066FF" />
          </span>
          <div className="ah-ws-card__stat-data">
            <span className="ah-ws-card__stat-num">{workspace.agentsCount}</span>
            <span className="ah-ws-card__stat-label">{t('statAgent')}</span>
          </div>
        </div>

        <div className="ah-ws-card__stat-divider" />

        <div className="ah-ws-card__stat-col">
          <span className="ah-ws-card__stat-icon">
            <Users size={17} color="#0066FF" />
          </span>
          <div className="ah-ws-card__stat-data">
            <span className="ah-ws-card__stat-num">{workspace.staffCount}</span>
            <span className="ah-ws-card__stat-label">{t('statStaff')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
