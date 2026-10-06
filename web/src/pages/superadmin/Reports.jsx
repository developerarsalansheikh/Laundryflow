import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Download,
  RefreshCw,
  TrendingUp,
  ShoppingCart,
  XCircle,
  DollarSign,
  Percent,
  Users,
  Building2,
  AlertTriangle,
  Calendar,
  BarChart3,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useReports } from '../../hooks/useReports';

// ── Helpers ──────────────────────────────────────────────────
const fmtCurrency = (n) =>
  typeof n === 'number'
    ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)
    : '—';

const fmtNumber = (n) => (typeof n === 'number' ? n.toLocaleString('en-IN') : '—');

const PAGE_VARIANTS = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

const STAT_VARIANTS = {
  hidden: { opacity: 0, scale: 0.94 },
  visible: (i) => ({
    opacity: 1,
    scale: 1,
    transition: { delay: 0.08 * i, duration: 0.35, ease: 'easeOut' },
  }),
};

// ── Summary Stat Card ─────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, color, index, loading }) => (
  <motion.div
    custom={index}
    variants={STAT_VARIANTS}
    initial="hidden"
    animate="visible"
    className="glass-card rounded-2xl border border-white/8 p-5 flex items-start gap-4"
  >
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
      <Icon className="w-5 h-5" />
    </div>
    <div className="min-w-0">
      <p className="text-xs text-textSecondary font-medium mb-1">{label}</p>
      {loading ? (
        <div className="h-5 w-24 bg-white/8 rounded-md animate-pulse" />
      ) : (
        <p className="text-xl font-bold text-textPrimary truncate">{value}</p>
      )}
    </div>
  </motion.div>
);

