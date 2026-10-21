import React from 'react';
import './DesktopTopBar.css';
import { Sidebar, Globe, Moon, Sun, Bell, Landmark, Sparkles, Search } from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext';
import { useTheme } from '../theme/ThemeContext';
import { useAgentHubAuth } from '../context/AuthContext';
import { mockOrganization } from '../services/mockData';

export interface DesktopTopBarProps {
  breadcrumbTitle?: string;
  currentScreen?: string;
  subScreenTitle?: string;
  isSidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
  onNavigate?: (screen: string) => void;
}

export const DesktopTopBar: React.FC<DesktopTopBarProps> = ({
  breadcrumbTitle,
  subScreenTitle,
  isSidebarCollapsed = false,
  onToggleSidebar,
  onNavigate,
}) => {
  const { language, toggleLanguage, isRTL, t } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const { internalUser, role } = useAgentHubAuth();

  const isEn = language === 'en';
  const isStaff = role === 'Staff' || role === 'staff';
  const isPlatformAdmin =
    role === 'Platform Administrator' ||
    role === 'platform_admin' ||
    role === 'platform_administrator';

  const universityName = internalUser?.university?.name || (isEn ? 'AgentHub University' : 'جامعة العلوم والتكنولوجيا');

  const unreadCount = mockOrganization?.unreadNotificationsCount || 0;

  return (
    <header className="ah-desktop-topbar">
      {/* Start Section (Sidebar Toggle, Page Title, Org/Workspace Pill Badge) */}
      <div className="ah-topbar__start">
        {/* Sidebar Toggle Button (Matching Reference Screenshots 1-3) */}
        <button
          type="button"
          className="ah-topbar__toggle-btn"
          onClick={onToggleSidebar}
          aria-label={
            isSidebarCollapsed
              ? (isEn ? 'Expand sidebar' : 'توسيع القائمة الجانبية')
              : (isEn ? 'Collapse sidebar' : 'طي القائمة الجانبية')
          }
          title={
            isSidebarCollapsed
              ? (isEn ? 'Expand sidebar' : 'توسيع القائمة الجانبية')
              : (isEn ? 'Collapse sidebar' : 'طي القائمة الجانبية')
          }
        >
          <Sidebar
            size={20}
            style={{ transform: isRTL ? 'scaleX(-1)' : undefined }}
          />
        </button>

        {/* Page Title */}
        <h1 className="ah-topbar__title">
          {breadcrumbTitle || (isEn ? 'Dashboard' : 'لوحة التحكم')}
        </h1>

        {/* Institution / Workspace Badge Pill (Matching "Testing A" in reference screenshots) */}
        <div
          className={`ah-topbar__badge-pill ${
            isPlatformAdmin ? 'ah-topbar__badge-pill--platform' : ''
          }`}
          title={
            isPlatformAdmin
              ? (isEn ? 'Platform Administrator Scope' : 'صلاحيات إدارة المنصة')
              : universityName
          }
        >
          <span className="ah-topbar__badge-pill-icon">
            {isPlatformAdmin ? <Sparkles size={13} /> : <Landmark size={13} />}
          </span>
          <span className="ah-topbar__badge-pill-text">
            {isPlatformAdmin
              ? (isEn ? 'Platform Ops' : 'إشراف المنصة')
              : isStaff && subScreenTitle
              ? subScreenTitle
              : universityName}
          </span>
          <span className="ah-topbar__badge-pill-tag">
            {isStaff ? 'Staff' : isPlatformAdmin ? 'Root' : 'Admin'}
          </span>
        </div>
      </div>

      {/* End Actions Section */}
      <div className="ah-topbar__actions">
        {/* Subtle Search input */}
        <div className="ah-topbar__search">
          <Search size={16} className="ah-topbar__search-icon" />
          <input
            type="text"
            className="ah-topbar__search-input"
            placeholder={isEn ? 'Search...' : 'بحث سريع...'}
          />
        </div>

        {/* Language Switcher */}
        <button
          type="button"
          className="ah-topbar__action-btn"
          onClick={toggleLanguage}
          title={isEn ? 'Switch to Arabic' : 'التحويل للإنجليزية'}
          aria-label={isEn ? 'Switch to Arabic' : 'التحويل للإنجليزية'}
        >
          <Globe size={16} />
          <span className="ah-topbar__action-label">
            {language === 'ar' ? 'English' : 'العربية'}
          </span>
        </button>

        {/* Theme Switcher */}
        <button
          type="button"
          className="ah-topbar__action-btn"
          onClick={toggleTheme}
          title={theme === 'dark' ? t('themeLight') : t('themeDark')}
          aria-label={theme === 'dark' ? t('themeLight') : t('themeDark')}
        >
          {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        {/* Notifications */}
        <button
          type="button"
          className="ah-topbar__action-btn ah-topbar__bell-btn"
          onClick={() => onNavigate?.('notifications')}
          title={isEn ? 'Notifications' : 'الإشعارات'}
          aria-label={isEn ? 'Notifications' : 'الإشعارات'}
        >
          <Bell size={17} />
          {unreadCount > 0 && (
            <span className="ah-topbar__badge">{unreadCount}</span>
          )}
        </button>
      </div>
    </header>
  );
};

