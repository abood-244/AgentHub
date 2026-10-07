import React, { useState, useEffect } from 'react';
import './AppShell.css';
import { MobileHeader } from './MobileHeader';
import { MobileBottomNav } from './MobileBottomNav';
import { DesktopSidebar } from './DesktopSidebar';
import { DesktopTopBar } from './DesktopTopBar';
import { useTranslation } from '../i18n/LanguageContext';

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
          />

          <main className="ah-mobile-main-content">
            {children}
          </main>

          {/* Show bottom nav on main tabs, hide if inside deep test-chat or back screen */}
          <MobileBottomNav
            currentScreen={currentScreen}
            onNavigate={onNavigate}
          />
        </div>
      ) : (
        /* Desktop Enterprise Shell */
        <div className="ah-desktop-shell">
          <DesktopSidebar
            currentScreen={currentScreen}
            onNavigate={onNavigate}
            selectedWorkspaceId={selectedWorkspaceId}
          />

          <div className="ah-desktop-main-wrapper">
            <DesktopTopBar breadcrumbTitle={screenTitles[currentScreen] || t('appTitle')} />
            <main className="ah-desktop-main-content">
              {children}
            </main>
          </div>
        </div>
      )}
    </div>
  );
};
