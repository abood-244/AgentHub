import React, { useState, useRef, useEffect } from 'react';
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
  Sparkles,
  CreditCard,
  Activity,
  Layers,
  Bell,
  LogOut,
} from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext';
import { useAgentHubAuth } from '../context/AuthContext';

export interface DesktopSidebarProps {
  currentScreen: string;
  onNavigate: (screen: string) => void;
  selectedWorkspaceId?: string | null;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({
  currentScreen,
  onNavigate,
  isCollapsed = false,
}) => {
  const { language, t, isRTL } = useTranslation();
  const { internalUser, role, signOut } = useAgentHubAuth();
  const isEn = language === 'en';

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close user popup on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserMenuOpen]);

  const isStaff = role === 'Staff' || role === 'staff';
  const isPlatformAdmin =
    role === 'Platform Administrator' ||
    role === 'platform_admin' ||
    role === 'platform_administrator';

  const universityName = internalUser?.university?.name || (isEn ? 'AgentHub University' : 'جامعة العلوم والتكنولوجيا');
  const roleTitle = isStaff
    ? (isEn ? 'Staff Member' : 'عضو هيئة تدريس / موظف')
    : isPlatformAdmin
      ? (isEn ? 'Platform Administrator' : 'مدير المنصة')
      : (isEn ? 'System Administrator' : 'مدير النظام الجامعي');

  const userName = internalUser?.name || (isEn ? 'Authorized User' : 'مستخدم مصرح');
  const userEmail = internalUser?.email || 'admin@agenthub.dev';
  const userInitial = (userName.charAt(0) || 'U').toUpperCase();

  let navItems: Array<{
    id: string;
    label: string;
    icon: React.ReactNode;
    badge?: string;
    isAiBadge?: boolean;
  }> = [];

  if (isPlatformAdmin) {
    navItems = [
      { id: 'dashboard', label: isEn ? 'Platform Overview' : 'لوحة المنصة', icon: <Home size={20} /> },
      { id: 'universities', label: isEn ? 'Universities' : 'إدارة الجامعات', icon: <Landmark size={20} /> },
      { id: 'billing', label: isEn ? 'Subscriptions & Billing' : 'الاشتراكات والفوترة', icon: <CreditCard size={20} /> },
      { id: 'system-health', label: isEn ? 'System Health' : 'صحة النظام', icon: <Activity size={20} /> },
      { id: 'notifications', label: isEn ? 'Notifications' : 'الإشعارات', icon: <Bell size={20} /> },
      { id: 'integrations', label: isEn ? 'Integrations' : 'التكاملات والربط', icon: <Layers size={20} /> },
    ];
  } else if (isStaff) {
    navItems = [
      { id: 'dashboard', label: t('navDashboard'), icon: <Home size={20} /> },
      { id: 'workspaces', label: t('navWorkspaces'), icon: <Landmark size={20} />, badge: String(internalUser?.workspaces?.length || 0) },
      { id: 'inbox', label: t('navInbox'), icon: <MessageSquare size={20} /> },
      { id: 'support-cases', label: t('navSupportCases'), icon: <LifeBuoy size={20} /> },
    ];
  } else {
    // System Administrator
    navItems = [
      { id: 'dashboard', label: t('navDashboard'), icon: <Home size={20} /> },
      { id: 'workspaces', label: t('navWorkspaces'), icon: <Landmark size={20} /> },
      { id: 'llm-models', label: t('navLLMModels'), icon: <Cpu size={20} />, isAiBadge: true },
      { id: 'inbox', label: t('navInbox'), icon: <MessageSquare size={20} /> },
      { id: 'support-cases', label: t('navSupportCases'), icon: <LifeBuoy size={20} /> },
      { id: 'channels', label: t('navChannels'), icon: <Radio size={20} /> },
      { id: 'knowledge', label: t('navKnowledge'), icon: <Database size={20} /> },
      { id: 'staff', label: t('navStaffUsers'), icon: <Users size={20} /> },
      { id: 'reports', label: t('navReports'), icon: <BarChart3 size={20} /> },
    ];
  }

  return (
    <aside className={`ah-desktop-sidebar ${isCollapsed ? 'ah-desktop-sidebar--collapsed' : ''}`}>
      {/* Brand Header */}
      <div className="ah-sidebar__brand-box">
        <div className="ah-sidebar__brand-logo" title="AgentHub Enterprise">
          <div className="ah-sidebar__logo-gem">
            <Sparkles size={20} color="#FFFFFF" />
          </div>
          {!isCollapsed && (
            <div className="ah-sidebar__brand-text">
              <span className="ah-sidebar__brand-main">Agent</span>
              <span className="ah-sidebar__brand-accent">Hub</span>
            </div>
          )}
        </div>
        {!isCollapsed && (
          <span className="ah-sidebar__version-tag">v2.4 Core</span>
        )}
      </div>

      {/* University / Organization Badge Card */}
      <div
        className="ah-sidebar__org-card"
        title={isPlatformAdmin ? (isEn ? 'Core Platform Operations' : 'إشراف المنصة المركزية') : universityName}
      >
        <div className="ah-sidebar__org-icon">
          <Landmark size={isCollapsed ? 20 : 18} color="#0084FF" />
        </div>
        {!isCollapsed && (
          <div className="ah-sidebar__org-info">
            <span className="ah-sidebar__org-title">
              {isPlatformAdmin ? (isEn ? 'Core Platform Operations' : 'إشراف المنصة المركزية') : universityName}
            </span>
            <span className="ah-sidebar__org-sub">
              {roleTitle}
            </span>
          </div>
        )}
      </div>

      {/* Main Nav Links */}
      <div className="ah-sidebar__nav-section">
        {!isCollapsed && (
          <span className="ah-sidebar__nav-section-title">
            {isEn ? 'PLATFORM NAVIGATION' : 'التنقل في المنصة'}
          </span>
        )}
        <nav className="ah-sidebar__nav-list">
          {navItems.map(item => {
            const isActive = currentScreen === item.id;
            return (
              <button
                key={item.id}
                type="button"
                className={`ah-sidebar__nav-item ${isActive ? 'ah-sidebar__nav-item--active' : ''}`}
                onClick={() => onNavigate(item.id)}
                title={isCollapsed ? item.label : undefined}
                aria-label={item.label}
              >
                <span className="ah-sidebar__nav-icon">{item.icon}</span>

                {!isCollapsed && (
                  <span className="ah-sidebar__nav-label">{item.label}</span>
                )}

                {!isCollapsed && item.isAiBadge && (
                  <span className="ah-sidebar__ai-badge">AI</span>
                )}

                {!isCollapsed && item.badge && !item.isAiBadge && (
                  <span className="ah-sidebar__count-badge">{item.badge}</span>
                )}

                {isCollapsed && (item.isAiBadge || item.badge) && (
                  <span className="ah-sidebar__collapsed-dot" />
                )}

                {!isCollapsed && (
                  <span className="ah-sidebar__nav-arrow">
                    {isRTL ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* User Profile & Menu Footer (Matching Reference Screenshot 2 & 3) */}
      <div className="ah-sidebar__footer" ref={userMenuRef}>
        {/* User Popover Menu */}
        {isUserMenuOpen && (
          <div className="ah-sidebar__user-popover" role="dialog" aria-label="قائمة المستخدم">
            <div className="ah-sidebar__user-popover-header">
              <div className="ah-sidebar__popover-avatar">
                {userInitial}
              </div>
              <div className="ah-sidebar__popover-details">
                <span className="ah-sidebar__popover-name">{userName}</span>
                <span className="ah-sidebar__popover-email">{userEmail}</span>
              </div>
            </div>

            <div className="ah-sidebar__popover-divider" />

            <div className="ah-sidebar__popover-actions">
              <button
                type="button"
                className="ah-sidebar__popover-item"
                onClick={() => {
                  setIsUserMenuOpen(false);
                  onNavigate(isPlatformAdmin ? 'platform-settings' : 'settings');
                }}
              >
                <Settings size={16} />
                <span>
                  {isPlatformAdmin
                    ? (isEn ? 'Platform Settings' : 'إعدادات المنصة')
                    : (isEn ? 'Settings' : 'الإعدادات')}
                </span>
              </button>
              <button
                type="button"
                className="ah-sidebar__popover-item ah-sidebar__popover-item--danger"
                onClick={() => {
                  setIsUserMenuOpen(false);
                  signOut();
                }}
              >
                <LogOut size={16} />
                <span>{isEn ? 'Sign Out' : 'تسجيل الخروج'}</span>
              </button>
            </div>
          </div>
        )}

        {/* User Info Trigger */}
        <button
          type="button"
          className="ah-sidebar__user-card"
          onClick={() => setIsUserMenuOpen(prev => !prev)}
          title={isCollapsed ? `${userName} (${roleTitle})` : undefined}
          aria-expanded={isUserMenuOpen}
        >
          <div className="ah-sidebar__user-avatar">
            {userInitial}
          </div>
          {!isCollapsed && (
            <div className="ah-sidebar__user-meta">
              <span className="ah-sidebar__user-name">{userName}</span>
              <span className="ah-sidebar__user-role">{roleTitle}</span>
            </div>
          )}
        </button>
      </div>
    </aside>
  );
};

