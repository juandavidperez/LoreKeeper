import React from 'react';

/**
 * Logo component for LoreKeeper.
 * @param {Object} props
 * @param {'full'|'minimal'} props.variant - Display variant.
 * @param {string} props.className - Additional classes.
 */
export function Logo({ variant = 'full', className = '' }) {
  const isMinimal = variant === 'minimal';
  
  return (
    <div className={`flex items-center gap-3 ${className}`} aria-label="LoreKeeper Logo">
      {/* Minimalist Icon Icon */}
      <div className={`${isMinimal ? 'w-8 h-8' : 'w-10 h-10'} shrink-0`}>
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-sm">
          <path 
            d="M35 25 V75 H65" 
            stroke="currentColor" 
            strokeWidth="10" 
            strokeLinejoin="round" 
            strokeLinecap="round" 
            className="text-accent"
          />
          <path 
            d="M35 38 H52 C56 38 60 42 60 46 V65 C60 69 56 73 52 73 H35" 
            fill="currentColor" 
            className="text-accent/40"
          />
          <path 
            d="M44 46 V64" 
            stroke="currentColor" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            className="text-accent/60"
          />
        </svg>
      </div>

      {/* Text part (hidden in minimal variant) */}
      {!isMinimal && (
        <span className="text-xl font-serif text-accent tracking-[0.2em] font-bold select-none">
          LOREKEEPER
        </span>
      )}
    </div>
  );
}
