import React from 'react';
import './WorkspaceCard.css';
import { Workspace } from '../../../types';
import {
  Database,
  Bot,
  Users,
  Building,
  GraduationCap,
  BookOpen,
  Landmark,
  MessageSquare,
  ArrowLeft,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { useTranslation } from '../../../i18n/LanguageContext';

export interface WorkspaceCardProps {
  workspace: Workspace;
  onClick?: () => void;
  onOpenMenu?: (e: React.MouseEvent) => void;
  viewMode?: 'grid' | 'list';
}

export const WorkspaceCard: React.FC<WorkspaceCardProps> = ({
  workspace,
  onClick,
  viewMode = 'grid',
}) => {
  const { language } = useTranslation();
  const isEn = language === 'en';

  const name = isEn ? (workspace.nameEn || workspace.name) : workspace.name;
  const description = isEn ? (workspace.descriptionEn || workspace.description) : workspace.description;

  // Department icon mapping
  const renderCategoryIcon = () => {
    switch (workspace.category) {
      case 'admissions':
        return <Landmark size={22} style={{ color: '#7C3AED' }} />;
      case 'student_affairs':
        return <GraduationCap size={22} style={{ color: '#0284C7' }} />;
      case 'academic':
        return <BookOpen size={22} style={{ color: '#EA580C' }} />;
      case 'finance':
        return <Building size={22} style={{ color: '#059669' }} />;
      case 'it':
        return <MessageSquare size={22} style={{ color: '#9333EA' }} />;
      case 'hr':
      default:
        return <Users size={22} style={{ color: '#2563EB' }} />;
    }
  };

  const getCategoryBgColor = () => {
    switch (workspace.category) {
      case 'admissions': return '#F3E8FF';
      case 'student_affairs': return '#E0F2FE';
      case 'academic': return '#FFEDD5';
      case 'finance': return '#DCFCE7';
      case 'it': return '#F5F3FF';
      case 'hr': return '#DBEAFE';
      default: return '#EFF6FF';
    }
  };

  const getCategoryLabel = () => {
    switch (workspace.category) {
      case 'admissions': return isEn ? 'Admissions' : 'القبول والتسجيل';
      case 'student_affairs': return isEn ? 'Student Affairs' : 'شؤون الطلاب';
      case 'academic': return isEn ? 'Academic' : 'الشؤون الأكاديمية';
      case 'finance': return isEn ? 'Finance' : 'الشؤون المالية';
      case 'it': return isEn ? 'IT & Tech' : 'تقنية المعلومات';
      case 'hr': return isEn ? 'Human Resources' : 'الموارد البشرية';
      default: return isEn ? 'General' : 'قسم عام';
    }
  };

  return (
    <article
      className={`ah-workspace-card ${viewMode === 'list' ? 'ah-workspace-card--list' : ''}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onClick?.()}
      dir="rtl"
    >
      {/* ── Top Header Row: Icon & Status ── */}
      <div className="ah-ws-card__top">
        <div
          className="ah-ws-card__icon-box"
          style={{ backgroundColor: getCategoryBgColor() }}
        >
          {renderCategoryIcon()}
        </div>

        <div className="ah-ws-card__badges">
          <span className="ah-ws-card__cat-pill">
            {getCategoryLabel()}
          </span>

          <span
            className={`ah-ws-card__status-pill ${
              workspace.status === 'active'
                ? 'ah-ws-card__status-pill--active'
                : 'ah-ws-card__status-pill--paused'
            }`}
          >
            <span className="ah-ws-card__status-dot" />
            <span>
              {workspace.status === 'active'
                ? (isEn ? 'Active' : 'نشط')
                : (isEn ? 'Paused' : 'متوقف')}
            </span>
          </span>
        </div>
      </div>

      {/* ── Main Info: Title & Description ── */}
      <div className="ah-ws-card__main">
        <h3 className="ah-ws-card__title" title={name}>
          {name}
        </h3>

        <p className="ah-ws-card__desc" title={description}>
          {description || (isEn ? 'Department workspace ready for AI agent integration.' : 'مساحة عمل مخصصة للقسم والوكلاء الأذكياء.')}
        </p>
      </div>

      {/* ── Metrics / Capabilities Row ── */}
      <div className="ah-ws-card__metrics">
        <div className="ah-ws-card__metric-item" title={isEn ? 'Active AI Agents' : 'الوكلاء الأذكياء'}>
          <Bot size={14} className="ah-ws-card__metric-icon" />
          <span>{workspace.agentsCount || 1} {isEn ? 'Agent' : 'وكيل'}</span>
        </div>

        <div className="ah-ws-card__metric-item" title={isEn ? 'Authorized Staff' : 'المستخدمين المصرحين'}>
          <Users size={14} className="ah-ws-card__metric-icon" />
          <span>{workspace.staffCount || 0} {isEn ? 'Staff' : 'موظف'}</span>
        </div>

        <div className="ah-ws-card__metric-item" title={isEn ? 'Knowledge Base' : 'قاعدة المعرفة'}>
          <Database size={14} className="ah-ws-card__metric-icon" />
          <span>{workspace.knowledgeSourcesCount || 0} {isEn ? 'Docs' : 'ملفات'}</span>
        </div>
      </div>

      {/* ── Card Footer: Action Link ── */}
      <div className="ah-ws-card__footer">
        <span className="ah-ws-card__enter-text">
          {isEn ? 'Open Workspace' : 'دخول مساحة العمل'}
        </span>
        <div className="ah-ws-card__arrow-circle">
          <ArrowLeft size={15} className="ah-ws-card__arrow-icon" />
        </div>
      </div>
    </article>
  );
};
