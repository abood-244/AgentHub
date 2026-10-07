import React, { useState, useEffect } from 'react';
import './WorkspacesListScreen.css';
import { Workspace, WorkspaceStatus } from '../../types';
import { workspaceService } from '../../services/apiServices';
import { WorkspaceCard } from './components/WorkspaceCard';
import { SearchInput } from '../../design-system/components/Input';
import { FilterPills, TabItem } from '../../design-system/components/Tabs';
import { Button } from '../../design-system/components/Button';
import { Plus } from 'lucide-react';
import { useTranslation } from '../../i18n/LanguageContext';

export interface WorkspacesListScreenProps {
  onSelectWorkspace: (workspaceId: string) => void;
  onOpenCreateModal: () => void;
}

export const WorkspacesListScreen: React.FC<WorkspacesListScreenProps> = ({
  onSelectWorkspace,
  onOpenCreateModal,
}) => {
  const { language, t } = useTranslation();
  const isEn = language === 'en';

  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'paused'>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      const data = await workspaceService.getAll();
      setWorkspaces(data);
      setIsLoading(false);
    };
    loadData();
  }, []);

  // Compute status counts for filter pills
  const totalCount = workspaces.length;
  const activeCount = workspaces.filter(w => w.status === 'active').length;
  const pausedCount = workspaces.filter(w => w.status === 'paused').length;

  const filterTabs: TabItem[] = [
    { id: 'all', label: t('filterAll'), count: totalCount },
    { id: 'active', label: t('filterActive'), count: activeCount },
    { id: 'paused', label: t('filterPaused'), count: pausedCount },
  ];

  // Filter & Search
  const filteredWorkspaces = workspaces.filter(w => {
    const matchesFilter =
      activeFilter === 'all' ? true : w.status === activeFilter;

    const name = isEn ? w.nameEn : w.name;
    const desc = isEn ? w.descriptionEn : w.description;
    const matchesSearch =
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      desc.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  return (
    <div className="ah-workspaces-screen">
      {/* Top Controls Row */}
      <div className="ah-ws-controls">
        <div className="ah-ws-controls__search-row">
          <SearchInput
            placeholder={t('searchPlaceholder')}
            value={searchQuery}
            onSearchChange={setSearchQuery}
          />
          {/* Desktop-only Add Workspace Button */}
          <div className="ah-ws-controls__desktop-btn">
            <Button
              variant="primary"
              icon={<Plus size={18} />}
              onClick={onOpenCreateModal}
            >
              {t('createWorkspace')}
            </Button>
          </div>
        </div>

        {/* Filter Pills matching screenshot */}
        <FilterPills
          items={filterTabs}
          activeId={activeFilter}
          onChange={id => setActiveFilter(id as any)}
        />
      </div>

      {/* Workspaces Cards List */}
      <div className="ah-ws-list">
        {filteredWorkspaces.map(workspace => (
          <WorkspaceCard
            key={workspace.id}
            workspace={workspace}
            onClick={() => onSelectWorkspace(workspace.id)}
          />
        ))}

        {filteredWorkspaces.length === 0 && !isLoading && (
          <div className="ah-ws-empty">
            <p className="ah-ws-empty__text">
              {isEn ? 'No workspaces match your search or filter.' : 'لم يتم العثور على مساحات عمل تطابق البحث.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
