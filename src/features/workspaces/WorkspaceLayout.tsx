import React, { useState, useEffect } from 'react';
import {
  Menu,
  ChevronLeft,
  ChevronRight,
  Landmark,
  ArrowRight,
  MoreVertical,
  CheckCircle2,
} from 'lucide-react';
import { useTranslation } from '../../i18n/LanguageContext';
import { Workspace } from '../../types';
import { workspaceService } from '../../services/apiServices';
import { WorkspaceSidebar } from './WorkspaceSidebar';
import { WorkspaceMobileTabBar } from './WorkspaceMobileTabBar';

// View Components
import { WorkspaceOverview } from './views/WorkspaceOverview';
import { InsightsHub } from './views/InsightsHub';
import { ConversationsView } from './views/ConversationsView';
import { SupportCasesView } from './views/SupportCasesView';
import { CustomersView } from './views/CustomersView';
import { AgentProfileView } from './views/AgentProfileView';
import { DatabaseView } from './views/DatabaseView';
import { ChannelsView } from './views/ChannelsView';
import { TestView } from './views/TestView';
import { WorkspaceSettingsView } from './views/WorkspaceSettingsView';

import './WorkspaceLayout.css';

export type WorkspaceSection =
  | 'overview'
  | 'insights'
  | 'conversations'
  | 'support-cases'
  | 'customers'
  | 'agent-profile'
  | 'database'
  | 'channels'
  | 'test'
  | 'settings';

interface WorkspaceLayoutProps {
  workspaceId: string;
  workspaceName?: string;
  workspaceStatus?: string;
  universityName?: string;
  workspacesList?: Workspace[];
  onSelectWorkspace?: (wsId: string) => void;
  onBack: () => void;
  onNavigateToGlobalModels?: () => void;
}

