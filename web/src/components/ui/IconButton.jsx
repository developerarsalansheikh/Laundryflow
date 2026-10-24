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
        className={`relative inline-flex items-center justify-center p-2 rounded-xl text-stone-700 hover:text-stone-950 bg-white hover:bg-stone-50 border border-[#DDD5C7] shadow-2xs transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-stone-900/10 active:scale-95 cursor-pointer ${
          active ? 'bg-stone-100 text-stone-900 border-stone-400' : ''
        } ${className}`}
        {...props}
      >
        {children}
        {badge != null && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm">
            {badge}
          </span>
        )}
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';

export default IconButton;
