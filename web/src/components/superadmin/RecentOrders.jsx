import { motion } from 'framer-motion';
import { Receipt, ArrowUpRight } from 'lucide-react';
import {
  formatIndianCurrency,
  formatRelativeTime,
  mapStatus,
} from '../../utils/formatters';

// ── Badge variant lookup ──────────────────────────────────────────────────────
const BADGE_CLASSES = {
  success: 'bg-emerald-500/12 text-emerald-400 border-emerald-500/25',
  warning: 'bg-amber-500/12 text-amber-400 border-amber-500/25',
  danger: 'bg-red-500/12 text-red-400 border-red-500/25',
  info: 'bg-blue-500/12 text-blue-400 border-blue-500/25',
  neutral: 'bg-white/5 text-textMuted border-white/10',
};

// ── Payment method display labels (mapped from real backend values) ────────────
const METHOD_LABELS = {
  razorpay: 'Online',
  cod: 'COD',
  upi: 'UPI',
};

// ── Animation variants ────────────────────────────────────────────────────────
const listVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const rowVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] } },
};

// ── Avatar initials ───────────────────────────────────────────────────────────
const getInitials = (name = '') => {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase() || '??';
};

// ── Avatar colors based on first char ────────────────────────────────────────
const AVATAR_COLORS = [
  '#8B5CF6', '#3B82F6', '#06B6D4', '#F59E0B', '#22C55E',
  '#EC4899', '#EF4444', '#6366F1', '#14B8A6', '#F97316',
];
const getAvatarColor = (name = '') => {
  const code = name.charCodeAt(0) || 0;
  return AVATAR_COLORS[code % AVATAR_COLORS.length];
};

// ── RecentTransactions ────────────────────────────────────────────────────────

/**
 * RecentTransactions Component (labelled "Recent Orders" in UI for familiarity).
 * Displays real payment transactions from GET /api/super-admin/payments.
 * Backend has no dedicated super-admin recent-orders endpoint.
 * Fields used: user.name, laundryId.name, amount, method, status, createdAt.
 */
export const RecentOrders = ({ payments = [], isLoading = false }) => {
  const hasPayments = Array.isArray(payments) && payments.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.25, ease: [0.4, 0, 0.2, 1] }}
      className="glass-card p-5 flex flex-col h-full"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4 border-b border-white/8 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-500/15 flex items-center justify-center" aria-hidden="true">
            <Receipt className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <h2 className="text-sm font-bold text-textPrimary">Recent Orders</h2>
        </div>
        <span className="text-xs text-textMuted font-mono">
          {hasPayments ? `${payments.length} transactions` : ''}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1">
        {isLoading ? (
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3 py-2">
                <div className="w-8 h-8 rounded-full bg-white/8 flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-white/8 rounded w-32" />
                  <div className="h-2.5 bg-white/5 rounded w-24" />
                </div>
                <div className="space-y-1.5 text-right">
                  <div className="h-3 bg-white/8 rounded w-16" />
                  <div className="h-2.5 bg-white/5 rounded w-12 ml-auto" />
                </div>
              </div>
            ))}
          </div>
        ) : hasPayments ? (
          <motion.div
            variants={listVariants}
            initial="hidden"
            animate="visible"
            className="divide-y divide-white/[0.05]"
          >
            {payments.slice(0, 8).map((payment, idx) => {
              const { label, variant } = mapStatus(payment.status);
              const badgeClass = BADGE_CLASSES[variant] || BADGE_CLASSES.neutral;
              const customerName = payment.user?.name || 'Customer';
              const laundryName = payment.laundryId?.name || 'Laundry';
              const avatarColor = getAvatarColor(customerName);
              const methodLabel = METHOD_LABELS[payment.method] || payment.method || 'Online';

              return (
                <motion.div
                  key={payment._id || idx}
                  variants={rowVariants}
                  className="flex items-center justify-between py-2.5 group hover:bg-white/[0.02] rounded-lg px-1 -mx-1 transition-colors duration-150"
                >
                  {/* Left: Avatar + name */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    {/* Avatar with initials */}
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                      style={{ backgroundColor: `${avatarColor}30`, border: `1px solid ${avatarColor}40` }}
                      aria-label={`Avatar for ${customerName}`}
                    >
                      {getInitials(customerName)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-textPrimary truncate leading-tight">
                        {customerName}
                      </p>
                      <p className="text-[10px] text-textMuted truncate flex items-center gap-1">
                        <ArrowUpRight className="w-2.5 h-2.5 flex-shrink-0 text-textMuted" aria-hidden="true" />
                        {laundryName}
                        <span className="text-white/20">·</span>
                        <span className="font-medium">{methodLabel}</span>
                      </p>
                    </div>
                  </div>

                  {/* Right: Amount + status + time */}
                  <div className="text-right flex-shrink-0 ml-3">
                    <p className="text-xs font-bold text-textPrimary tabular-nums">
                      {formatIndianCurrency(payment.amount || 0)}
                    </p>
                    <div className="flex items-center justify-end gap-1.5 mt-0.5">
                      <span className={`inline-block px-1.5 py-px rounded-full border text-[9px] font-semibold ${badgeClass}`}>
                        {label}
                      </span>
                      <span className="text-[9px] text-textMuted">
                        {formatRelativeTime(payment.createdAt)}
                      </span>
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
              style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}
              aria-hidden="true"
            >
              <Receipt className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-xs font-semibold text-textPrimary">No Recent Orders</p>
              <p className="text-[11px] text-textMuted mt-1 max-w-[180px] leading-relaxed">
                Platform transaction history will appear here as orders are placed.
              </p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default RecentOrders;
