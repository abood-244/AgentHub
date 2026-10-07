import React, { useState } from 'react';
import { LanguageProvider, useTranslation } from './i18n/LanguageContext';
import { ThemeProvider } from './theme/ThemeContext';
import { AppShell } from './layout/AppShell';
import { DashboardScreen } from './features/dashboard/DashboardScreen';
import { WorkspacesListScreen } from './features/workspaces/WorkspacesListScreen';
import { WorkspaceDetailScreen } from './features/workspaces/WorkspaceDetailScreen';
import { LLMModelsScreen } from './features/llm-models/LLMModelsScreen';
import { GlobalInboxScreen } from './features/inbox/GlobalInboxScreen';
import { GlobalSupportCasesScreen } from './features/support-cases/GlobalSupportCasesScreen';
import { ChannelsScreen } from './features/channels/ChannelsScreen';
import { SettingsScreen } from './features/settings/SettingsScreen';
import { CreateWorkspaceModal } from './features/workspaces/components/CreateWorkspaceModal';
import { mockWorkspaces } from './services/mockData';

const AgentHubMain: React.FC = () => {
  const { t, language } = useTranslation();
  const isEn = language === 'en';

  const [currentScreen, setCurrentScreen] = useState<string>('dashboard');
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [previousScreen, setPreviousScreen] = useState<string>('dashboard');

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
    ? mockWorkspaces.find(w => w.id === selectedWorkspaceId)
    : null;
  const subTitle = currentWorkspace
    ? (isEn ? currentWorkspace.nameEn : currentWorkspace.name)
    : undefined;

  // Show back button on mobile whenever not on the dashboard home
  const showBackButton = currentScreen !== 'dashboard';

  return (
    <AppShell
      currentScreen={currentScreen}
      subScreenTitle={subTitle}
      onNavigate={handleNavigate}
      onBack={showBackButton ? handleBack : undefined}
      selectedWorkspaceId={selectedWorkspaceId}
      onOpenCreateWorkspace={() => setIsCreateModalOpen(true)}
    >
      {currentScreen === 'dashboard' && (
        <DashboardScreen
          onNavigate={handleNavigate}
          onOpenCaseDetail={() => handleNavigate('support-cases')}
        />
      )}

      {currentScreen === 'workspaces' && (
        <WorkspacesListScreen
          onSelectWorkspace={handleSelectWorkspace}
          onOpenCreateModal={() => setIsCreateModalOpen(true)}
        />
      )}

      {currentScreen === 'workspace-detail' && selectedWorkspaceId && (
        <WorkspaceDetailScreen
          workspaceId={selectedWorkspaceId}
          onBack={handleBack}
          onNavigateToGlobalModels={() => handleNavigate('llm-models')}
        />
      )}

      {currentScreen === 'llm-models' && (
        <LLMModelsScreen />
      )}

      {currentScreen === 'inbox' && (
        <GlobalInboxScreen />
      )}

      {currentScreen === 'support-cases' && (
        <GlobalSupportCasesScreen />
      )}

      {currentScreen === 'channels' && (
        <ChannelsScreen />
      )}

      {currentScreen === 'settings' && (
        <SettingsScreen />
      )}

      {(currentScreen === 'staff' || currentScreen === 'knowledge' || currentScreen === 'reports' || currentScreen === 'more') && (
        <div style={{ padding: 24, textAlign: 'center' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: 8 }}>
            {currentScreen.toUpperCase()} Module
          </h3>
          <p style={{ color: 'var(--ah-text-secondary)', fontSize: '13px', marginBottom: 16 }}>
            Connected to AgentHub Domain Services & Design System.
          </p>
          <button
            type="button"
            className="ah-btn ah-btn--primary ah-btn--md"
            onClick={() => handleNavigate('dashboard')}
          >
            العودة للرئيسية (Dashboard)
          </button>
        </div>
      )}

      {/* Create Workspace Modal */}
      <CreateWorkspaceModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={newWs => {
          handleSelectWorkspace(newWs.id);
        }}
      />
    </AppShell>
  );
};

export function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AgentHubMain />
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
