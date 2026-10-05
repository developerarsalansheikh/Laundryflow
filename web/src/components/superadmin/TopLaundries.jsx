import { motion } from 'framer-motion';
import { Store, MapPin, TrendingUp, Building2 } from 'lucide-react';
import { formatIndianCurrency, formatIndianNumber, mapStatus } from '../../utils/formatters';

// ── Badge variant lookup ──────────────────────────────────────────────────────
const BADGE_CLASSES = {
  success: 'bg-emerald-500/12 text-emerald-400 border-emerald-500/25',
  warning: 'bg-amber-500/12 text-amber-400 border-amber-500/25',
  danger: 'bg-red-500/12 text-red-400 border-red-500/25',
  info: 'bg-blue-500/12 text-blue-400 border-blue-500/25',
  neutral: 'bg-white/5 text-textMuted border-white/10',
};

// ── Animation variants ────────────────────────────────────────────────────────
const listVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const rowVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] } },
};

// ── TopLaundries ──────────────────────────────────────────────────────────────

/**
 * TopLaundries Component.
 * Displays top laundry partners ranked by totalRevenue from real backend data.
 * Columns: Rank, Name/City, Revenue, Orders, Progress bar.
 */
export const TopLaundries = ({ laundries = [], isLoading = false }) => {
  const hasLaundries = Array.isArray(laundries) && laundries.length > 0;

  // Compute max revenue for progress bar scaling
  const maxRevenue = hasLaundries
    ? Math.max(...laundries.map((l) => l.totalRevenue || 0))
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="glass-card p-5 flex flex-col h-full"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4 border-b border-white/8 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-purple-500/15 flex items-center justify-center" aria-hidden="true">
            <Building2 className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <h2 className="text-sm font-bold text-textPrimary">Top Laundries</h2>
        </div>
        <div className="flex items-center gap-1.5">
          <TrendingUp className="w-3 h-3 text-emerald-400" aria-hidden="true" />
          <span className="text-[10px] text-textMuted font-mono">by revenue</span>
        </div>
      </div>

      {/* Column headers */}
      {hasLaundries && (
        <div className="grid grid-cols-12 gap-1 text-[9px] font-bold uppercase tracking-wider text-textMuted mb-2 px-1">
          <span className="col-span-1">#</span>
          <span className="col-span-5">Laundry</span>
          <span className="col-span-3 text-right">Revenue</span>
          <span className="col-span-3 text-right">Orders</span>
        </div>
      )}

      {/* Content */}
      <div className="flex-1">
        {isLoading ? (
          <div className="space-y-2.5 animate-pulse">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-white/5 rounded-xl" />
            ))}
          </div>
        ) : hasLaundries ? (
          <motion.div
            variants={listVariants}
            initial="hidden"
            animate="visible"
            className="space-y-2"
          >
            {laundries.slice(0, 5).map((item, idx) => {
              const { label, variant } = mapStatus(item.status);
              const badgeClass = BADGE_CLASSES[variant] || BADGE_CLASSES.neutral;
              const progressPct = maxRevenue > 0
                ? Math.round(((item.totalRevenue || 0) / maxRevenue) * 100)
                : 0;
              const rankColors = ['#8B5CF6', '#3B82F6', '#06B6D4', '#F59E0B', '#22C55E'];

              return (
                <motion.div
                  key={item._id || idx}
                  variants={rowVariants}
                  className="p-2.5 rounded-xl bg-white/[0.03] border border-white/8 hover:border-purple-500/30 hover:bg-white/[0.05] transition-all duration-200 group"
                >
                  <div className="grid grid-cols-12 gap-1 items-center mb-1.5">
                    {/* Rank */}
                    <div className="col-span-1">
                      <span
                        className="w-5 h-5 rounded-full text-[9px] font-extrabold flex items-center justify-center"
                        style={{ backgroundColor: `${rankColors[idx]}20`, color: rankColors[idx] }}
                      >
                        {idx + 1}
                      </span>
                    </div>

                    {/* Name + city */}
                    <div className="col-span-5 min-w-0">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <div
                          className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: `${rankColors[idx]}15` }}
                          aria-hidden="true"
                        >
                          <Store className="w-3 h-3" style={{ color: rankColors[idx] }} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] font-semibold text-textPrimary truncate leading-tight">
                            {item.name}
                          </p>
                          {item.city && (
                            <p className="text-[9px] text-textMuted flex items-center gap-0.5 truncate">
                              <MapPin className="w-2 h-2 flex-shrink-0" aria-hidden="true" />
                              {item.city}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Revenue */}
                    <div className="col-span-3 text-right">
                      <p className="text-[11px] font-bold text-textPrimary tabular-nums">
                        {formatIndianCurrency(item.totalRevenue || 0)}
                      </p>
                      <span className={`inline-block px-1.5 py-0 rounded-full border text-[8px] font-semibold ${badgeClass}`}>
                        {label}
                      </span>
                    </div>

                    {/* Orders */}
                    <div className="col-span-3 text-right">
                      <p className="text-[11px] font-semibold text-textSecondary tabular-nums">
                        {formatIndianNumber(item.totalOrders || 0)}
                      </p>
                      <p className="text-[9px] text-textMuted">orders</p>
                    </div>
                  </div>

                  {/* Revenue progress bar */}
                  <div className="pl-6">
                    <div className="w-full h-1 bg-white/8 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPct}%` }}
                        transition={{ duration: 0.7, delay: idx * 0.08 + 0.3, ease: 'easeOut' }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: rankColors[idx] }}
                      />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        ) : (
          /* Empty state */
          <div className="py-10 text-center space-y-3 flex flex-col items-center justify-center h-full">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}
              aria-hidden="true"
            >
              <Store className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-xs font-semibold text-textPrimary">No Laundries Yet</p>
              <p className="text-[11px] text-textMuted mt-1 max-w-[180px] leading-relaxed">
                Registered laundry partners will appear here ranked by revenue.
              </p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default TopLaundries;
