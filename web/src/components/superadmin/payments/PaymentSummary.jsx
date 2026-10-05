import { motion } from 'framer-motion';
import { CreditCard, DollarSign, Percent, CheckCircle, Clock } from 'lucide-react';
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
 * PaymentSummary — Displays real payment volume, total commission, and transaction count.
 */
export const PaymentSummary = ({ paymentsData, isLoading }) => {
  const total = paymentsData?.total ?? null;
  const totalCommission = paymentsData?.totalCommission ?? null;
  const paymentsList = paymentsData?.data || [];

  const successCount = paymentsList.filter((p) => p.status === 'success').length;
  const pendingCount = paymentsList.filter((p) => p.status === 'pending').length;

  const totalPageVolume = paymentsList.reduce((acc, p) => acc + (p.amount || 0), 0);

  const format = (val) => (val == null ? '--' : formatIndianNumber(val));
  const formatCurr = (val) => (val == null ? '--' : formatIndianCurrency(val));

  const cards = [
    {
      label: 'Total Transactions',
      value: format(total),
      icon: CreditCard,
      iconClass: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
      gradient: 'bg-purple-500',
    },
    {
      label: 'Page Volume',
      value: formatCurr(totalPageVolume),
      icon: DollarSign,
      iconClass: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
      gradient: 'bg-indigo-500',
    },
    {
      label: 'Total Platform Commission',
      value: formatCurr(totalCommission),
      icon: Percent,
      iconClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      gradient: 'bg-emerald-500',
    },
    {
      label: 'Successful (This Page)',
      value: format(successCount),
      icon: CheckCircle,
      iconClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      gradient: 'bg-emerald-500',
    },
    {
      label: 'Pending (This Page)',
      value: format(pendingCount),
      icon: Clock,
      iconClass: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
      gradient: 'bg-amber-500',
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
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
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {cards.map((card, i) => (
        <StatCard key={card.label} {...card} index={i} />
      ))}
    </div>
  );
};

export default PaymentSummary;
