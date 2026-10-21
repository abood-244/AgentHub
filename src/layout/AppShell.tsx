import React, { useState, useEffect } from 'react';
import './AppShell.css';
import { MobileHeader } from './MobileHeader';
import { MobileBottomNav } from './MobileBottomNav';
import { DesktopSidebar } from './DesktopSidebar';
import { DesktopTopBar } from './DesktopTopBar';
import { useTranslation } from '../i18n/LanguageContext';

import { MobileDrawer } from './MobileDrawer';

export interface AppShellProps {
  currentScreen: string;
  subScreenTitle?: string;
  onNavigate: (screen: string) => void;
  onBack?: () => void;
  selectedWorkspaceId?: string | null;
  onOpenCreateWorkspace?: () => void;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  currentScreen,
  subScreenTitle,
  onNavigate,
  onBack,
  selectedWorkspaceId,
  onOpenCreateWorkspace,
  children,
}) => {
  const { t } = useTranslation();
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    return typeof window !== 'undefined' ? window.innerWidth < 1024 : false;
  });
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('agenthub_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const handleToggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('agenthub_sidebar_collapsed', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const screenTitles: Record<string, string> = {
    dashboard: t('navDashboard'),
    workspaces: t('navWorkspaces'),
    'workspace-detail': subScreenTitle || t('workspacesTitle'),
    'llm-models': t('navLLMModels'),
    inbox: t('navInbox'),
    'support-cases': t('navSupportCases'),
    channels: t('navChannels'),
    knowledge: t('navKnowledge'),
    staff: t('navStaffUsers'),
    reports: t('navReports'),
    settings: t('navSettings'),
    universities: 'إدارة الجامعات',
    billing: 'الاشتراكات والفوترة',
    'system-health': 'صحة النظام',
    'platform-settings': 'إعدادات المنصة',
    notifications: 'الإشعارات',
    integrations: 'التكاملات والربط',
  };

  return (
    <div className={`ah-app-root ${isMobile ? 'ah-app-root--mobile' : 'ah-app-root--desktop'}`}>
      {isMobile ? (
        /* Pure Native Mobile Layout (Full Screen, No Mockup Frame) */
        <div className="ah-mobile-screen-wrapper">
          <MobileHeader
            currentScreen={currentScreen}
            subScreenTitle={subScreenTitle}
            onBack={onBack}
            onCreateWorkspace={onOpenCreateWorkspace}
            onOpenDrawer={() => setIsDrawerOpen(true)}
          />

          <main className="ah-mobile-main-content">
            {children}
          </main>

          {/* Show bottom nav on main tabs, hide if inside deep test-chat or back screen */}
          <MobileBottomNav
            currentScreen={currentScreen}
            onNavigate={onNavigate}
            onOpenDrawer={() => setIsDrawerOpen(true)}
          />

          {/* Side Drawer Overlay for Mobile */}
          <MobileDrawer
            isOpen={isDrawerOpen}
            onClose={() => setIsDrawerOpen(false)}
            currentScreen={currentScreen}
            onNavigate={onNavigate}
          />
        </div>
      ) : (
        /* Desktop Enterprise Shell */
        <div className={`ah-desktop-shell ${isSidebarCollapsed ? 'ah-desktop-shell--collapsed' : ''}`}>
          <DesktopSidebar
            currentScreen={currentScreen}
            onNavigate={onNavigate}
            selectedWorkspaceId={selectedWorkspaceId}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={handleToggleSidebar}
          />

          <div className="ah-desktop-main-wrapper">
            <DesktopTopBar
              breadcrumbTitle={screenTitles[currentScreen] || t('appTitle')}
              currentScreen={currentScreen}
              subScreenTitle={subScreenTitle}
              isSidebarCollapsed={isSidebarCollapsed}
              onToggleSidebar={handleToggleSidebar}
              onNavigate={onNavigate}
            />
            <main className="ah-desktop-main-content">
              {children}
            </main>
          </div>
        </div>
      )}
    </div>
  );
};
