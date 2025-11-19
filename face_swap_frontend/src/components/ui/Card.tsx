import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  gradient?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className = '', gradient = false }) => {
  return (
    <div
      className={`
        rounded-xl border border-white/10 backdrop-blur-sm
        ${gradient 
          ? 'bg-gradient-to-br from-white/10 to-white/5' 
          : 'bg-white/5'
        }
        ${className}
      `}
    >
      {children}
    </div>
  );
};


