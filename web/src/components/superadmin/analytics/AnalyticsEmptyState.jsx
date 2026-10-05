import { motion } from 'framer-motion';
import { BarChart3, RefreshCw } from 'lucide-react';

/**
 * AnalyticsEmptyState — Displayed when analytics data is unavailable.
 */
export const AnalyticsEmptyState = ({ onRetry }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 px-6 text-center"
    >
      <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-4 shadow-[0_0_40px_rgba(168,85,247,0.15)]">
        <BarChart3 className="w-7 h-7 text-purple-400/80" />
      </div>
      <h3 className="text-base font-semibold text-textPrimary mb-1">No analytics data available</h3>
      <p className="text-sm text-textMuted max-w-xs mb-5">
        Platform activity metrics will render here once orders and payments are recorded.
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-purple-400 bg-purple-500/10 border border-purple-500/20 rounded-xl hover:bg-purple-500/20 transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Analytics
        </button>
      )}
    </motion.div>
  );
};

export default AnalyticsEmptyState;
