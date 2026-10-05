import { useRef } from 'react';
import { Search, X } from 'lucide-react';
import { motion } from 'framer-motion';

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'success', label: 'Success' },
  { value: 'pending', label: 'Pending' },
  { value: 'failed', label: 'Failed' },
  { value: 'refunded', label: 'Refunded' },
];

const METHOD_OPTIONS = [
  { value: '', label: 'All Methods' },
  { value: 'razorpay', label: 'Razorpay' },
  { value: 'cod', label: 'COD' },
  { value: 'upi', label: 'UPI' },
];

/**
 * PaymentFilters — Filter bar for SuperAdmin Payments page.
 */
export const PaymentFilters = ({ filters, onChange, onClear, hasActiveFilters }) => {
  const searchRef = useRef(null);

  const handleSearch = (e) => {
    onChange({ ...filters, search: e.target.value });
  };

  const handleStatus = (e) => {
    onChange({ ...filters, status: e.target.value });
  };

  const handleMethod = (e) => {
    onChange({ ...filters, method: e.target.value });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="glass-card rounded-2xl border border-white/8 p-3 sm:p-4"
    >
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-textMuted pointer-events-none" />
          <input
            ref={searchRef}
            type="text"
            id="payment-search"
            value={filters.search || ''}
            onChange={handleSearch}
            placeholder="Search payments by customer name, phone, laundry..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-textPrimary placeholder:text-textMuted focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/40 transition-all"
          />
          {filters.search && (
            <button
              onClick={() => onChange({ ...filters, search: '' })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-textMuted hover:text-textPrimary transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Payment Method Filter */}
        <div className="flex items-center gap-2">
          <select
            id="payment-method-filter"
            value={filters.method || ''}
            onChange={handleMethod}
            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-textPrimary focus:outline-none focus:ring-1 focus:ring-emerald-500/50 transition-all min-w-[140px]"
          >
            {METHOD_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-[#0f172a]">
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <select
            id="payment-status-filter"
            value={filters.status || ''}
            onChange={handleStatus}
            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-textPrimary focus:outline-none focus:ring-1 focus:ring-emerald-500/50 transition-all min-w-[140px]"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-[#0f172a]">
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={onClear}
            className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold text-rose-400 hover:text-rose-300 bg-rose-500/8 hover:bg-rose-500/15 border border-rose-500/20 rounded-xl transition-all whitespace-nowrap"
          >
            <X className="w-3.5 h-3.5" />
            Clear Filters
          </motion.button>
        )}
      </div>
    </motion.div>
  );
};

export default PaymentFilters;
