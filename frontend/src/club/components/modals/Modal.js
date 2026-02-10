import React from 'react';
import './Modal.css';

const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  footer,
  size = 'medium' // small, medium, large
}) => {
  if (!isOpen) return null;

  return (
    <div className="club-modal-overlay" onClick={onClose}>
      <div 
        className={`club-modal club-modal-${size}`} 
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="club-modal-header">
            <h2 className="club-modal-title">{title}</h2>
            <button 
              className="club-modal-close" 
              onClick={onClose}
              type="button"
              aria-label="Закрыть"
            >
              ×
            </button>
          </div>
        )}
        
        <div className="club-modal-body">
          {children}
        </div>
        
        {footer && (
          <div className="club-modal-footer">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
