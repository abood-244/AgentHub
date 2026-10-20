import React from 'react';
import './MobileDrawer.css';
import {
  X,
  Home,
  Landmark,
  MessageSquare,
  Bot,
  Users,
  BarChart3,
  Radio,
  Settings,
  LogOut,
  Moon,
  Sun,
  Globe,
  ChevronLeft,
  ChevronRight,
  User as UserIcon,
  CreditCard,
  Activity,
  Layers,
  Bell,
  Sliders,
  BookOpen,
} from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext';
import { useTheme } from '../theme/ThemeContext';
import { useAgentHubAuth } from '../context/AuthContext';

export interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentScreen: string;
  onNavigate: (screen: string) => void;
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({
  isOpen,
  onClose,
  currentScreen,
  onNavigate,
}) => {
  const { t, language, toggleLanguage, isRTL } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const { internalUser, role, signOut } = useAgentHubAuth();

  if (!isOpen) return null;

  const isEn = language === 'en';

  const isStaff = role === 'Staff' || role === 'staff';
  const isPlatformAdmin = role === 'Platform Administrator' || role === 'platform_admin' || role === 'platform_administrator';
  const isSystemAdmin = !isStaff && !isPlatformAdmin;

  const roleDisplay = isStaff
    ? (isEn ? 'Staff' : 'موظف (Staff)')
    : isPlatformAdmin
    ? (isEn ? 'Platform Administrator' : 'مدير المنصة (Platform Administrator)')
    : (isEn ? 'System Administrator' : 'مدير النظام (System Administrator)');

  const userDisplayName = internalUser?.name || (isEn ? 'Authorized User' : 'مستخدم مصرح');

  const handleItemClick = (screen: string) => {
    onNavigate(screen);
    onClose();
  };

  let navItems: Array<{
    id: string;
    label: string;
    icon: React.ReactNode;
    badge?: string;
  }> = [];

  if (isPlatformAdmin) {
    navItems = [
      { id: 'dashboard', label: isEn ? 'Platform Overview' : 'لوحة المنصة', icon: <Home size={19} /> },
      { id: 'universities', label: isEn ? 'Universities' : 'إدارة الجامعات', icon: <Landmark size={19} />, badge: 'Coming Soon' },
      { id: 'billing', label: isEn ? 'Subscriptions & Billing' : 'الاشتراكات والفوترة', icon: <CreditCard size={19} />, badge: 'Coming Soon' },
      { id: 'system-health', label: isEn ? 'System Health' : 'صحة النظام', icon: <Activity size={19} />, badge: 'Coming Soon' },
      { id: 'platform-settings', label: isEn ? 'Platform Settings' : 'إعدادات المنصة', icon: <Sliders size={19} />, badge: 'Coming Soon' },
      { id: 'notifications', label: isEn ? 'Notifications' : 'الإشعارات', icon: <Bell size={19} />, badge: 'Coming Soon' },
      { id: 'integrations', label: isEn ? 'Integrations' : 'التكاملات والربط', icon: <Layers size={19} />, badge: 'Coming Soon' },
      { id: 'settings', label: t('navSettings'), icon: <Settings size={19} /> },
    ];
  } else if (isStaff) {
    navItems = [
      { id: 'dashboard', label: isEn ? 'Dashboard' : 'الرئيسية', icon: <Home size={19} /> },
      { id: 'workspaces', label: isEn ? 'Workspaces' : 'مساحات العمل', icon: <Landmark size={19} /> },
      { id: 'inbox', label: isEn ? 'Conversations' : 'المحادثات', icon: <MessageSquare size={19} /> },
      { id: 'agents', label: 'Agent Profile', icon: <Bot size={19} /> },
      { id: 'knowledge', label: isEn ? 'Knowledge Base' : 'قاعدة المعرفة', icon: <BookOpen size={19} /> },
      { id: 'channels', label: isEn ? 'Channels' : 'القنوات', icon: <Radio size={19} /> },
      { id: 'reports', label: isEn ? 'Reports' : 'التقارير', icon: <BarChart3 size={19} /> },
      { id: 'settings', label: isEn ? 'Settings' : 'الإعدادات', icon: <Settings size={19} /> },
      { id: 'notifications', label: isEn ? 'Notifications' : 'الإشعارات', icon: <Bell size={19} />, badge: '3' },
    ];
  } else {
    // System Administrator (Matching agenthub_sidebar_menu_drawer/code.html)
    navItems = [
      { id: 'dashboard', label: t('navDashboard'), icon: <Home size={19} /> },
      { id: 'workspaces', label: t('navWorkspaces'), icon: <Landmark size={19} /> },
      { id: 'inbox', label: t('navInbox'), icon: <MessageSquare size={19} /> },
      { id: 'agents', label: isEn ? 'Agent Management' : 'إدارة الوكلاء', icon: <Bot size={19} /> },
      { id: 'staff', label: t('navStaffUsers'), icon: <Users size={19} /> },
      { id: 'reports', label: t('navReports'), icon: <BarChart3 size={19} /> },
      { id: 'channels', label: t('navChannels'), icon: <Radio size={19} /> },
      { id: 'settings', label: t('navSettings'), icon: <Settings size={19} /> },
      { id: 'more', label: isEn ? 'Activity Log' : 'سجل الأنشطة', icon: <Layers size={19} /> },
      { id: 'notifications', label: isEn ? 'Notifications' : 'الإشعارات', icon: <Bell size={19} />, badge: '3' },
    ];
  }

  const ArrowIcon = isRTL ? ChevronLeft : ChevronRight;

  const universityTitle =
    internalUser?.university?.name || (isEn ? 'AgentHub University' : 'جامعة العلوم والتكنولوجيا');

  return (
    <div className="ah-mobile-drawer-backdrop" onClick={onClose} role="presentation">
      <aside
        className="ah-mobile-drawer"
        onClick={(e) => e.stopPropagation()}
        aria-label="القائمة الجانبية"
        dir="rtl"
      >
        {/* Header */}
        <div className="ah-drawer-header">
          <div className="ah-drawer-logo" dir="ltr">
            <span className="ah-drawer-logo__main">Agent</span>
            <span className="ah-drawer-logo__accent">Hub</span>
          </div>

          <button
            type="button"
            className="ah-drawer-close-btn"
            onClick={onClose}
            aria-label="إغلاق القائمة"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="ah-drawer-body">
          {/* User Profile Card (Matching stitch replica) */}
          <div className="ah-drawer-user-card">
            <div className="ah-drawer-user-info">
              <span className="ah-drawer-user-name">{userDisplayName}</span>
              <span className="ah-drawer-user-role">{roleDisplay}</span>
            </div>
            <div className="ah-drawer-user-avatar">
              <UserIcon size={22} />
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="ah-drawer-nav" aria-label="القائمة الرئيسية">
            {navItems.map((item) => {
              const isActive = currentScreen === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`ah-drawer-nav-item ${isActive ? 'ah-drawer-nav-item--active' : ''}`}
                  onClick={() => handleItemClick(item.id)}
                >
                  <div className="ah-drawer-nav-item-content">
                    <span className="ah-drawer-nav-icon">{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                  {item.badge ? (
                    <span className="ah-drawer-nav-badge">{item.badge}</span>
                  ) : (
                    <ArrowIcon size={16} color="#94a3b8" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Preferences Box */}
          <div className="ah-drawer-prefs">
            <button
              type="button"
              className="ah-drawer-pref-row"
              onClick={toggleTheme}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
                <span>{theme === 'dark' ? (isEn ? 'Light Mode' : 'الوضع النهاري') : (isEn ? 'Dark Mode' : 'الوضع الليلي')}</span>
              </div>
              <span style={{ fontSize: 11, color: '#0878f9', fontWeight: 700 }}>
                {theme.toUpperCase()}
              </span>
            </button>

            <button
              type="button"
              className="ah-drawer-pref-row"
              onClick={toggleLanguage}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Globe size={17} />
                <span>{isEn ? 'العربية' : 'English'}</span>
              </div>
              <span style={{ fontSize: 11, color: '#0878f9', fontWeight: 700 }}>
                {language.toUpperCase()}
              </span>
            </button>
          </div>

          {/* Organization / Active Subscription Card with Campus Photo Banner (Admin only) */}
          {!isStaff && (
            <div
              className="ah-drawer-org-card"
              data-purpose="organization-subscription-card"
              onClick={() => handleItemClick('settings')}
              role="button"
              tabIndex={0}
            >
              <div className="ah-drawer-org-banner">
                <img
                  alt={universityTitle}
                  className="ah-drawer-org-img"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuC-Lvj8U7zCs0JG8e2CqFOnzPStK6UopJvzEk12NXMxn4K3jHRRHqLDKtbETE-MoRhuET3dgm5jOSLVrBYxlGZp75HWr6NLq4wkwU3T4BJsWtAinv4ZRMsPyv5xRrN0U7RnRQY1LnbDBBE3MgwInBtjX-jr5z9f7BX51_77kZ4UvDBDgMIyxgCudosNjms2is638ooPhDM4uJgWrRpUqwvGuBXVpPWUX1N4PNKXu43-Xp95Xrz0oAGCXg"
                />
              </div>
              <div className="ah-drawer-org-body">
                <div className="ah-drawer-org-header-row">
                  <span className="ah-drawer-org-title">{universityTitle}</span>
                  <ArrowIcon size={14} color="#0878F9" />
                </div>
                <div className="ah-drawer-org-status">
                  <span className="ah-drawer-org-dot" />
                  <span>{isEn ? 'Active Subscription' : 'الاشتراك النشط'}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Drawer Footer with Clerk SignOut */}
        <div className="ah-drawer-footer">
          <button
            type="button"
            className="ah-drawer-logout-btn"
            onClick={async () => {
              onClose();
              await signOut();
            }}
          >
            <LogOut size={18} />
            <span>{isEn ? 'Sign Out' : 'تسجيل الخروج'}</span>
          </button>
        </div>
      </aside>
    </div>
  );
};
