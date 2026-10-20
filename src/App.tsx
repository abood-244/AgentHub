import React, { useState } from 'react';
import { AuthenticateWithRedirectCallback } from '@clerk/react';
import { AuthProvider, useAgentHubAuth } from './context/AuthContext';
import { SignInScreen } from './features/auth/SignInScreen';
import { AccessDeniedScreen } from './features/auth/AccessDeniedScreen';
import { OnboardingScreen, ONBOARDING_COMPLETED_KEY } from './features/onboarding/OnboardingScreen';
import { LanguageProvider, useTranslation } from './i18n/LanguageContext';
import { ThemeProvider } from './theme/ThemeContext';
import { AppShell } from './layout/AppShell';
import { DashboardScreen } from './features/dashboard/DashboardScreen';
import { StaffDashboardScreen } from './features/dashboard/StaffDashboardScreen';
import { PlatformAdminDashboardScreen } from './features/dashboard/PlatformAdminDashboardScreen';
import { WorkspacesListScreen } from './features/workspaces/WorkspacesListScreen';
import { WorkspaceDetailScreen } from './features/workspaces/WorkspaceDetailScreen';
import { LLMModelsScreen } from './features/llm-models/LLMModelsScreen';
import { SettingsScreen } from './features/settings/SettingsScreen';
import { ComingSoonScreen } from './features/common/ComingSoonScreen';
import { CreateWorkspaceModal } from './features/workspaces/components/CreateWorkspaceModal';
import { mockWorkspaces } from './services/mockData';

