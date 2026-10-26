import React from 'react';
import {
  Home,
  Landmark,
  MessageSquare,
  BarChart3,
  Settings,
} from 'lucide-react';
import { useTranslation } from '../../i18n/LanguageContext';
import type { WorkspaceSection } from './WorkspaceLayout';
import './WorkspaceMobileTabBar.css';

interface WorkspaceMobileTabBarProps {
  activeSection: WorkspaceSection;
  onNavigate: (section: WorkspaceSection) => void;
  onBackToWorkspaces: () => void;
}

export const WorkspaceMobileTabBar: React.FC<WorkspaceMobileTabBarProps> = ({
  activeSection,
  onNavigate,
  onBackToWorkspaces,
}) => {
  const { language } = useTranslation();
  const isEn = language === 'en';

  return (
    <nav className="ws-mobile-tabbar" dir="rtl" aria-label={isEn ? 'Workspace Navigation' : 'تنقل مساحة العمل'}>
      {/* 1. الرئيسية (Home / Overview) */}
      <button
        type="button"
        className={`ws-mobile-tabbar__item ${activeSection === 'overview' ? 'ws-mobile-tabbar__item--active' : ''}`}
        onClick={() => onNavigate('overview')}
      >
        <div className="ws-mobile-tabbar__icon-wrap">
          <Home size={20} strokeWidth={activeSection === 'overview' ? 2.5 : 2} />
        </div>
        <span className="ws-mobile-tabbar__label">{isEn ? 'Overview' : 'الرئيسية'}</span>
      </button>

      {/* 2. مساحات العمل (Workspaces - Return to Level 1) */}
      <button
        type="button"
        className="ws-mobile-tabbar__item"
        onClick={onBackToWorkspaces}
        title={isEn ? 'Workspaces Management' : 'مساحات العمل'}
      >
        <div className="ws-mobile-tabbar__icon-wrap">
          <Landmark size={20} strokeWidth={2} />
        </div>
        <span className="ws-mobile-tabbar__label">{isEn ? 'Workspaces' : 'مساحات العمل'}</span>
      </button>

      {/* 3. المحادثات (Conversations) */}
      <button
        type="button"
        className={`ws-mobile-tabbar__item ${activeSection === 'conversations' ? 'ws-mobile-tabbar__item--active' : ''}`}
        onClick={() => onNavigate('conversations')}
      >
        <div className="ws-mobile-tabbar__icon-wrap">
          <MessageSquare size={20} strokeWidth={activeSection === 'conversations' ? 2.5 : 2} />
        </div>
        <span className="ws-mobile-tabbar__label">{isEn ? 'Conversations' : 'المحادثات'}</span>
      </button>

      {/* 4. التقارير (Reports / Insights) */}
      <button
        type="button"
        className={`ws-mobile-tabbar__item ${activeSection === 'insights' ? 'ws-mobile-tabbar__item--active' : ''}`}
        onClick={() => onNavigate('insights')}
      >
        <div className="ws-mobile-tabbar__icon-wrap">
          <BarChart3 size={20} strokeWidth={activeSection === 'insights' ? 2.5 : 2} />
        </div>
        <span className="ws-mobile-tabbar__label">{isEn ? 'Reports' : 'التقارير'}</span>
      </button>

      {/* 5. الإعدادات (Settings) */}
      <button
        type="button"
        className={`ws-mobile-tabbar__item ${activeSection === 'settings' ? 'ws-mobile-tabbar__item--active' : ''}`}
        onClick={() => onNavigate('settings')}
      >
        <div className="ws-mobile-tabbar__icon-wrap">
          <Settings size={20} strokeWidth={activeSection === 'settings' ? 2.5 : 2} />
        </div>
        <span className="ws-mobile-tabbar__label">{isEn ? 'Settings' : 'الإعدادات'}</span>
      </button>
    </nav>
  );
};
