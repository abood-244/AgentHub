import React from 'react';
import './MobileHeader.css';
import {
  Bell,
  Menu,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  ArrowLeft,
  MoreVertical,
} from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext';
import { useAgentHubAuth } from '../context/AuthContext';

export interface MobileHeaderProps {
  currentScreen: string;
  subScreenTitle?: string;
  onBack?: () => void;
  onOpenSearch?: () => void;
  onCreateWorkspace?: () => void;
  onSelectWorkspaceMenu?: () => void;
  onOpenDrawer?: () => void;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  currentScreen,
  subScreenTitle,
  onBack,
  onOpenDrawer,
}) => {
  const { language, t, isRTL } = useTranslation();
  const { internalUser, role } = useAgentHubAuth();
  const isEn = language === 'en';

  const universityName =
    internalUser?.university?.name || (isEn ? 'AgentHub University' : 'جامعة العلوم والتكنولوجيا');
  const isStaff = role === 'Staff' || role === 'staff';
  const primaryWorkspace = internalUser?.workspaces?.[0];

  const headerTitle = isStaff
    ? primaryWorkspace?.name || (isEn ? 'Student Affairs' : 'شؤون الطلاب')
    : universityName;

  const headerSubtitle = isStaff
    ? universityName
    : role === 'Platform Administrator' ||
      role === 'platform_admin' ||
      role === 'platform_administrator'
    ? isEn
      ? 'Platform Administrator'
      : 'مدير المنصة'
    : isEn
    ? 'System Administrator'
    : 'System Administrator';

  const isSubScreen = Boolean(onBack);
  const isWorkspacesScreen = currentScreen === 'workspaces';

  return (
    <header className="ah-mobile-header" dir="rtl">
      {/* Top Navbar Row */}
      <nav className="ah-mobile-header__bar" data-purpose="top-navigation">
        {isSubScreen ? (
          /* Subscreen Bar (e.g. Workspace Details) */
          <>
            <button
              type="button"
              className="ah-mobile-header__back-btn"
              onClick={onBack}
              aria-label="الرجوع"
            >
              {isRTL ? (
                <ChevronRight size={22} strokeWidth={2.5} />
              ) : (
                <ChevronRight size={22} strokeWidth={2.5} style={{ transform: 'rotate(180deg)' }} />
              )}
            </button>

            <h1 className="ah-mobile-header__title ah-mobile-header__title--sub">
              {subScreenTitle || t('appTitle')}
            </h1>

            <button
              type="button"
              className="ah-mobile-header__icon-btn"
              onClick={onOpenDrawer}
              aria-label="خيارات إضافية"
            >
              <MoreVertical size={20} />
            </button>
          </>
        ) : isWorkspacesScreen ? (
          /* Workspaces Screen Navigation Header */
          <>
            <button
              type="button"
              className="ah-mobile-header__icon-btn"
              onClick={onOpenDrawer}
              aria-label="فتح القائمة"
            >
              <Menu size={24} strokeWidth={2.2} />
            </button>

            <h1 className="ah-mobile-header__title">
              {isEn ? 'Workspaces' : 'مساحات العمل'}
            </h1>

            <button
              type="button"
              className="ah-mobile-header__icon-btn ah-mobile-header__bell"
              aria-label="الإشعارات"
              onClick={onOpenDrawer}
            >
              <Bell size={22} />
              <span className="ah-mobile-header__bell-badge">3</span>
            </button>
          </>
        ) : (
          /* Dashboard Home Navbar (Matching agenthub/code.html lines 91-109) */
          <>
            {/* Notification Bell with Badge (Right side in RTL) */}
            <button
              type="button"
              className="ah-mobile-header__icon-btn ah-mobile-header__bell"
              aria-label="الإشعارات"
              onClick={onOpenDrawer}
            >
              <Bell size={22} />
              <span className="ah-mobile-header__bell-badge">3</span>
            </button>

            {/* AgentHub Brand Logo (Centered) */}
            <div className="ah-mobile-header__brand" dir="ltr">
              <span className="ah-brand-agent">Agent</span>
              <span className="ah-brand-hub">Hub</span>
            </div>

            {/* Hamburger Menu Button (Left side in RTL) */}
            <button
              type="button"
              className="ah-mobile-header__icon-btn"
              onClick={onOpenDrawer}
              aria-label="فتح القائمة"
            >
              <Menu size={26} strokeWidth={2.2} />
            </button>
          </>
        )}
      </nav>

      {/* University Identity Selector Banner (Shown on Dashboard Home matching screenshot) */}
      {!isSubScreen && !isWorkspacesScreen && (
        <section className="ah-mobile-header__univ-section" data-purpose="university-identity">
          <div
            className="ah-mobile-header__univ-box"
            onClick={onOpenDrawer}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onOpenDrawer?.()}
          >
            {/* Dropdown toggle indicator on the left in RTL */}
            <div className="ah-mobile-header__univ-toggle" aria-hidden="true">
              <ChevronDown size={16} strokeWidth={2.5} />
            </div>

            {/* University Name & Role on the right in RTL */}
            <div className="ah-mobile-header__univ-info">
              <div className="ah-mobile-header__univ-text">
                <h2 className="ah-mobile-header__univ-name">{headerTitle}</h2>
                <p className="ah-mobile-header__univ-role">{headerSubtitle}</p>
              </div>

              {/* Cyan Temple/Campus Icon */}
              <div className="ah-mobile-header__univ-icon-box" aria-hidden="true">
                <svg className="w-8 h-8" width="30" height="30" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L2 7V9H22V7L12 2ZM4 11V18H6V11H4ZM9 11V18H11V11H9ZM13 11V18H15V11H13ZM18 11V18H20V11H18ZM2 20V22H22V20H2Z" />
                </svg>
              </div>
            </div>
          </div>
        </section>
      )}
    </header>
  );
};

