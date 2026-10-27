import React from 'react';

const GlassCard = ({ children, className = '', onClick }) => {
  const isInteractive = !!onClick;
  return (
    <div 
      className={`glass-panel ${isInteractive ? 'glass-panel-interactive' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export default GlassCard;
