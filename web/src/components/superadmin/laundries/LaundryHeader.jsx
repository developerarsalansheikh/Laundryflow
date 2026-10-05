import { motion } from 'framer-motion';
import { Plus, Store } from 'lucide-react';

/**
 * LaundryHeader Component
 */
export const LaundryHeader = ({ onAddLaundry }) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/8 pb-5">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-[0_0_20px_rgba(124,58,237,0.25)]">
          <Store className="w-5 h-5 text-purple-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-textPrimary tracking-tight flex items-center gap-2">
            Laundries
          </h1>
          <p className="text-xs sm:text-sm text-textSecondary mt-0.5 max-w-xl">
            Manage and monitor all laundry businesses across the LaundryFlow platform.
          </p>
        </div>
      </div>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onAddLaundry}
        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 text-white font-medium text-xs sm:text-sm shadow-[0_0_20px_rgba(124,58,237,0.35)] hover:shadow-[0_0_25px_rgba(124,58,237,0.5)] border border-purple-400/30 transition-all cursor-pointer flex-shrink-0"
      >
        <Plus className="w-4 h-4" />
        <span>Add Laundry</span>
      </motion.button>
    </div>
  );
};

export default LaundryHeader;
