import React, { useState, useEffect } from 'react';
import './WorkspacesListScreen.css';
import { Workspace } from '../../types';
import { workspaceService } from '../../services/apiServices';
import { WorkspaceCard } from './components/WorkspaceCard';
import {
  Plus,
  Search,
  X,
  LayoutGrid,
  List,
  Sparkles,
  Layers,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { useTranslation } from '../../i18n/LanguageContext';
import { useAgentHubAuth } from '../../context/AuthContext';

export interface WorkspacesListScreenProps {
  onSelectWorkspace: (workspaceId: string) => void;
  onOpenCreateModal: () => void;
}

export const WorkspacesListScreen: React.FC<WorkspacesListScreenProps> = ({
  onSelectWorkspace,
  onOpenCreateModal,
}) => {
  const { language } = useTranslation();
  const { internalUser, role } = useAgentHubAuth();
  const isEn = language === 'en';

  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'paused'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isSystemAdmin =
    role === 'System Administrator' ||
    role === 'system_administrator' ||
    role === 'system_admin' ||
    role === 'Platform Administrator' ||
    role === 'platform_admin';

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await workspaceService.getAll();
      setWorkspaces(data || []);
    } catch (err: any) {
      setError(
        err?.message ||
          (isEn
            ? 'Failed to load workspaces from server.'
            : 'فشل في تحميل مساحات العمل من الخادم.')
      );
      setWorkspaces([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [role, internalUser]);

  // Compute status counts
  const totalCount = workspaces.length;
  const activeCount = workspaces.filter((w) => w.status === 'active').length;
  const pausedCount = workspaces.filter((w) => w.status === 'paused').length;

  // Filter & Search
  const filteredWorkspaces = workspaces.filter((w) => {
    const matchesFilter =
      activeFilter === 'all' ? true : w.status === activeFilter;

    const name = isEn ? (w.nameEn || w.name) : w.name;
    const desc = isEn ? (w.descriptionEn || w.description) : w.description;
    const matchesSearch =
      (name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (desc || '').toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  return (
    <div className="ah-workspaces-screen" dir="rtl">
      {/* ── 1. Top Executive Header ── */}
      <div className="ah-ws-header">
        <div className="ah-ws-header__main">
          <div className="ah-ws-header__title-row">
            <h1 className="ah-ws-header__title">
              {isEn ? 'Workspaces' : 'مساحات العمل'}
            </h1>

            <div className="ah-ws-header__stats">
              <span className="ah-ws-stat-chip ah-ws-stat-chip--total">
                <Layers size={13} />
                <span>{isEn ? `${totalCount} Workspaces` : `${totalCount} مساحات عمل`}</span>
              </span>

              <span className="ah-ws-stat-chip ah-ws-stat-chip--active">
                <span className="ah-ws-stat-dot ah-ws-stat-dot--green" />
                <span>{isEn ? `${activeCount} Active` : `${activeCount} نشط`}</span>
              </span>

              {pausedCount > 0 && (
                <span className="ah-ws-stat-chip ah-ws-stat-chip--paused">
                  <span className="ah-ws-stat-dot ah-ws-stat-dot--gray" />
                  <span>{isEn ? `${pausedCount} Paused` : `${pausedCount} متوقف`}</span>
                </span>
              )}
            </div>
          </div>

          <p className="ah-ws-header__desc">
            {isEn
              ? 'Institutional spaces for university departments, dedicated AI agents, and custom knowledge retrieval.'
              : 'بيئات العمل المخصصة لأقسام الجامعة لربط وتدريب الوكلاء الأذكياء واسترجاع المعرفة المعتمدة.'}
          </p>
        </div>

        {isSystemAdmin && (
          <button
            type="button"
            className="ah-ws-create-btn"
            onClick={onOpenCreateModal}
          >
            <Plus size={18} strokeWidth={2.6} />
            <span>{isEn ? 'New Workspace' : 'إنشاء مساحة عمل'}</span>
          </button>
        )}
      </div>

      {/* ── 2. Unified Controls Toolbar ── */}
      <div className="ah-ws-toolbar">
        {/* Search Field */}
        <div className="ah-ws-search-box">
          <Search size={16} className="ah-ws-search-icon" />
          <input
            type="text"
            className="ah-ws-search-input"
            placeholder={
              isEn
                ? 'Search workspaces by name or description...'
                : 'البحث في مساحات العمل بالاسم أو الوصف...'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="ah-ws-search-clear"
              onClick={() => setSearchQuery('')}
              aria-label={isEn ? 'Clear' : 'مسح'}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="ah-ws-filter-tabs">
          <button
            type="button"
            className={`ah-ws-filter-tab ${
              activeFilter === 'all' ? 'ah-ws-filter-tab--active' : ''
            }`}
            onClick={() => setActiveFilter('all')}
          >
            <span>{isEn ? 'All' : 'الكل'}</span>
            <span className="ah-ws-filter-badge">{totalCount}</span>
          </button>

          <button
            type="button"
            className={`ah-ws-filter-tab ${
              activeFilter === 'active' ? 'ah-ws-filter-tab--active' : ''
            }`}
            onClick={() => setActiveFilter('active')}
          >
            <span className="ah-ws-filter-dot" />
            <span>{isEn ? 'Active' : 'نشط'}</span>
            <span className="ah-ws-filter-badge">{activeCount}</span>
          </button>

          <button
            type="button"
            className={`ah-ws-filter-tab ${
              activeFilter === 'paused' ? 'ah-ws-filter-tab--active' : ''
            }`}
            onClick={() => setActiveFilter('paused')}
          >
            <span>{isEn ? 'Paused' : 'متوقف'}</span>
            <span className="ah-ws-filter-badge">{pausedCount}</span>
          </button>
        </div>

        {/* View Mode Toggle */}
        <div className="ah-ws-view-toggle">
          <button
            type="button"
            className={`ah-ws-view-btn ${
              viewMode === 'grid' ? 'ah-ws-view-btn--active' : ''
            }`}
            onClick={() => setViewMode('grid')}
            title={isEn ? 'Grid view' : 'عرض شبكي'}
          >
            <LayoutGrid size={16} />
          </button>
          <button
            type="button"
            className={`ah-ws-view-btn ${
              viewMode === 'list' ? 'ah-ws-view-btn--active' : ''
            }`}
            onClick={() => setViewMode('list')}
            title={isEn ? 'List view' : 'عرض قائمة'}
          >
            <List size={16} />
          </button>
        </div>
      </div>

      {/* ── 3. Error Banner ── */}
      {error && (
        <div className="ah-ws-error-banner">
          <div className="ah-ws-error-content">
            <AlertCircle size={18} className="ah-ws-error-icon" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            className="ah-ws-retry-btn"
            onClick={loadData}
          >
            <RefreshCw size={14} />
            <span>{isEn ? 'Retry' : 'إعادة المحاولة'}</span>
          </button>
        </div>
      )}

      {/* ── 4. Loading Skeleton State ── */}
      {isLoading && (
        <div className="ah-ws-loading">
          <div className="ah-ws-spinner" />
          <span>
            {isEn
              ? 'Loading authorized university workspaces...'
              : 'جاري تحميل مساحات العمل المعتمدة...'}
          </span>
        </div>
      )}

      {/* ── 5. Workspaces Grid / List ── */}
      {!isLoading && !error && (
        <>
          {filteredWorkspaces.length > 0 ? (
            <div
              className={`ah-ws-container ${
                viewMode === 'list' ? 'ah-ws-container--list' : 'ah-ws-container--grid'
              }`}
            >
              {filteredWorkspaces.map((workspace) => (
                <WorkspaceCard
                  key={workspace.id}
                  workspace={workspace}
                  viewMode={viewMode}
                  onClick={() => onSelectWorkspace(workspace.id)}
                />
              ))}
            </div>
          ) : (
            <div className="ah-ws-empty-state">
              <div className="ah-ws-empty-icon">
                <Layers size={36} />
              </div>
              <h3 className="ah-ws-empty-title">
                {searchQuery
                  ? isEn
                    ? 'No workspaces found'
                    : 'لم يتم العثور على مساحات عمل'
                  : isEn
                  ? 'No workspaces yet'
                  : 'لا توجد مساحات عمل حالياً'}
              </h3>
              <p className="ah-ws-empty-desc">
                {searchQuery
                  ? isEn
                    ? 'Try searching with different keywords or reset filters.'
                    : 'جرّب البحث بكلمات أخرى أو تغيير خيارات التصفية.'
                  : isEn
                  ? 'Get started by creating the first workspace for your department.'
                  : 'ابدأ بإنشاء أول مساحة عمل مخصصة لأقسام الجامعة والوكلاء الأذكياء.'}
              </p>
              {isSystemAdmin && !searchQuery && (
                <button
                  type="button"
                  className="ah-ws-create-btn ah-ws-create-btn--empty"
                  onClick={onOpenCreateModal}
                >
                  <Plus size={18} />
                  <span>{isEn ? 'Create First Workspace' : 'إنشاء أول مساحة عمل'}</span>
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};
