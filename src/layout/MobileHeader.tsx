import React from 'react';
import './MobileHeader.css';
import {
  Bell,
  Search,
  ChevronDown,
  Landmark,
  Plus,
  ArrowRight,
  ArrowLeft,
  Moon,
  Sun,
  Globe
} from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext';
import { useTheme } from '../theme/ThemeContext';
import { mockOrganization } from '../services/mockData';

export interface MobileHeaderProps {
  currentScreen: string;
  subScreenTitle?: string;
  onBack?: () => void;
  onOpenSearch?: () => void;
  onCreateWorkspace?: () => void;
  onSelectWorkspaceMenu?: () => void;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  currentScreen,
  subScreenTitle,
  onBack,
  onOpenSearch,
  onCreateWorkspace,
  onSelectWorkspaceMenu,
}) => {
  const { language, toggleLanguage, t, isRTL } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const isEn = language === 'en';

  const universityName = isEn ? mockOrganization.nameEn : mockOrganization.nameAr;
  const universityRole = isEn ? mockOrganization.roleTitleEn : mockOrganization.roleTitleAr;

  const isSubScreen = Boolean(onBack);
  const isWorkspacesScreen = currentScreen === 'workspaces';

  return (
    <header className="ah-mobile-header">
      {/* Top Navbar Row */}
      <div className="ah-mobile-header__bar">
        {isSubScreen ? (
          /* Subscreen with Back Arrow */
          <>
            <button
              type="button"
              className="ah-mobile-header__back-btn"
              onClick={onBack}
              aria-label="Back"
            >
              {isRTL ? <ArrowRight size={22} /> : <ArrowLeft size={22} />}
            </button>

            <h1 className="ah-mobile-header__title ah-mobile-header__title--sub">
              {subScreenTitle || t('appTitle')}
            </h1>

            <div className="ah-mobile-header__sub-actions">
              <button
                type="button"
                className="ah-mobile-header__icon-btn"
                onClick={toggleTheme}
                title="Theme"
              >
                {theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
              </button>
            </div>
          </>
        ) : isWorkspacesScreen ? (
          /* Workspaces list screen matching screenshot */
          <>
            <button
              type="button"
              className="ah-mobile-header__icon-btn"
              onClick={onOpenSearch}
              aria-label="Search"
            >
              <Search size={22} />
            </button>

            <h1 className="ah-mobile-header__title">{t('workspacesTitle')}</h1>

            <button
              type="button"
              className="ah-mobile-header__add-btn"
              onClick={onCreateWorkspace}
              aria-label={t('createWorkspace')}
            >
              <Plus size={20} />
            </button>
          </>
        ) : (
          /* Dashboard Home Navbar */
          <>
            <button
              type="button"
              className="ah-mobile-header__icon-btn ah-mobile-header__bell"
              aria-label="Notifications"
            >
              <Bell size={22} />
              <span className="ah-mobile-header__bell-badge">
                {mockOrganization.unreadNotificationsCount}
              </span>
            </button>

            <div className="ah-mobile-header__brand">
              <span className="ah-brand-agent">Agent</span>
              <span className="ah-brand-hub">Hub</span>
            </div>

            <div className="ah-mobile-header__quick-controls">
              <button
                type="button"
                className="ah-mobile-header__icon-btn"
                onClick={toggleLanguage}
                title="Language"
              >
                <Globe size={18} />
              </button>
              <button
                type="button"
                className="ah-mobile-header__icon-btn"
                onClick={toggleTheme}
                title="Theme"
              >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            </div>
          </>
        )}
      </div>

      {/* University Selector Banner (Shown on Dashboard Home as in screenshot) */}
      {!isSubScreen && !isWorkspacesScreen && (
        <div
          className="ah-mobile-header__univ-box"
          onClick={onSelectWorkspaceMenu}
          role="button"
          tabIndex={0}
        >
          <div className="ah-mobile-header__univ-content">
            <span className="ah-mobile-header__univ-name">{universityName}</span>
            <span className="ah-mobile-header__univ-role">{universityRole}</span>
          </div>

          <div className="ah-mobile-header__univ-icon-box">
            <Landmark size={22} className="ah-mobile-header__univ-icon" />
          </div>

          <div className="ah-mobile-header__univ-arrow">
            <ChevronDown size={18} />
          </div>
        </div>
      )}
    </header>
  );
};
