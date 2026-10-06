import { useRef } from 'react';
import { Search, X, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

const ROLE_OPTIONS = [
  { value: '', label: 'All Employee Roles' },
  { value: 'delivery', label: 'Delivery Partner' },
  { value: 'admin', label: 'Laundry Admin' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

/**
 * EmployeeFilters — Server-side filter bar for SuperAdmin Employees.
 */
export const EmployeeFilters = ({ filters, onChange, onClear, hasActiveFilters }) => {
  const searchRef = useRef(null);

  const handleSearch = (e) => {
    onChange({ ...filters, search: e.target.value });
  };

  const handleRole = (e) => {
    onChange({ ...filters, role: e.target.value });
  };

  const handleStatus = (e) => {
    onChange({ ...filters, status: e.target.value });
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
            id="employee-search"
            value={filters.search || ''}
            onChange={handleSearch}
            placeholder="Search employee by name, email, phone..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-textPrimary placeholder:text-textMuted focus:outline-none focus:ring-1 focus:ring-amber-500/50 focus:border-amber-500/40 transition-all"
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

        {/* Role Filter */}
        <div className="flex items-center gap-2">
          <label htmlFor="employee-role-filter" className="text-xs text-textMuted whitespace-nowrap hidden sm:block">
            Role
          </label>
          <select
            id="employee-role-filter"
            value={filters.role || ''}
            onChange={handleRole}
            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-textPrimary focus:outline-none focus:ring-1 focus:ring-amber-500/50 transition-all min-w-[160px]"
          >
            {ROLE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-[#0f172a]">
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <label htmlFor="employee-status-filter" className="text-xs text-textMuted whitespace-nowrap hidden sm:block">
            Status
          </label>
          <select
            id="employee-status-filter"
            value={filters.status || ''}
            onChange={handleStatus}
            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-textPrimary focus:outline-none focus:ring-1 focus:ring-amber-500/50 transition-all min-w-[130px]"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-[#0f172a]">
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Today Filter Button */}
        <button
          type="button"
          onClick={() => onChange({ ...filters, today: filters.today === 'true' ? '' : 'true' })}
          className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold rounded-xl border transition-all whitespace-nowrap ${
            filters.today === 'true'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-[0_0_12px_rgba(245,158,11,0.35)]'
              : 'bg-white/5 border-white/10 text-textMuted hover:text-textPrimary hover:bg-white/10'
          }`}
          title="Filter workforce onboarded today"
        >
          <Clock className="w-3.5 h-3.5" />
          Today
        </button>

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

export default EmployeeFilters;
