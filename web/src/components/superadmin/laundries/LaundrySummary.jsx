import { motion } from 'framer-motion';
import { Store, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { formatIndianNumber } from '../../../utils/formatters';

/**
 * LaundrySummary Component
 * Displays platform aggregate metrics: Total Laundries, Active, Pending, Suspended.
 */
export const LaundrySummary = ({ stats = {}, laundries = [], isLoading = false }) => {
  // Use backend stats if available; fallback to loaded dataset counts
  const totalCount =
    typeof stats.totalLaundries === 'number'
      ? stats.totalLaundries
      : laundries.length;

  const activeCount =
    typeof stats.activeLaundries === 'number'
      ? stats.activeLaundries
      : laundries.filter((l) => l.status === 'active').length;

  const pendingCount =
    typeof stats.pendingLaundries === 'number'
      ? stats.pendingLaundries
      : laundries.filter((l) => l.status === 'pending').length;

  const suspendedCount =
    typeof stats.suspendedLaundries === 'number'
      ? stats.suspendedLaundries
      : laundries.filter((l) => l.status === 'suspended').length;

  const cards = [
    {
      id: 'total',
      title: 'Total Laundries',
      value: totalCount,
      icon: Store,
      iconBg: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
      accentGlow: 'shadow-[0_0_20px_rgba(124,58,237,0.15)]',
    },
    {
      id: 'active',
      title: 'Active',
      value: activeCount,
      icon: CheckCircle2,
      iconBg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      accentGlow: 'shadow-[0_0_20px_rgba(34,197,94,0.15)]',
    },
    {
      id: 'pending',
      title: 'Pending',
      value: pendingCount,
      icon: Clock,
      iconBg: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
      accentGlow: 'shadow-[0_0_20px_rgba(245,158,11,0.15)]',
    },
    {
      id: 'suspended',
      title: 'Suspended',
      value: suspendedCount,
      icon: AlertTriangle,
      iconBg: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
      accentGlow: 'shadow-[0_0_20px_rgba(244,63,94,0.15)]',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.05 }}
            className={`glass-card p-3.5 sm:p-4 rounded-xl border border-white/8 flex items-center gap-3 relative overflow-hidden group hover:border-white/20 transition-all ${card.accentGlow}`}
          >
            <div
              className={`w-10 h-10 rounded-lg border flex items-center justify-center flex-shrink-0 ${card.iconBg}`}
            >
              <Icon className="w-5 h-5" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-medium text-textMuted uppercase tracking-wider truncate">
                {card.title}
              </p>
              {isLoading ? (
                <div className="h-6 w-16 bg-white/10 rounded animate-pulse mt-1" />
              ) : (
                <p className="text-lg sm:text-xl font-bold text-textPrimary mt-0.5 tracking-tight tabular-nums">
                  {formatIndianNumber(card.value)}
                </p>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default LaundrySummary;
