import React from 'react';
import './Card.css';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'flat' | 'interactive' | 'bordered';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  className = '',
  ...props
}) => {
  return (
    <div
      className={`ah-card ah-card--${variant} ah-card--pad-${padding} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<{
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}> = ({ title, subtitle, action, className = '', children }) => {
  if (children) {
    return <div className={`ah-card__header ${className}`}>{children}</div>;
  }
  return (
    <div className={`ah-card__header ${className}`}>
      <div className="ah-card__title-group">
        {title && <h3 className="ah-card__title">{title}</h3>}
        {subtitle && <p className="ah-card__subtitle">{subtitle}</p>}
      </div>
      {action && <div className="ah-card__action">{action}</div>}
    </div>
  );
};

export const CardContent: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  return <div className={`ah-card__content ${className}`}>{children}</div>;
};

export const CardFooter: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  return <div className={`ah-card__footer ${className}`}>{children}</div>;
};

/* --- StatWidget: KPI Metric Card from Dashboard Screenshot --- */
export interface StatWidgetProps {
  label: string;
  value: string | number;
  trend?: string;
  isPositiveTrend?: boolean;
  icon: React.ReactNode;
  iconBgColor?: string;
  onClick?: () => void;
}

export const StatWidget: React.FC<StatWidgetProps> = ({
  label,
  value,
  trend,
  isPositiveTrend = true,
  icon,
  iconBgColor,
  onClick,
}) => {
  return (
    <div
      className={`ah-stat-widget ${onClick ? 'ah-stat-widget--clickable' : ''}`}
      onClick={onClick}
    >
      <div className="ah-stat-widget__main">
        <span className="ah-stat-widget__label">{label}</span>
        <div className="ah-stat-widget__val-row">
          <span className="ah-stat-widget__value">{value}</span>
          {trend && (
            <span
              className={`ah-stat-widget__trend ${
                isPositiveTrend ? 'ah-stat-widget__trend--up' : 'ah-stat-widget__trend--down'
              }`}
            >
              {trend} {isPositiveTrend ? '↑' : '↓'}
            </span>
          )}
        </div>
      </div>
      <div
        className="ah-stat-widget__icon-box"
        style={iconBgColor ? { backgroundColor: iconBgColor } : undefined}
      >
        {icon}
      </div>
    </div>
  );
};

/* --- ServiceTile: 6 Quick Services from Dashboard Screenshot --- */
export interface ServiceTileProps {
  label: string;
  icon: React.ReactNode;
  iconBgColor?: string;
  iconColor?: string;
  onClick?: () => void;
}

export const ServiceTile: React.FC<ServiceTileProps> = ({
  label,
  icon,
  iconBgColor = 'var(--ah-primary-50)',
  iconColor = 'var(--ah-primary-500)',
  onClick,
}) => {
  return (
    <button
      className="ah-service-tile"
      onClick={onClick}
      type="button"
    >
      <div
        className="ah-service-tile__icon-box"
        style={{ backgroundColor: iconBgColor, color: iconColor }}
      >
        {icon}
      </div>
      <span className="ah-service-tile__label">{label}</span>
    </button>
  );
};
