import React from 'react';
import './Input.css';

const Input = ({ 
  label,
  error,
  helperText,
  className = '',
  inputClassName = '',
  required = false,
  ...props 
}) => {
  return (
    <div className={`club-input-wrapper ${className}`}>
      {label && (
        <label className="club-input-label">
          {label}
          {required && <span className="required-mark">*</span>}
        </label>
      )}
      <input
        className={`club-input ${error ? 'error' : ''} ${inputClassName}`}
        {...props}
      />
      {helperText && !error && (
        <span className="club-input-helper">{helperText}</span>
      )}
      {error && (
        <span className="club-input-error">{error}</span>
      )}
    </div>
  );
};

export default Input;
