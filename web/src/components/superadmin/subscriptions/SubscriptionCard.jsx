import { motion } from 'framer-motion';
import { Store, Calendar } from 'lucide-react';
import { SubscriptionStatusBadge } from './SubscriptionStatusBadge';
import { SubscriptionRowActions } from './SubscriptionRowActions';

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '--';

const fmtCurrency = (amount, currency = 'INR') =>
  amount != null
    ? new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount)
    : '--';

/**
 * SubscriptionCard — Mobile view card for subscription item.
 */
export const SubscriptionCard = ({
  subscription: sub,
  onView,
  onActivate,
  onCancel,
  onRenew,
  index,
}) => {
  const laundryName = sub.laundry?.name || '--';
  const city = sub.laundry?.city || '';
  const ownerName = sub.laundry?.owner?.name || sub.laundry?.owner?.email || '--';
  const planName = sub.plan?.name || '--';
  const billingCycle = sub.plan?.billingCycle || '--';
  const price = fmtCurrency(sub.price, sub.currency);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="glass-card rounded-2xl border border-white/8 p-4 space-y-3"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/20 flex items-center justify-center flex-shrink-0">
            <Store className="w-4 h-4 text-purple-400" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-textPrimary truncate">{laundryName}</p>
            <p className="text-[11px] text-textMuted truncate">Owner: {ownerName} {city ? `• ${city}` : ''}</p>
          </div>
        </div>
        <SubscriptionStatusBadge status={sub.status} />
      </div>

      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/6 text-center">
        <div>
          <p className="text-[10px] text-textMuted uppercase font-semibold">Plan</p>
          <p className="text-xs font-bold text-purple-300 truncate">{planName}</p>
        </div>
        <div>
          <p className="text-[10px] text-textMuted uppercase font-semibold">Price</p>
          <p className="text-xs font-bold text-emerald-300 tabular-nums">{price}</p>
        </div>
        <div>
          <p className="text-[10px] text-textMuted uppercase font-semibold">Cycle</p>
          <p className="text-xs font-semibold text-textSecondary capitalize">{billingCycle}</p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-white/6 text-xs text-textMuted">
        <div className="flex items-center gap-1">
          <Calendar className="w-3 h-3 text-textMuted" />
          <span>Ends: {formatDate(sub.endDate)}</span>
        </div>
        <SubscriptionRowActions
          subscription={sub}
          onView={onView}
          onActivate={onActivate}
          onCancel={onCancel}
          onRenew={onRenew}
        />
      </div>
    </motion.div>
  );
};

export default SubscriptionCard;
