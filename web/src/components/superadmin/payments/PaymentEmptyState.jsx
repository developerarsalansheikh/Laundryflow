import { motion } from 'framer-motion';
import { DollarSign, X } from 'lucide-react';

/**
 * PaymentEmptyState — Displayed when no payment transactions are found.
 */
export const PaymentEmptyState = ({ hasActiveFilters, onClear }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 px-6 text-center"
    >
      <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4 shadow-[0_0_40px_rgba(16,185,129,0.15)]">
        <DollarSign className="w-7 h-7 text-emerald-400/80" />
      </div>
      <h3 className="text-base font-semibold text-textPrimary mb-1">
        {hasActiveFilters ? 'No matching payment transactions' : 'No payment transactions found'}
      </h3>
      <p className="text-sm text-textMuted max-w-xs">
        {hasActiveFilters
          ? 'Try changing your status, payment method, or search criteria.'
          : 'Payment records and transaction splits will appear here once processed.'}
      </p>
      {hasActiveFilters && (
        <button
          onClick={onClear}
          className="mt-5 flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl hover:bg-emerald-500/20 transition-all"
        >
          <X className="w-3.5 h-3.5" />
          Clear Filters
        </button>
      )}
    </motion.div>
  );
};

export default PaymentEmptyState;
