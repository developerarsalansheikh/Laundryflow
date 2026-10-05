import { motion } from 'framer-motion';
import { Users, X } from 'lucide-react';

/**
 * UserEmptyState — Displayed when no users are found.
 */
export const UserEmptyState = ({ hasActiveFilters, onClear }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 px-6 text-center"
    >
      <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4 shadow-[0_0_40px_rgba(99,102,241,0.15)]">
        <Users className="w-7 h-7 text-indigo-400/80" />
      </div>
      <h3 className="text-base font-semibold text-textPrimary mb-1">
        {hasActiveFilters ? 'No matching users found' : 'No users found'}
      </h3>
      <p className="text-sm text-textMuted max-w-xs">
        {hasActiveFilters
          ? 'Try changing your filters or search terms to find what you are looking for.'
          : 'Users registered on the platform will appear here.'}
      </p>
      {hasActiveFilters && (
        <button
          onClick={onClear}
          className="mt-5 flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 rounded-xl hover:bg-indigo-500/20 transition-all"
        >
          <X className="w-3.5 h-3.5" />
          Clear Filters
        </button>
      )}
    </motion.div>
  );
};

export default UserEmptyState;
