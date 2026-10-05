import { motion } from 'framer-motion';
import { Users, UserCheck, ShieldCheck, Truck, User } from 'lucide-react';
import { formatIndianNumber } from '../../../utils/formatters';

const StatCard = ({ label, value, icon: Icon, iconClass, gradient, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 14 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.05, duration: 0.4 }}
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
 * UserSummary Component
 * Displays real user counts from API or safe fallback values.
 */
export const UserSummary = ({ total, users = [], isLoading }) => {
  // Safe derived counts from current response data if platform aggregate is not separately sent
  const customerCount = users.filter((u) => u.role === 'user').length;
  const adminCount = users.filter((u) => u.role === 'admin').length;
  const deliveryCount = users.filter((u) => u.role === 'delivery').length;
  const activeCount = users.filter((u) => u.isActive !== false).length;

  const format = (val) => (val === null || val === undefined ? '--' : formatIndianNumber(val));

  const cards = [
    {
      label: 'Total Users',
      value: format(total),
      icon: Users,
      iconClass: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
      gradient: 'bg-indigo-500',
    },
    {
      label: 'Active Users',
      value: format(total > 0 ? activeCount : null),
      icon: UserCheck,
      iconClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      gradient: 'bg-emerald-500',
    },
    {
      label: 'Customers',
      value: format(total > 0 ? customerCount : null),
      icon: User,
      iconClass: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
      gradient: 'bg-blue-500',
    },
    {
      label: 'Laundry Admins',
      value: format(total > 0 ? adminCount : null),
      icon: ShieldCheck,
      iconClass: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
      gradient: 'bg-purple-500',
    },
    {
      label: 'Delivery Partners',
      value: format(total > 0 ? deliveryCount : null),
      icon: Truck,
      iconClass: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
      gradient: 'bg-amber-500',
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
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
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
      {cards.map((card, i) => (
        <StatCard key={card.label} {...card} index={i} />
      ))}
    </div>
  );
};

export default UserSummary;