// ── CSV Export ─────────────────────────────────────────────────
const exportCsv = (summary, period) => {
  const rows = [
    ['LaundryFlow Super Admin Report'],
    [`Period: ${period.startDate} to ${period.endDate}`],
    [],
    ['Metric', 'Value'],
    ['Total Orders', summary.totalOrders],
    ['Completed Orders', summary.completedOrders],
    ['Cancelled Orders', summary.cancelledOrders],
    ['Total Revenue (INR)', summary.totalRevenue],
    ['Total Commission (INR)', summary.totalCommission],
    ['New Users', summary.newUsers],
    ['New Laundries', summary.newLaundries],
  ];
  const csvContent = rows.map((r) => r.join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `laundryflow-report-${Date.now()}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

// ── Main Component ─────────────────────────────────────────────
export const Reports = () => {
  const queryClient = useQueryClient();

  // Date range filters
  const today = new Date().toISOString().split('T')[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(thirtyDaysAgo);
  const [endDate, setEndDate] = useState(today);
  const [appliedParams, setAppliedParams] = useState({});

  const { data, isLoading, isError, error, isFetching, refetch } = useReports(appliedParams);

  const summary = data?.data?.summary || {};
  const period = data?.data?.period || {};

  const handleApplyFilter = useCallback(() => {
    const params = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    setAppliedParams(params);
  }, [startDate, endDate]);

  const handleClearFilter = useCallback(() => {
    setStartDate('');
    setEndDate('');
    setAppliedParams({});
  }, []);

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['superadmin', 'reports'] });
    toast.success('Report data refreshed.');
  };

  const handleExport = () => {
    if (!data?.data) return;
    exportCsv(summary, period);
    toast.success('CSV exported successfully.');
  };

  const stats = [
    {
      icon: ShoppingCart,
      label: 'Total Orders',
      value: fmtNumber(summary.totalOrders),
      color: 'bg-indigo-500/15 text-indigo-400',
    },
    {
      icon: TrendingUp,
      label: 'Completed Orders',
      value: fmtNumber(summary.completedOrders),
      color: 'bg-emerald-500/15 text-emerald-400',
    },
    {
      icon: XCircle,
      label: 'Cancelled Orders',
      value: fmtNumber(summary.cancelledOrders),
      color: 'bg-rose-500/15 text-rose-400',
    },
    {
      icon: DollarSign,
      label: 'Total Revenue',
      value: fmtCurrency(summary.totalRevenue),
      color: 'bg-violet-500/15 text-violet-400',
    },
    {
      icon: Percent,
      label: 'Total Commission',
      value: fmtCurrency(summary.totalCommission),
      color: 'bg-amber-500/15 text-amber-400',
    },
    {
      icon: Users,
      label: 'New Users',
      value: fmtNumber(summary.newUsers),
      color: 'bg-sky-500/15 text-sky-400',
    },
    {
      icon: Building2,
      label: 'New Laundries',
      value: fmtNumber(summary.newLaundries),
      color: 'bg-pink-500/15 text-pink-400',
    },
  ];

  // Completion rate
  const completionRate =
    summary.totalOrders > 0
      ? ((summary.completedOrders / summary.totalOrders) * 100).toFixed(1)
      : '—';

  return (
    <motion.div
      variants={PAGE_VARIANTS}
      initial="hidden"
      animate="visible"
      className="space-y-5"
    >
      {/* Header */}
      <div className="glass-card rounded-2xl border border-white/8 p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/15 border border-violet-500/20 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-textPrimary">Reports</h1>
              <p className="text-xs text-textSecondary">Platform-wide business intelligence snapshot</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              id="reports-refresh-btn"
              onClick={handleRefresh}
              disabled={isFetching}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-textSecondary bg-white/5 hover:bg-white/10 border border-white/8 rounded-xl transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              id="reports-export-btn"
              onClick={handleExport}
              disabled={isLoading || !data?.data}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-violet-300 bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 rounded-xl transition-all disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Date Range Filter */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card rounded-2xl border border-white/8 p-5"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
          <div className="flex items-center gap-2 text-textSecondary mb-1 sm:mb-0">
            <Calendar className="w-4 h-4" />
            <span className="text-xs font-semibold text-textPrimary">Date Range</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            <div className="flex flex-col gap-1">
              <label htmlFor="report-start-date" className="text-[11px] text-textMuted font-medium">
                From
              </label>
              <input
                id="report-start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2 text-sm text-textPrimary bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/40 transition-all"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="report-end-date" className="text-[11px] text-textMuted font-medium">
                To
              </label>
              <input
                id="report-end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-2 text-sm text-textPrimary bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/40 transition-all"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              id="report-today-filter"
              type="button"
              onClick={() => {
                setStartDate(today);
                setEndDate(today);
                setAppliedParams({ today: 'true' });
              }}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all shadow-[0_0_12px_rgba(99,102,241,0.3)]"
            >
              Today
            </button>
            <button
              id="report-apply-filter"
              onClick={handleApplyFilter}
              className="px-4 py-2 text-xs font-semibold text-white bg-violet-600 hover:bg-violet-500 rounded-xl transition-all"
            >
              Apply
            </button>
            <button
              id="report-clear-filter"
              onClick={handleClearFilter}
              className="px-4 py-2 text-xs font-semibold text-textSecondary bg-white/5 hover:bg-white/10 border border-white/8 rounded-xl transition-all"
            >
              All Time
            </button>
          </div>
        </div>
        {(period.startDate || period.endDate) && !isLoading && (
          <p className="mt-3 text-[11px] text-textMuted flex items-center gap-1">
            <FileText className="w-3 h-3" />
            Showing: {period.startDate !== 'all' ? period.startDate : 'All time'} → {period.endDate !== 'now' ? period.endDate : 'Now'}
          </p>
        )}
      </motion.div>

      {/* Error State */}
      {isError && (
        <div className="glass-card rounded-2xl border border-rose-500/20 p-10 flex flex-col items-center justify-center gap-4 text-center">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-rose-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-textPrimary">Unable to load report data</p>
            <p className="text-xs text-textMuted mt-1">
              {error?.response?.status === 403
                ? 'Access denied. SuperAdmin session required.'
                : 'A server error occurred. Please try again.'}
            </p>
          </div>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 text-xs font-semibold text-violet-400 bg-violet-500/10 border border-violet-500/20 rounded-xl hover:bg-violet-500/20 transition-all"
          >
            Retry
          </button>
        </div>
      )}

      {/* Stats Grid */}
      {!isError && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <StatCard key={s.label} {...s} index={i} loading={isLoading} />
          ))}
        </div>
      )}

      {/* Completion Rate & Summary Table */}
      {!isError && !isLoading && summary.totalOrders !== undefined && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="glass-card rounded-2xl border border-white/8 overflow-hidden"
        >
          <div className="px-5 py-4 border-b border-white/6">
            <h2 className="text-sm font-semibold text-textPrimary flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Summary Breakdown
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/6 bg-white/3">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-textMuted uppercase tracking-wide">
                    Metric
                  </th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-textMuted uppercase tracking-wide">
                    Value
                  </th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-textMuted uppercase tracking-wide">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  { metric: 'Total Orders', value: fmtNumber(summary.totalOrders), note: 'All orders in period' },
                  { metric: 'Completed Orders', value: fmtNumber(summary.completedOrders), note: 'Status: delivered' },
                  { metric: 'Cancelled Orders', value: fmtNumber(summary.cancelledOrders), note: 'Status: cancelled' },
                  { metric: 'Order Completion Rate', value: `${completionRate}%`, note: 'Completed / Total' },
                  { metric: 'Total Revenue', value: fmtCurrency(summary.totalRevenue), note: 'From paid orders' },
                  { metric: 'Platform Commission', value: fmtCurrency(summary.totalCommission), note: 'Platform earnings' },
                  { metric: 'New Users Registered', value: fmtNumber(summary.newUsers), note: 'In period' },
                  { metric: 'New Laundries Joined', value: fmtNumber(summary.newLaundries), note: 'In period' },
                ].map((row, i) => (
                  <tr
                    key={row.metric}
                    className={`border-b border-white/4 hover:bg-white/3 transition-colors ${i % 2 === 0 ? '' : 'bg-white/1'}`}
                  >
                    <td className="px-5 py-3.5 text-textPrimary font-medium">{row.metric}</td>
                    <td className="px-5 py-3.5 text-right font-bold text-textPrimary">{row.value}</td>
                    <td className="px-5 py-3.5 text-right text-xs text-textMuted">{row.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 border-t border-white/6 flex justify-end">
            <button
              onClick={handleExport}
              disabled={isLoading || !data?.data}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-violet-300 bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 rounded-lg transition-all disabled:opacity-50"
            >
              <Download className="w-3 h-3" />
              Download CSV
            </button>
          </div>
        </motion.div>
      )}

      {/* Loading skeleton for table */}
      {isLoading && !isError && (
        <div className="glass-card rounded-2xl border border-white/8 overflow-hidden">
          <div className="px-5 py-4 border-b border-white/6">
            <div className="h-4 w-40 bg-white/8 rounded animate-pulse" />
          </div>
          <div className="p-5 space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex justify-between">
                <div className="h-3 w-48 bg-white/8 rounded animate-pulse" />
                <div className="h-3 w-24 bg-white/8 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default Reports;
