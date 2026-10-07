import React from 'react';
import './Tabs.css';

export interface TabItem {
  id: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}

export interface FilterPillsProps {
  items: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
}

export const FilterPills: React.FC<FilterPillsProps> = ({
  items,
  activeId,
  onChange,
  className = '',
}) => {
  return (
    <div className={`ah-filter-pills ${className}`} role="tablist">
      {items.map(item => {
        const isActive = item.id === activeId;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={`ah-filter-pill ${isActive ? 'ah-filter-pill--active' : ''}`}
            onClick={() => onChange(item.id)}
          >
            {item.icon && <span className="ah-filter-pill__icon">{item.icon}</span>}
            <span className="ah-filter-pill__label">{item.label}</span>
            {item.count !== undefined && (
              <span className="ah-filter-pill__count">({item.count})</span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export interface TabsProps {
  items: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
  variant?: 'underline' | 'segmented';
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  items,
  activeId,
  onChange,
  variant = 'underline',
  className = '',
}) => {
  return (
    <div className={`ah-tabs ah-tabs--${variant} ${className}`} role="tablist">
      {items.map(item => {
        const isActive = item.id === activeId;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={`ah-tab-btn ${isActive ? 'ah-tab-btn--active' : ''}`}
            onClick={() => onChange(item.id)}
          >
            {item.icon && <span className="ah-tab-btn__icon">{item.icon}</span>}
            <span className="ah-tab-btn__label">{item.label}</span>
            {item.count !== undefined && (
              <span className="ah-tab-btn__count">{item.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
};
