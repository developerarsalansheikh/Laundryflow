import { motion } from 'framer-motion';
import { Briefcase, X } from 'lucide-react';

/**
 * EmployeeEmptyState — Displayed when no employees are found.
 */
export const EmployeeEmptyState = ({ hasActiveFilters, onClear }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 px-6 text-center"
    >
      <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4 shadow-[0_0_40px_rgba(245,158,11,0.15)]">
        <Briefcase className="w-7 h-7 text-amber-400/80" />
      </div>
      <h3 className="text-base font-semibold text-textPrimary mb-1">
        {hasActiveFilters ? 'No matching employees found' : 'No employees found'}
      </h3>
      <p className="text-sm text-textMuted max-w-xs">
        {hasActiveFilters
          ? 'Try changing your filters or search terms to find workforce members.'
          : 'Employees and delivery workforce registered on the platform will appear here.'}
      </p>
      {hasActiveFilters && (
        <button
          onClick={onClear}
          className="mt-5 flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-xl hover:bg-amber-500/20 transition-all"
        >
          <X className="w-3.5 h-3.5" />
          Clear Filters
        </button>
      )}
    </motion.div>
  );
};

export default EmployeeEmptyState;
