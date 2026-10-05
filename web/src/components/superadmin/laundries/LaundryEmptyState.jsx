import { motion } from 'framer-motion';
import { Store, Plus } from 'lucide-react';

/**
 * LaundryEmptyState Component
 */
export const LaundryEmptyState = ({ onAddLaundry, isFiltered = false, onResetFilters }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-card rounded-2xl border border-white/8 p-12 text-center flex flex-col items-center justify-center my-6"
    >
      <div className="w-16 h-16 rounded-2xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(124,58,237,0.2)]">
        <Store className="w-8 h-8 text-purple-400" />
      </div>

      <h3 className="text-lg font-bold text-textPrimary tracking-tight">
        {isFiltered ? 'No matching laundries found' : 'No laundries yet'}
      </h3>

      <p className="text-xs sm:text-sm text-textMuted max-w-md mt-1 mb-6 leading-relaxed">
        {isFiltered
          ? 'No laundry businesses match your search or filter criteria. Try resetting your active filters.'
          : 'Start onboarding laundry businesses to LaundryFlow to manage their orders, revenue, and commissions.'}
      </p>

      <div className="flex items-center gap-3">
        {isFiltered && onResetFilters && (
          <button
            onClick={onResetFilters}
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-textSecondary border border-white/10 transition-all cursor-pointer"
          >
            Clear Filters
          </button>
        )}

        {onAddLaundry && (
          <button
            onClick={onAddLaundry}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Laundry</span>
          </button>
        )}
      </div>
    </motion.div>
  );
};

export default LaundryEmptyState;
