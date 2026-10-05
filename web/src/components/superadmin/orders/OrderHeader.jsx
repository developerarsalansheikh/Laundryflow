import { ShoppingBag } from 'lucide-react';

/**
 * OrderHeader Component
 */
export const OrderHeader = () => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/8 pb-5">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-[0_0_20px_rgba(99,102,241,0.25)]">
          <ShoppingBag className="w-5 h-5 text-indigo-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-textPrimary tracking-tight">Orders</h1>
          <p className="text-xs sm:text-sm text-textSecondary mt-0.5 max-w-xl">
            Manage and monitor orders across all LaundryFlow laundries.
          </p>
        </div>
      </div>

      {/* Export — not supported by backend; shown as informative disabled state */}
      <div className="relative group">
        <button
          disabled
          aria-disabled="true"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 text-textMuted font-medium text-xs sm:text-sm border border-white/10 cursor-not-allowed opacity-60"
          title="Export feature is coming soon"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          <span>Export</span>
          <span className="text-[10px] font-bold text-amber-400/80 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded-full ml-0.5">
            Soon
          </span>
        </button>
      </div>
    </div>
  );
};

export default OrderHeader;
