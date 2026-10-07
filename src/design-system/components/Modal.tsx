import React, { useEffect } from 'react';
import './Modal.css';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = 'md',
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="ah-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className={`ah-modal-dialog ah-modal-dialog--${size}`}
        onClick={e => e.stopPropagation()}
      >
        <div className="ah-modal-header">
          <div className="ah-modal-title-group">
            {title && <h2 className="ah-modal-title">{title}</h2>}
            {subtitle && <p className="ah-modal-subtitle">{subtitle}</p>}
          </div>
          <button
            type="button"
            className="ah-modal-close-btn"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
        </div>

        <div className="ah-modal-body">{children}</div>

        {footer && <div className="ah-modal-footer">{footer}</div>}
      </div>
    </div>
  );
};
