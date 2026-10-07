import React from 'react';
import './Badge.css';
import { WorkspaceStatus, SupportCaseStatus } from '../../types';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'neutral';
  size?: 'sm' | 'md';
  dot?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  dot = false,
  className = '',
}) => {
  return (
    <span className={`ah-badge ah-badge--${variant} ah-badge--${size} ${className}`}>
      {dot && <span className="ah-badge__dot" />}
      <span className="ah-badge__text">{children}</span>
    </span>
  );
};

export interface WorkspaceStatusBadgeProps {
  status: WorkspaceStatus;
  label?: string;
}

export const WorkspaceStatusBadge: React.FC<WorkspaceStatusBadgeProps> = ({ status, label }) => {
  const isArabic = !label;
  const displayText = label || (status === 'active' ? 'نشط' : status === 'paused' ? 'متوقف' : 'مؤرشف');
  const variant = status === 'active' ? 'success' : status === 'paused' ? 'danger' : 'neutral';

  return (
    <span className={`ah-status-pill ah-status-pill--${status}`}>
      <span className="ah-status-pill__text">{displayText}</span>
      <span className="ah-status-pill__dot" />
    </span>
  );
};

export interface SupportCaseStatusBadgeProps {
  status: SupportCaseStatus;
  label?: string;
}

export const SupportCaseStatusBadge: React.FC<SupportCaseStatusBadgeProps> = ({ status, label }) => {
  let defaultLabel = 'مفتوحة';
  let variantClass = 'ah-case-badge--open';

  switch (status) {
    case 'open':
      defaultLabel = 'مفتوحة';
      variantClass = 'ah-case-badge--open';
      break;
    case 'under_review':
      defaultLabel = 'قيد المراجعة';
      variantClass = 'ah-case-badge--review';
      break;
    case 'resolved':
      defaultLabel = 'تم الحل';
      variantClass = 'ah-case-badge--resolved';
      break;
    case 'transferred':
      defaultLabel = 'محولة لموظف';
      variantClass = 'ah-case-badge--transferred';
      break;
  }

  return (
    <span className={`ah-case-badge ${variantClass}`}>
      {label || defaultLabel}
    </span>
  );
};
