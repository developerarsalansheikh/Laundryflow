import { motion } from 'framer-motion';
import {
  Layers, CheckCircle, Clock, XCircle, AlertCircle,
  DollarSign, Calendar,
} from 'lucide-react';

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

const fmt = (val) => (val == null ? '--' : Number(val).toLocaleString('en-IN'));
const fmtCurrency = (val) =>
  val == null
    ? '--'
    : new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

/**
 * SubscriptionSummary — Real subscription stats from GET /api/super-admin/subscriptions/stats
 */
export const SubscriptionSummary = ({ stats, isLoading }) => {
  const d = stats?.data || stats || null;

  const cards = [
    {
      label: 'Total Subscriptions',
      value: fmt(d?.totalSubscriptions),
      icon: Layers,
      iconClass: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
      gradient: 'bg-purple-500',
    },
    {
      label: 'Active',
      value: fmt(d?.activeSubscriptions),
      icon: CheckCircle,
      iconClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      gradient: 'bg-emerald-500',
    },
    {
      label: 'Trial',
      value: fmt(d?.trialSubscriptions),
      icon: Clock,
      iconClass: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
      gradient: 'bg-amber-500',
    },
    {
      label: 'Expired',
      value: fmt(d?.expiredSubscriptions),
      icon: AlertCircle,
      iconClass: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
      gradient: 'bg-slate-500',
    },
    {
      label: 'Cancelled',
      value: fmt(d?.cancelledSubscriptions),
      icon: XCircle,
      iconClass: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
      gradient: 'bg-rose-500',
    },
    {
      label: 'Monthly Revenue',
      value: fmtCurrency(d?.monthlyRevenue),
      icon: DollarSign,
      iconClass: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
      gradient: 'bg-indigo-500',
    },
    {
      label: 'Yearly Revenue',
      value: fmtCurrency(d?.yearlyRevenue),
      icon: Calendar,
      iconClass: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
      gradient: 'bg-blue-500',
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
        {Array.from({ length: 7 }).map((_, i) => (
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
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
      {cards.map((card, i) => (
        <StatCard key={card.label} {...card} index={i} />
      ))}
    </div>
  );
};

export default SubscriptionSummary;
