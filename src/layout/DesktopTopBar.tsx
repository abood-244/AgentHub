import React from 'react';
import './DesktopTopBar.css';
import { Search, Globe, Moon, Sun, Bell, User as UserIcon } from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext';
import { useTheme } from '../theme/ThemeContext';
import { mockCurrentUser, mockOrganization } from '../services/mockData';

export interface DesktopTopBarProps {
  breadcrumbTitle?: string;
}

export const DesktopTopBar: React.FC<DesktopTopBarProps> = ({ breadcrumbTitle }) => {
  const { language, toggleLanguage, t } = useTranslation();
  const { theme, toggleTheme } = useTheme();

  const isEn = language === 'en';
  const userName = isEn ? mockCurrentUser.nameEn : mockCurrentUser.name;
  const userRole = isEn ? mockCurrentUser.roleLabelEn : mockCurrentUser.roleLabel;

  return (
    <header className="ah-desktop-topbar">
      <div className="ah-topbar__start">
        {breadcrumbTitle && (
          <div className="ah-topbar__breadcrumb">
            <span className="ah-topbar__breadcrumb-root">{t('appTitle')}</span>
            <span className="ah-topbar__breadcrumb-sep">/</span>
            <span className="ah-topbar__breadcrumb-current">{breadcrumbTitle}</span>
          </div>
        )}

        <div className="ah-topbar__search">
          <Search size={18} className="ah-topbar__search-icon" />
          <input
            type="text"
            className="ah-topbar__search-input"
            placeholder={t('searchGlobalPlaceholder')}
          />
        </div>
      </div>

      <div className="ah-topbar__actions">
        {/* Language Switcher */}
        <button
          type="button"
          className="ah-topbar__action-btn"
          onClick={toggleLanguage}
          title={isEn ? 'Switch to Arabic' : 'التحويل للإنجليزية'}
        >
          <Globe size={18} />
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
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Notifications */}
        <button
          type="button"
          className="ah-topbar__action-btn ah-topbar__bell-btn"
          title="Notifications"
        >
          <Bell size={18} />
          <span className="ah-topbar__badge">
            {mockOrganization.unreadNotificationsCount}
          </span>
        </button>

        <div className="ah-topbar__divider" />

        {/* User Profile */}
        <div className="ah-topbar__profile">
          <img
            src={mockCurrentUser.avatarUrl}
            alt={userName}
            className="ah-topbar__avatar"
          />
          <div className="ah-topbar__profile-info">
            <span className="ah-topbar__profile-name">{userName}</span>
            <span className="ah-topbar__profile-role">{userRole}</span>
          </div>
        </div>
      </div>
    </header>
  );
};