export const WorkspaceLayout: React.FC<WorkspaceLayoutProps> = ({
  workspaceId,
  workspaceName: initialName,
  workspaceStatus: initialStatus,
  universityName = 'جامعة المثال',
  workspacesList: initialWorkspacesList,
  onSelectWorkspace,
  onBack,
  onNavigateToGlobalModels,
}) => {
  const { language } = useTranslation();
  const isEn = language === 'en';

  const [activeSection, setActiveSection] = useState<WorkspaceSection>('overview');
  const [isSidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [isMobileDrawerOpen, setMobileDrawerOpen] = useState<boolean>(false);

  // Workspaces list and active workspace data
  const [allWorkspaces, setAllWorkspaces] = useState<Workspace[]>(initialWorkspacesList || []);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);

  // Fetch workspaces list if not provided
  useEffect(() => {
    let mounted = true;
    if (!initialWorkspacesList || initialWorkspacesList.length === 0) {
      workspaceService.getAll().then((list) => {
        if (mounted && list) {
          setAllWorkspaces(list);
          const found = list.find((w) => String(w.id) === String(workspaceId));
          if (found) setCurrentWorkspace(found);
        }
      }).catch(() => {
        // Handled silently
      });
    } else {
      setAllWorkspaces(initialWorkspacesList);
      const found = initialWorkspacesList.find((w) => String(w.id) === String(workspaceId));
      if (found) setCurrentWorkspace(found);
    }
    return () => {
      mounted = false;
    };
  }, [workspaceId, initialWorkspacesList]);

  // Load specific workspace details if not in list
  useEffect(() => {
    let mounted = true;
    if (!currentWorkspace || String(currentWorkspace.id) !== String(workspaceId)) {
      workspaceService.getById(workspaceId).then((ws) => {
        if (mounted && ws) {
          setCurrentWorkspace(ws);
        }
      }).catch(() => {
        // Fallback
      });
    }
    return () => {
      mounted = false;
    };
  }, [workspaceId]);

  const resolvedName =
    currentWorkspace?.name || initialName || (isEn ? 'University Assistant' : 'مساعد الجامعة');
  const resolvedStatus = currentWorkspace?.status || initialStatus || 'active';

  const sectionTitles: Record<WorkspaceSection, { ar: string; en: string }> = {
    overview: { ar: 'النظرة العامة', en: 'Overview' },
    insights: { ar: 'التقارير والتحليلات', en: 'Reports & Analytics' },
    conversations: { ar: 'المحادثات', en: 'Conversations' },
    'support-cases': { ar: 'حالات الدعم', en: 'Support Cases' },
    customers: { ar: 'العملاء', en: 'Customers' },
    'agent-profile': { ar: 'إعدادات الوكيل', en: 'Agent Profile' },
    database: { ar: 'قاعدة المعرفة', en: 'Knowledge Base' },
    channels: { ar: 'القنوات', en: 'Channels' },
    test: { ar: 'اختبار الوكيل', en: 'Test Agent' },
    settings: { ar: 'إعدادات مساحة العمل', en: 'Workspace Settings' },
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return <WorkspaceOverview workspaceId={workspaceId} onNavigate={setActiveSection} />;
      case 'insights':
        return <InsightsHub workspaceId={workspaceId} onNavigate={setActiveSection} />;
      case 'conversations':
        return <ConversationsView workspaceId={workspaceId} />;
      case 'support-cases':
        return <SupportCasesView workspaceId={workspaceId} onNavigate={setActiveSection} />;
      case 'customers':
        return <CustomersView workspaceId={workspaceId} onNavigate={setActiveSection} />;
      case 'agent-profile':
        return <AgentProfileView workspaceId={workspaceId} />;
      case 'database':
        return <DatabaseView workspaceId={workspaceId} />;
      case 'channels':
        return <ChannelsView workspaceId={workspaceId} />;
      case 'test':
        return <TestView workspaceId={workspaceId} />;
      case 'settings':
        return <WorkspaceSettingsView workspaceId={workspaceId} onBack={onBack} />;
      default:
        return <WorkspaceOverview workspaceId={workspaceId} onNavigate={setActiveSection} />;
    }
  };

  return (
    <div className="ws-layout" dir="rtl">
      {/* ── 1. Shared Workspace Sidebar (Level 2 Navigation) ── */}
      <WorkspaceSidebar
        activeSection={activeSection}
        onNavigate={(sec) => {
          setActiveSection(sec);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!isSidebarCollapsed)}
        workspaceId={workspaceId}
        workspaceName={resolvedName}
        workspaceStatus={resolvedStatus}
        universityName={universityName}
        workspacesList={allWorkspaces}
        onSelectWorkspace={onSelectWorkspace}
        onBack={onBack}
        isMobileOpen={isMobileDrawerOpen}
        onCloseMobile={() => setMobileDrawerOpen(false)}
      />

      {/* ── 2. Main Workspace Content Area ── */}
      <div
        className={`ws-layout__main-wrapper ${
          isSidebarCollapsed ? 'ws-layout__main-wrapper--collapsed' : ''
        }`}
      >
        {/* Mobile Top Header (Reference Image 2 Top Bar) */}
        <header className="ws-mobile-topbar">
          <button
            type="button"
            className="ws-mobile-topbar__menu-btn"
            onClick={() => setMobileDrawerOpen(true)}
            aria-label={isEn ? 'Open Workspace Sidebar' : 'فتح قائمة مساحة العمل'}
          >
            <MoreVertical size={20} />
          </button>

          <div className="ws-mobile-topbar__brand">
            <span className="ws-mobile-topbar__brand-name">AgentHub</span>
            <ChevronLeft size={16} className="ws-mobile-topbar__brand-chevron" />
          </div>

          <button
            type="button"
            className="ws-mobile-topbar__back-btn"
            onClick={() => {
              if (activeSection !== 'overview') {
                setActiveSection('overview');
              } else {
                onBack();
              }
            }}
            aria-label={activeSection !== 'overview' ? (isEn ? 'Return to Overview' : 'العودة للنظرة العامة') : (isEn ? 'Return to Workspaces' : 'العودة لمساحات العمل')}
            title={activeSection !== 'overview' ? (isEn ? 'Return to Overview' : 'العودة للنظرة العامة') : (isEn ? 'Return to Workspaces' : 'العودة لمساحات العمل')}
          >
            <ArrowRight size={18} />
          </button>
        </header>

        {/* Desktop Top Header */}
        <header className="ws-desktop-topbar">
          <div className="ws-desktop-topbar__breadcrumb">
            <button
              type="button"
              className="ws-desktop-topbar__crumb-link"
              onClick={onBack}
              title={isEn ? 'Back to workspaces list' : 'العودة لقائمة مساحات العمل'}
            >
              <Landmark size={16} />
              <span>{isEn ? 'Workspaces' : 'مساحات العمل'}</span>
            </button>
            <ChevronLeft size={14} className="ws-desktop-topbar__crumb-sep" />
            <button
              type="button"
              className={`ws-desktop-topbar__crumb-link ${activeSection === 'overview' ? 'ws-desktop-topbar__current-ws' : ''}`}
              onClick={() => setActiveSection('overview')}
              title={isEn ? 'Return to workspace overview' : 'العودة للنظرة العامة لمساحة العمل'}
            >
              {resolvedName}
            </button>
            {activeSection !== 'overview' && (
              <>
                <ChevronLeft size={14} className="ws-desktop-topbar__crumb-sep" />
                <span className="ws-desktop-topbar__section-title">
                  {isEn ? sectionTitles[activeSection].en : sectionTitles[activeSection].ar}
                </span>
              </>
            )}
          </div>

          <div className="ws-desktop-topbar__actions">
            {activeSection !== 'overview' && (
              <button
                type="button"
                className="ws-desktop-topbar__back-overview-btn"
                onClick={() => setActiveSection('overview')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 14px',
                  borderRadius: 10,
                  border: '1px solid #CBD5E1',
                  background: '#FFFFFF',
                  color: '#334155',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  marginInlineEnd: 8,
                }}
              >
                <span>← {isEn ? 'Overview' : 'النظرة العامة'}</span>
              </button>
            )}

            <span
              className={`ws-desktop-topbar__status-pill ${
                resolvedStatus === 'active'
                  ? 'ws-desktop-topbar__status-pill--active'
                  : 'ws-desktop-topbar__status-pill--paused'
              }`}
            >
              <span className="ws-desktop-topbar__status-dot" />
              <span>{resolvedStatus === 'active' ? (isEn ? 'Active' : 'نشط') : (isEn ? 'Paused' : 'متوقف')}</span>
            </span>

            <button
              type="button"
              className="ws-desktop-topbar__exit-btn"
              onClick={onBack}
            >
              <span>{isEn ? 'Exit Workspace' : 'الخروج من مساحة العمل'}</span>
            </button>
          </div>
        </header>

        {/* Dynamic Section Content View */}
        <main className="ws-layout__content">
          {renderContent()}
        </main>
      </div>

      {/* ── 3. Mobile Bottom Tab Bar (Reference Image 2) ── */}
      <WorkspaceMobileTabBar
        activeSection={activeSection}
        onNavigate={(sec) => {
          setActiveSection(sec);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onBackToWorkspaces={onBack}
      />
    </div>
  );
};
