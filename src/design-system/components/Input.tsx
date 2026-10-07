import React from 'react';
import './Input.css';
import { Search } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  helperText,
  error,
  startIcon,
  endIcon,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || (label ? `input-${label.replace(/\s+/g, '-').toLowerCase()}` : undefined);

  return (
    <div className={`ah-input-group ${error ? 'ah-input-group--error' : ''} ${className}`}>
      {label && <label htmlFor={inputId} className="ah-input-label">{label}</label>}
      <div className="ah-input-wrapper">
        {startIcon && <span className="ah-input-icon ah-input-icon--start">{startIcon}</span>}
        <input
          id={inputId}
          className={`ah-input ${startIcon ? 'ah-input--has-start' : ''} ${endIcon ? 'ah-input--has-end' : ''}`}
          {...props}
        />
        {endIcon && <span className="ah-input-icon ah-input-icon--end">{endIcon}</span>}
      </div>
      {error && <p className="ah-input-feedback ah-input-feedback--error">{error}</p>}
      {helperText && !error && <p className="ah-input-feedback">{helperText}</p>}
    </div>
  );
};

export interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onSearchChange?: (value: string) => void;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  placeholder = 'البحث عن مساحة عمل ...',
  value,
  onChange,
  onSearchChange,
  className = '',
  ...props
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange) onChange(e);
    if (onSearchChange) onSearchChange(e.target.value);
  };

  return (
    <div className={`ah-search-input-box ${className}`}>
      <span className="ah-search-icon">
        <Search size={18} />
      </span>
      <input
        type="text"
        className="ah-search-input"
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        {...props}
      />
    </div>
  );
};
