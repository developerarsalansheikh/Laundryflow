import React from 'react';

/**
 * Reusable Glassmorphic Icon Button Component.
 */
export const IconButton = React.forwardRef(
  ({ children, className = '', active = false, badge, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        className={`relative inline-flex items-center justify-center p-2 rounded-xl text-textSecondary hover:text-textPrimary bg-cardBg hover:bg-cardHover border border-borderSubtle hover:border-borderStrong transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-primaryPurple focus-visible:ring-offset-2 focus-visible:ring-offset-bgPrimary active:scale-95 cursor-pointer ${
          active ? 'bg-primaryPurple/15 text-white border-primaryPurple/40' : ''
        } ${className}`}
        {...props}
      >
        {children}
        {badge && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primaryPurple text-[10px] font-bold text-white shadow-glowPurple">
            {badge}
          </span>
        )}
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';

export default IconButton;
