import { Search, X, MapPin } from 'lucide-react';

const STATUS_TABS = [
  { key: '', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'active', label: 'Active' },
  { key: 'suspended', label: 'Suspended' },
];

/**
 * LaundryFilters Component
 * Search & filter bar supporting status tabs, text query, and city filter.
 */
export const LaundryFilters = ({
  searchQuery = '',
  onSearchChange,
  statusFilter = '',
  onStatusChange,
  cityFilter = '',
  onCityChange,
  todayFilter = false,
  onTodayChange,
  availableCities = [],
  totalResults = 0,
}) => {
  return (
    <div className="glass-card p-3 sm:p-4 rounded-2xl border border-white/8 space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between gap-4">
      {/* Left: Status filter tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
        {STATUS_TABS.map((tab) => {
          const isActive = statusFilter === tab.key;
          return (
            <button
              key={tab.key || 'all'}
              onClick={() => onStatusChange(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40 shadow-[0_0_15px_rgba(124,58,237,0.2)]'
                  : 'text-textMuted hover:text-textPrimary hover:bg-white/5 border border-transparent'
              }`}
            >
              {tab.label}
            </button>
          );
        })}

        {/* Today Filter Button */}
        <button
          onClick={() => onTodayChange && onTodayChange(!todayFilter)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 ${
            todayFilter
              ? 'bg-purple-600 text-white border border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.4)]'
              : 'text-textMuted hover:text-textPrimary hover:bg-white/5 border border-transparent'
          }`}
          title="Filter stores registered today"
        >
          Today
        </button>

        <span className="px-2 py-1 rounded-lg bg-white/5 text-[10px] font-mono text-purple-300 border border-white/10 ml-1">
          {totalResults} {totalResults === 1 ? 'laundry' : 'laundries'}
        </span>
      </div>

      {/* Right: Search Input & City Dropdown */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        {/* City Filter Dropdown */}
        {availableCities.length > 0 && (
          <div className="relative">
            <MapPin className="w-3.5 h-3.5 text-textMuted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={cityFilter}
              onChange={(e) => onCityChange(e.target.value)}
              className="w-full sm:w-36 pl-8 pr-7 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-textPrimary focus:outline-none focus:border-purple-500/50 appearance-none cursor-pointer"
            >
              <option value="" className="bg-lf-bg-secondary text-textPrimary">
                All Cities
              </option>
              {availableCities.map((c) => (
                <option key={c} value={c} className="bg-lf-bg-secondary text-textPrimary">
                  {c}
                </option>
              ))}
            </select>
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-textMuted text-[10px]">
              ▼
            </div>
          </div>
        )}

        {/* Search Field */}
        <div className="relative flex-1 sm:w-64">
          <Search className="w-4 h-4 text-textMuted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search laundries..."
            className="w-full pl-9 pr-8 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-textPrimary placeholder:text-textMuted focus:outline-none focus:border-purple-500/50 focus:bg-white/[0.07] transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-textMuted hover:text-textPrimary p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default LaundryFilters;
