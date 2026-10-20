import React, { useState, useEffect } from 'react';
import './WorkspacesListScreen.css';
import { Workspace } from '../../types';
import { workspaceService } from '../../services/apiServices';
import { WorkspaceCard } from './components/WorkspaceCard';
import { Plus, Search } from 'lucide-react';
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
  const { language, t } = useTranslation();
  const { internalUser, role } = useAgentHubAuth();
  const isEn = language === 'en';

  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'paused'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isSystemAdmin = role === 'System Administrator' || role === 'system_administrator' || role === 'system_admin';

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await workspaceService.getAll();
      setWorkspaces(data);
    } catch (err: any) {
      setError(err?.message || (isEn ? 'Failed to load workspaces.' : 'فشل في تحميل مساحات العمل من الخادم.'));
      setWorkspaces([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [role, internalUser]);

  // Compute status counts for filter pills
  const totalCount = workspaces.length;
  const activeCount = workspaces.filter(w => w.status === 'active').length;
  const pausedCount = workspaces.filter(w => w.status === 'paused').length;

  // Filter & Search
  const filteredWorkspaces = workspaces.filter(w => {
    const matchesFilter =
      activeFilter === 'all' ? true : w.status === activeFilter;

    const name = isEn ? w.nameEn : w.name;
    const desc = isEn ? w.descriptionEn : w.description;
    const matchesSearch =
      (name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (desc || '').toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  return (
    <div className="ah-workspaces-screen" dir="rtl">
      {/* Primary Action: Create Workspace (System Administrator only) */}
      {isSystemAdmin && (
        <div className="ah-ws-primary-action">
          <button
            type="button"
            className="ah-ws-create-btn"
            onClick={onOpenCreateModal}
          >
            <Plus size={20} strokeWidth={2.8} />
            <span>{isEn ? 'Create Workspace' : 'إنشاء مساحة عمل'}</span>
          </button>
        </div>
      )}

      {/* Search Field Container */}
      <div className="ah-ws-search-container">
        <div className="ah-ws-search-icon">
          <Search size={18} strokeWidth={2} />
        </div>
        <input
          type="text"
          className="ah-ws-search-input"
          placeholder={isEn ? 'Search workspaces...' : 'البحث في مساحات العمل...'}
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Segment Tabs / Filters */}
      <div className="ah-ws-filter-tabs">
        <button
          type="button"
          className={`ah-ws-filter-tab ${activeFilter === 'all' ? 'ah-ws-filter-tab--active' : ''}`}
          onClick={() => setActiveFilter('all')}
        >
          {isEn ? `All (${totalCount})` : `الكل (${totalCount})`}
        </button>

        <button
          type="button"
          className={`ah-ws-filter-tab ${activeFilter === 'active' ? 'ah-ws-filter-tab--active' : ''}`}
          onClick={() => setActiveFilter('active')}
        >
          <span>{isEn ? `Active (${activeCount})` : `نشط (${activeCount})`}</span>
          <span className="ah-ws-filter-tab__dot" />
        </button>

        <button
          type="button"
          className={`ah-ws-filter-tab ${activeFilter === 'paused' ? 'ah-ws-filter-tab--active' : ''}`}
          onClick={() => setActiveFilter('paused')}
        >
          {isEn ? `Paused (${pausedCount})` : `متوقف (${pausedCount})`}
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div className="ah-alert-error" style={{
          backgroundColor: '#FEE2E2',
          border: '1px solid #FCA5A5',
          borderRadius: 12,
          padding: '14px 18px',
          color: '#991B1B',
          fontSize: '13.5px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          margin: '4px 0'
        }}>
          <span>{error}</span>
          <button
            type="button"
            onClick={loadData}
            style={{
              background: '#DC2626',
              color: '#ffffff',
              border: 'none',
              borderRadius: 8,
              padding: '6px 14px',
              fontSize: '12.5px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {isEn ? 'Retry' : 'إعادة المحاولة'}
          </button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div style={{ textAlign: 'center', padding: '48px 0', color: '#64748b', fontSize: '14px' }}>
          {isEn ? 'Loading authorized workspaces...' : 'جاري تحميل مساحات العمل المصرح بها...'}
        </div>
      )}

      {/* Workspaces Cards List */}
      {!isLoading && !error && (
        <div className="ah-ws-list">
          {filteredWorkspaces.map(workspace => (
            <WorkspaceCard
              key={workspace.id}
              workspace={workspace}
              onClick={() => onSelectWorkspace(workspace.id)}
            />
          ))}

          {filteredWorkspaces.length === 0 && (
            <div className="ah-ws-empty">
              <p className="ah-ws-empty__text">
                {isEn ? 'No workspaces match your search or filter.' : 'لم يتم العثور على مساحات عمل تطابق البحث.'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
