import React from 'react';
import './Card.css';

const Card = ({ 
  children, 
  className = '',
  padding = 'medium',
  hover = false,
  onClick,
  ...props 
}) => {
  return (
    <div
      className={`club-card club-card-padding-${padding} ${hover ? 'hover' : ''} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
