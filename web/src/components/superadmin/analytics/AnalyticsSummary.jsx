import { motion } from 'framer-motion';
import { TrendingUp, ShoppingBag, Store, Percent } from 'lucide-react';
import { formatIndianCurrency, formatIndianNumber } from '../../../utils/formatters';

const StatCard = ({ label, value, icon: Icon, iconClass, gradient, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 14 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.04, duration: 0.35 }}
    className="glass-card rounded-2xl p-4 border border-white/8 flex items-start gap-3 relative overflow-hidden"
  >
    <div className={`absolute inset-0 opacity-[0.03] ${gradient} rounded-2xl pointer-events-none`} />
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${iconClass}`}>
      <Icon className="w-5 h-5" />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-[11px] font-semibold text-textMuted uppercase tracking-wider mb-0.5 leading-tight">
        {label}
      </p>
      <p className="text-xl font-bold text-textPrimary tabular-nums truncate">{value}</p>
    </div>
  </motion.div>
);

/**
 * AnalyticsSummary — High-level metric highlights derived from real backend analytics response.
 */
export const AnalyticsSummary = ({ analyticsData, isLoading }) => {
  const d = analyticsData?.data || analyticsData || {};

  const monthlyTrends = d.monthlyTrends || [];
  const topLaundries = d.topLaundries || [];
  const orderStatusBreakdown = d.orderStatusBreakdown || [];

  const totalMonthlyRevenue = monthlyTrends.reduce((acc, curr) => acc + (curr.totalRevenue || 0), 0);
  const totalMonthlyCommission = monthlyTrends.reduce((acc, curr) => acc + (curr.totalCommission || 0), 0);
  const totalOrders = orderStatusBreakdown.reduce((acc, curr) => acc + (curr.count || 0), 0);
  const activeLaundriesCount = topLaundries.length;

  const format = (val) => (val == null ? '--' : formatIndianNumber(val));
  const formatCurr = (val) => (val == null ? '--' : formatIndianCurrency(val));

  const cards = [
    {
      label: 'Trend Revenue (6 Mo)',
      value: formatCurr(totalMonthlyRevenue),
      icon: TrendingUp,
      iconClass: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
      gradient: 'bg-purple-500',
    },
    {
      label: 'Trend Commission',
      value: formatCurr(totalMonthlyCommission),
      icon: Percent,
      iconClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      gradient: 'bg-emerald-500',
    },
    {
      label: 'Total Tracked Orders',
      value: format(totalOrders),
      icon: ShoppingBag,
      iconClass: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
      gradient: 'bg-indigo-500',
    },
    {
      label: 'Top Performing Laundries',
      value: format(activeLaundriesCount),
      icon: Store,
      iconClass: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
      gradient: 'bg-cyan-500',
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass-card rounded-2xl p-4 border border-white/8 animate-pulse">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex-shrink-0" />
              <div className="flex-1 space-y-2 pt-1">
                <div className="h-2 w-16 bg-white/5 rounded-full" />
                <div className="h-5 w-14 bg-white/8 rounded-md" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {cards.map((card, i) => (
        <StatCard key={card.label} {...card} index={i} />
      ))}
    </div>
  );
};

export default AnalyticsSummary;
