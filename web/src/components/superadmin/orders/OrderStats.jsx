import { motion } from 'framer-motion';
import { ShoppingCart, Clock, TrendingUp, Banknote } from 'lucide-react';
import { formatIndianCurrency, formatIndianNumber } from '../../../utils/formatters';

const StatCard = ({ label, value, icon: Icon, iconClass, gradient, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 14 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.06, duration: 0.4 }}
    className="glass-card rounded-2xl p-4 border border-white/8 flex items-start gap-3 relative overflow-hidden"
  >
    <div className={`absolute inset-0 opacity-[0.035] ${gradient} rounded-2xl`} />
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${iconClass}`}>
      <Icon className="w-5 h-5" />
    </div>
    <div className="min-w-0">
      <p className="text-[11px] font-semibold text-textMuted uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-xl font-bold text-textPrimary tabular-nums truncate">{value}</p>
    </div>
  </motion.div>
);

/**
 * OrderStats — Displays real backend aggregate stats from /api/super-admin/dashboard.
 */
export const OrderStats = ({ stats, isLoading }) => {
  const totalOrders = stats?.totalOrders ?? null;
  const totalRevenue = stats?.totalRevenue ?? null;
  const totalCommission = stats?.totalCommission ?? null;
  const pendingOrders = stats?.pendingOrders ?? null;

  const format = (val) => (val === null ? '--' : formatIndianNumber(val));
  const formatCurrency = (val) => (val === null ? '--' : formatIndianCurrency(val));

  const cards = [
    {
      label: 'Total Orders',
      value: format(totalOrders),
      icon: ShoppingCart,
      iconClass: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
      gradient: 'bg-indigo-500',
    },
    {
      label: 'Pending',
      value: format(pendingOrders),
      icon: Clock,
      iconClass: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
      gradient: 'bg-amber-500',
    },
    {
      label: 'Total Revenue',
      value: formatCurrency(totalRevenue),
      icon: TrendingUp,
      iconClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      gradient: 'bg-emerald-500',
    },
    {
      label: 'Total Commission',
      value: formatCurrency(totalCommission),
      icon: Banknote,
      iconClass: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
      gradient: 'bg-purple-500',
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass-card rounded-2xl p-4 border border-white/8 animate-pulse">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/5" />
              <div className="flex-1">
                <div className="h-2.5 w-16 bg-white/5 rounded-full mb-2" />
                <div className="h-5 w-20 bg-white/8 rounded-md" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {cards.map((card, i) => (
        <StatCard key={card.label} {...card} index={i} />
      ))}
    </div>
  );
};

export default OrderStats;
