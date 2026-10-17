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
        className={`relative inline-flex items-center justify-center p-2 rounded-xl text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 shadow-2xs transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20 active:scale-95 cursor-pointer ${
          active ? 'bg-blue-50 text-blue-600 border-blue-200' : ''
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
