import React from 'react';
import './Button.css';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  iconPosition?: 'start' | 'end';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'start',
  isLoading = false,
  className = '',
  disabled,
  ...props
}) => {
  return (
    <button
      className={`ah-btn ah-btn--${variant} ah-btn--${size} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="ah-btn__spinner" />
      ) : (
        <>
          {icon && iconPosition === 'start' && <span className="ah-btn__icon">{icon}</span>}
          {children && <span className="ah-btn__label">{children}</span>}
          {icon && iconPosition === 'end' && <span className="ah-btn__icon">{icon}</span>}
        </>
      )}
    </button>
  );
};

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'chrome';
  size?: 'sm' | 'md' | 'lg';
  icon: React.ReactNode;
  badge?: number | string;
  label?: string;
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  variant = 'secondary',
  size = 'md',
  badge,
  label,
  className = '',
  ...props
}) => {
  return (
    <button
      className={`ah-icon-btn ah-icon-btn--${variant} ah-icon-btn--${size} ${className}`}
      aria-label={label}
      title={label}
      {...props}
    >
      <span className="ah-icon-btn__icon">{icon}</span>
      {badge !== undefined && (
        <span className="ah-icon-btn__badge">{badge}</span>
      )}
    </button>
  );
};