const AgentHubMain: React.FC = () => {
  const {
    isClerkLoaded,
    isSignedIn,
    isLoadingInternal,
    isUnauthorized,
    internalUser,
    role,
    authError,
  } = useAgentHubAuth();

  const { t, language } = useTranslation();
  const isEn = language === 'en';

  const [currentScreen, setCurrentScreen] = useState<string>('dashboard');
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [previousScreen, setPreviousScreen] = useState<string>('dashboard');
  const [isOnboardingCompleted, setIsOnboardingCompleted] = useState<boolean>(() => {
    try {
      return localStorage.getItem(ONBOARDING_COMPLETED_KEY) === 'true';
    } catch {
      return false;
    }
  });

  // Handle Clerk OAuth SSO Callback
  const isSSOCallback =
    typeof window !== 'undefined' &&
    (window.location.pathname === '/sso-callback' ||
      window.location.search.includes('__clerk_status') ||
      window.location.search.includes('__clerk_created_session'));

  if (isSSOCallback) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#071B45',
          color: '#ffffff',
          fontFamily: "'IBM Plex Sans Arabic', sans-serif",
          direction: 'rtl',
        }}
      >
        <div style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: '16px' }}>
          <span style={{ color: '#ffffff' }}>Agent</span>
          <span style={{ color: '#0878F9' }}>Hub</span>
        </div>
        <p style={{ fontSize: '14px', color: '#94A3B8', marginBottom: '16px' }}>
          جاري إتمام المصادقة عبر Google وتأكيد الجلسة...
        </p>
        <AuthenticateWithRedirectCallback
          signInFallbackRedirectUrl="/"
          signUpFallbackRedirectUrl="/"
        />
      </div>
    );
  }

  // 1. Loading state while Clerk initializes or while Laravel GET /api/me verifies session
  if (!isClerkLoaded || (isSignedIn && isLoadingInternal)) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#071B45',
          color: '#ffffff',
          fontFamily: "'IBM Plex Sans Arabic', sans-serif",
          direction: 'rtl',
        }}
      >
        <div style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: '16px' }}>
          <span style={{ color: '#ffffff' }}>Agent</span>
          <span style={{ color: '#0878F9' }}>Hub</span>
        </div>
        <div
          style={{
            width: '36px',
            height: '36px',
            border: '3px solid rgba(255, 255, 255, 0.2)',
            borderTopColor: '#0878F9',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            marginBottom: '16px',
          }}
        />
        <p style={{ fontSize: '14px', color: '#94A3B8', margin: 0 }}>
          جاري التحقق من الهوية والصلاحيات الجامعية...
        </p>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // 2. Unauthenticated user -> Onboarding (for first-time visitors) or Approved Sprint 1 Sign In Screen
  if (!isSignedIn) {
    if (!isOnboardingCompleted) {
      return <OnboardingScreen onComplete={() => setIsOnboardingCompleted(true)} />;
    }
    return <SignInScreen />;
  }

  // 3. Authenticated in Clerk, but rejected by backend /api/me (unmapped internal user)
  if (isUnauthorized) {
    return <AccessDeniedScreen message={authError} />;
  }

  // Navigation handlers
  const handleNavigate = (screen: string) => {
    if (screen !== currentScreen) {
      setPreviousScreen(currentScreen);
    }
    if (screen === 'workspaces') {
      setSelectedWorkspaceId(null);
    }
    setCurrentScreen(screen);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectWorkspace = (workspaceId: string) => {
    setPreviousScreen(currentScreen);
    setSelectedWorkspaceId(workspaceId);
    setCurrentScreen('workspace-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    if (currentScreen === 'workspace-detail') {
      setSelectedWorkspaceId(null);
      setCurrentScreen('workspaces');
    } else {
      setCurrentScreen(previousScreen || 'dashboard');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Find active workspace name for mobile header subscreen title
  const currentWorkspace = selectedWorkspaceId
    ? mockWorkspaces.find((w) => w.id === selectedWorkspaceId)
    : null;
  const subTitle = currentWorkspace
    ? isEn
      ? currentWorkspace.nameEn
      : currentWorkspace.name
    : undefined;

  const isStaff = role === 'Staff' || role === 'staff';
  const isPlatformAdmin =
    role === 'Platform Administrator' ||
    role === 'platform_admin' ||
    role === 'platform_administrator';
  const isSystemAdmin = !isStaff && !isPlatformAdmin;

  // Show back button on mobile whenever not on the dashboard home
  const showBackButton = currentScreen !== 'dashboard';

  return (
    <AppShell
      currentScreen={currentScreen}
      subScreenTitle={subTitle}
      onNavigate={handleNavigate}
      onBack={showBackButton ? handleBack : undefined}
      selectedWorkspaceId={selectedWorkspaceId}
      onOpenCreateWorkspace={isSystemAdmin ? () => setIsCreateModalOpen(true) : undefined}
    >
      {/* Role-Based Dashboard Routing */}
      {currentScreen === 'dashboard' && (
        <>
          {isStaff ? (
            <StaffDashboardScreen
              onNavigate={handleNavigate}
              onSelectWorkspace={handleSelectWorkspace}
            />
          ) : isPlatformAdmin ? (
            <PlatformAdminDashboardScreen onNavigate={handleNavigate} />
          ) : (
            <DashboardScreen
              onNavigate={handleNavigate}
              onOpenCaseDetail={() => handleNavigate('support-cases')}
            />
          )}
        </>
      )}

      {/* Workspaces List Screen */}
      {currentScreen === 'workspaces' && (
        <WorkspacesListScreen
          onSelectWorkspace={handleSelectWorkspace}
          onOpenCreateModal={() => setIsCreateModalOpen(true)}
        />
      )}

      {/* Workspace Detail View */}
      {currentScreen === 'workspace-detail' && selectedWorkspaceId && (
        <WorkspaceDetailScreen
          workspaceId={selectedWorkspaceId}
          onBack={handleBack}
          onNavigateToGlobalModels={() => handleNavigate('llm-models')}
        />
      )}

      {/* LLM Models Configuration */}
      {currentScreen === 'llm-models' && <LLMModelsScreen />}

      {/* Settings Screen */}
      {currentScreen === 'settings' && <SettingsScreen />}

      {/* Approved Sprint 1 Deferred Modules -> Coming Soon */}
      {currentScreen === 'inbox' && (
        <ComingSoonScreen
          title="صندوق المحادثات الموحد (Unified Inbox)"
          titleEn="Unified Inbox"
          moduleName="المحادثات وإدارة الجلسات"
          onBackToDashboard={() => handleNavigate('dashboard')}
        />
      )}

      {currentScreen === 'support-cases' && (
        <ComingSoonScreen
          title="حالات وتذاكر الدعم الأكاديمي (Support Cases)"
          titleEn="Support Cases"
          moduleName="متابعة تذاكر الدعم والطلاب"
          onBackToDashboard={() => handleNavigate('dashboard')}
        />
      )}

      {currentScreen === 'channels' && (
        <ComingSoonScreen
          title="القنوات والتكاملات (Channels & Integrations)"
          titleEn="Channels & Integrations"
          moduleName="ربط قنوات واتساب والويب وتيليجرام"
          onBackToDashboard={() => handleNavigate('dashboard')}
        />
      )}

      {currentScreen === 'knowledge' && (
        <ComingSoonScreen
          title="قاعدة المعرفة والوثائق (Knowledge Base)"
          titleEn="Knowledge Base"
          moduleName="فهرسة الوثائق والربط المعرفي"
          onBackToDashboard={() => handleNavigate('dashboard')}
        />
      )}

      {currentScreen === 'staff' && (
        <ComingSoonScreen
          title="إدارة مستخدمي النظام والصلاحيات (Staff & Roles)"
          titleEn="Staff & Access Control"
          moduleName="إدارة أعضاء الفريق وصلاحيات المساحات"
          onBackToDashboard={() => handleNavigate('dashboard')}
        />
      )}

      {currentScreen === 'reports' && (
        <ComingSoonScreen
          title="التقارير ولوحات التحليلات (Reports & Analytics)"
          titleEn="Reports & Analytics"
          moduleName="تحليلات الاستخدام ومؤشرات الأداء"
          onBackToDashboard={() => handleNavigate('dashboard')}
        />
      )}

      {currentScreen === 'agents' && (
        <ComingSoonScreen
          title="إدارة الوكلاء الأذكياء (Agents Management)"
          titleEn="Agents Management"
          moduleName="تخصيص سلوك ونماذج الوكلاء"
          onBackToDashboard={() => handleNavigate('dashboard')}
        />
      )}

      {currentScreen === 'more' && (
        <ComingSoonScreen
          title="خيارات إضافية"
          titleEn="Additional Options"
          moduleName="الإعدادات المتقدمة"
          onBackToDashboard={() => handleNavigate('dashboard')}
        />
      )}

      {/* Platform Administrator Spec 5.3 Modules */}
      {currentScreen === 'universities' && (
        <ComingSoonScreen
          title="إدارة الجامعات والمستأجرين (Universities Management)"
          titleEn="Universities Management"
          moduleName="إدارة الجامعات والمستأجرين وتراخيص المؤسسات"
          onBackToDashboard={() => handleNavigate('dashboard')}
        />
      )}

      {currentScreen === 'billing' && (
        <ComingSoonScreen
          title="الاشتراكات والفوترة (Subscriptions & Billing)"
          titleEn="Subscriptions & Billing"
          moduleName="خطط الاشتراك والفوترة وتراخيص الاستخدام"
          onBackToDashboard={() => handleNavigate('dashboard')}
        />
      )}

      {currentScreen === 'system-health' && (
        <ComingSoonScreen
          title="صحة النظام والبنية التحتية (System Health & Infrastructure)"
          titleEn="System Health"
          moduleName="مراقبة الخوادم ومؤشرات أداء البنية التحتية"
          onBackToDashboard={() => handleNavigate('dashboard')}
        />
      )}

      {currentScreen === 'platform-settings' && (
        <ComingSoonScreen
          title="إعدادات المنصة المركزية (Platform Settings)"
          titleEn="Platform Settings"
          moduleName="الإعدادات الشاملة للمنصة متعددة المستأجرين"
          onBackToDashboard={() => handleNavigate('dashboard')}
        />
      )}

      {currentScreen === 'notifications' && (
        <ComingSoonScreen
          title="مركز الإشعارات والتنبيهات (Notifications)"
          titleEn="Notifications"
          moduleName="إشعارات النظام وتنبيهات الأمان"
          onBackToDashboard={() => handleNavigate('dashboard')}
        />
      )}

      {currentScreen === 'integrations' && (
        <ComingSoonScreen
          title="التكاملات المركزية (Platform Integrations)"
          titleEn="Integrations"
          moduleName="بوابات الربط ومزودي خدمات الذكاء الاصطناعي"
          onBackToDashboard={() => handleNavigate('dashboard')}
        />
      )}

      {/* Create Workspace Modal (Restricted to System Administrator) */}
      {isSystemAdmin && (
        <CreateWorkspaceModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onCreated={(newWs) => {
            handleSelectWorkspace(newWs.id);
          }}
        />
      )}
    </AppShell>
  );
};

export function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <AgentHubMain />
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
