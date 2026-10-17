import { useState } from 'react';
import { Calendar } from 'lucide-react';

/**
 * AnalyticsHeader Component — matching reference Business Analytics Dashboard
 */
export const AnalyticsHeader = () => {
  const [timeRange, setTimeRange] = useState('Last Month');

  // Compute clean date range display (e.g. 2025-12-22 to 2026-01-22)
  const today = new Date();
  const past = new Date(today);
  past.setDate(today.getDate() - 30);
  const formatDate = (d) => d.toISOString().split('T')[0];

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Business Analytics Dashboard
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Analyzing data from {formatDate(past)} to {formatDate(today)}
        </p>
      </div>

      <div className="flex items-center gap-2 self-start sm:self-auto bg-white border border-slate-200/90 rounded-xl px-3 py-1.5 shadow-2xs">
        <Calendar className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-[11px] font-medium text-slate-500">Time Range:</span>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          aria-label="Analytics time range filter"
          className="bg-transparent text-xs font-semibold text-slate-800 outline-none cursor-pointer"
        >
          <option value="Last Month" className="bg-white text-slate-800">Last Month</option>
          <option value="Last 7 Days" className="bg-white text-slate-800">Last 7 Days</option>
          <option value="Last 30 Days" className="bg-white text-slate-800">Last 30 Days</option>
          <option value="This Year" className="bg-white text-slate-800">This Year</option>
        </select>
      </div>
    </div>
  );
};

export default AnalyticsHeader;
