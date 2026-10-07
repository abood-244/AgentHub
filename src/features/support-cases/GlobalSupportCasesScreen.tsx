import React, { useState, useEffect } from 'react';
import { SupportCase, SupportCaseStatus } from '../../types';
import { supportCaseService } from '../../services/apiServices';
import { SupportCaseItem } from '../dashboard/components/SupportCaseItem';
import { FilterPills, TabItem } from '../../design-system/components/Tabs';
import { useTranslation } from '../../i18n/LanguageContext';

export const GlobalSupportCasesScreen: React.FC = () => {
  const { language, t } = useTranslation();
  const isEn = language === 'en';

  const [cases, setCases] = useState<SupportCase[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>('all');

  useEffect(() => {
    const fetchCases = async () => {
      const data = await supportCaseService.getAll();
      setCases(data);
    };
    fetchCases();
  }, []);

  const filterTabs: TabItem[] = [
    { id: 'all', label: t('filterAll'), count: cases.length },
    { id: 'open', label: t('statusOpen'), count: cases.filter(c => c.status === 'open').length },
    { id: 'under_review', label: t('statusUnderReview'), count: cases.filter(c => c.status === 'under_review').length },
    { id: 'resolved', label: t('statusResolved'), count: cases.filter(c => c.status === 'resolved').length },
    { id: 'transferred', label: t('statusTransferred'), count: cases.filter(c => c.status === 'transferred').length },
  ];

  const filtered = cases.filter(c => {
    if (activeFilter === 'all') return true;
    return c.status === activeFilter;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <h2 style={{ margin: '0 0 6px 0', fontSize: '1.45rem', fontWeight: 800 }}>
          {t('navSupportCases')}
        </h2>
        <p style={{ margin: 0, fontSize: '13px', color: 'var(--ah-text-secondary)' }}>
          {isEn
            ? 'Unified view of all escalated university student cases requiring human counselor attention.'
            : 'نظرة موحدة لجميع حالات وطلبات الطلاب المحولة من وكلاء الذكاء الاصطناعي للكوادر البشرية.'}
        </p>
      </div>

      <FilterPills
        items={filterTabs}
        activeId={activeFilter}
        onChange={setActiveFilter}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.map(item => (
          <SupportCaseItem key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
};
