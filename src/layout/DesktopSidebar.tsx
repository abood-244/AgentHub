import React from 'react';
import './DesktopSidebar.css';
import {
  Home,
  Landmark,
  Cpu,
  MessageSquare,
  LifeBuoy,
  Database,
  Radio,
  Users,
  BarChart3,
  Settings,
  ChevronRight,
  ChevronLeft,
  Sparkles
} from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext';
import { mockOrganization } from '../services/mockData';

export interface DesktopSidebarProps {
  currentScreen: string;
  onNavigate: (screen: string) => void;
  selectedWorkspaceId?: string | null;
}

export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({
  currentScreen,
  onNavigate,
  selectedWorkspaceId,
}) => {
  const { language, t, isRTL } = useTranslation();
  const isEn = language === 'en';

  const navItems = [
    { id: 'dashboard', label: t('navDashboard'), icon: <Home size={20} /> },
    { id: 'workspaces', label: t('navWorkspaces'), icon: <Landmark size={20} />, badge: '6' },
    { id: 'llm-models', label: t('navLLMModels'), icon: <Cpu size={20} />, isAiBadge: true },
    { id: 'inbox', label: t('navInbox'), icon: <MessageSquare size={20} />, badge: '12' },
    { id: 'support-cases', label: t('navSupportCases'), icon: <LifeBuoy size={20} />, badge: '4' },
    { id: 'channels', label: t('navChannels'), icon: <Radio size={20} /> },
    { id: 'knowledge', label: t('navKnowledge'), icon: <Database size={20} /> },
    { id: 'staff', label: t('navStaffUsers'), icon: <Users size={20} /> },
    { id: 'reports', label: t('navReports'), icon: <BarChart3 size={20} /> },
    { id: 'settings', label: t('navSettings'), icon: <Settings size={20} /> },
  ];

  return (
    <aside className="ah-desktop-sidebar">
      {/* Brand Header */}
      <div className="ah-sidebar__brand-box">
        <div className="ah-sidebar__brand-logo">
          <div className="ah-sidebar__logo-gem">
            <Sparkles size={20} color="#FFFFFF" />
          </div>
          <div className="ah-sidebar__brand-text">
            <span className="ah-sidebar__brand-main">Agent</span>
            <span className="ah-sidebar__brand-accent">Hub</span>
          </div>
        </div>
        <span className="ah-sidebar__version-tag">v2.4 Core</span>
      </div>

      {/* University Org Card */}
      <div className="ah-sidebar__org-card">
        <div className="ah-sidebar__org-icon">
          <Landmark size={20} color="#0084FF" />
        </div>
        <div className="ah-sidebar__org-info">
          <span className="ah-sidebar__org-title">
            {isEn ? mockOrganization.nameEn : mockOrganization.nameAr}
          </span>
          <span className="ah-sidebar__org-sub">
            {isEn ? mockOrganization.roleTitleEn : mockOrganization.roleTitleAr}
          </span>
        </div>
      </div>

      {/* Main Nav Links */}
      <div className="ah-sidebar__nav-section">
        <span className="ah-sidebar__nav-section-title">
          {isEn ? 'PLATFORM NAVIGATION' : 'التنقل في المنصة'}
        </span>
        <nav className="ah-sidebar__nav-list">
          {navItems.map(item => {
            const isActive = currentScreen === item.id;
            return (
              <button
                key={item.id}
                type="button"
                className={`ah-sidebar__nav-item ${isActive ? 'ah-sidebar__nav-item--active' : ''}`}
                onClick={() => onNavigate(item.id)}
              >
                <span className="ah-sidebar__nav-icon">{item.icon}</span>
                <span className="ah-sidebar__nav-label">{item.label}</span>

                {item.isAiBadge && (
                  <span className="ah-sidebar__ai-badge">AI</span>
                )}

                {item.badge && !item.isAiBadge && (
                  <span className="ah-sidebar__count-badge">{item.badge}</span>
                )}

                <span className="ah-sidebar__nav-arrow">
                  {isRTL ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Info */}
      <div className="ah-sidebar__footer">
        <div className="ah-sidebar__status-badge">
          <span className="ah-sidebar__status-dot" />
          <span>{isEn ? 'AI Cluster Operational' : 'نواة الذكاء الاصطناعي متصلة'}</span>
        </div>
      </div>
    </aside>
  );
};
