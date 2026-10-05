import { BarChart3 } from 'lucide-react';

/**
 * AnalyticsHeader Component
 */
export const AnalyticsHeader = () => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/8 pb-5">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-[0_0_20px_rgba(168,85,247,0.25)]">
          <BarChart3 className="w-5 h-5 text-purple-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-textPrimary tracking-tight">Platform Analytics & Intelligence</h1>
          <p className="text-xs sm:text-sm text-textSecondary mt-0.5 max-w-xl">
            Real-time business trends, order distribution, payment split insights, and partner metrics.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsHeader;
