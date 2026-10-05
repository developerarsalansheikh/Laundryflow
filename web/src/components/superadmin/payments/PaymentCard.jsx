import { motion } from 'framer-motion';
import { Eye, CreditCard, Store, User, Calendar } from 'lucide-react';
import { PaymentStatusBadge } from './PaymentStatusBadge';
import { formatIndianCurrency } from '../../../utils/formatters';

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '--';

/**
 * PaymentCard — Mobile view card for payment transaction item.
 */
export const PaymentCard = ({ payment: p, onView, index }) => {
  const txId = p.razorpayPaymentId || (p._id ? `#${p._id.slice(-8)}` : '--');
  const orderId = p.order?._id ? `#${p.order._id.slice(-6)}` : '--';
  const customerName = p.user?.name || p.user?.email || '--';
  const laundryName = p.laundryId?.name || '--';
  const amount = formatIndianCurrency(p.amount);
  const commission = p.commissionAmount != null ? formatIndianCurrency(p.commissionAmount) : '--';
  const method = p.method ? String(p.method).toUpperCase() : '--';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="glass-card rounded-2xl border border-white/8 p-4 space-y-3"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
            <CreditCard className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-mono font-bold text-textPrimary truncate">{txId}</p>
            <p className="text-[10px] text-textMuted font-mono">Order: {orderId}</p>
          </div>
        </div>
        <PaymentStatusBadge status={p.status} />
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-white/6">
        <div className="flex items-center gap-1.5 min-w-0">
          <User className="w-3.5 h-3.5 text-textMuted flex-shrink-0" />
          <span className="text-textSecondary truncate">{customerName}</span>
        </div>
        <div className="flex items-center gap-1.5 min-w-0">
          <Store className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
          <span className="text-purple-300 font-medium truncate">{laundryName}</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/6 text-center">
        <div>
          <p className="text-[10px] text-textMuted uppercase font-semibold">Amount</p>
          <p className="text-xs font-bold text-emerald-300 tabular-nums">{amount}</p>
        </div>
        <div>
          <p className="text-[10px] text-textMuted uppercase font-semibold">Method</p>
          <p className="text-xs font-semibold text-textSecondary">{method}</p>
        </div>
        <div>
          <p className="text-[10px] text-textMuted uppercase font-semibold">Commission</p>
          <p className="text-xs font-bold text-indigo-300 tabular-nums">{commission}</p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-white/6 text-xs text-textMuted">
        <div className="flex items-center gap-1">
          <Calendar className="w-3 h-3 text-textMuted" />
          <span>{formatDate(p.createdAt)}</span>
        </div>
        <button
          id={`pay-card-view-${p._id}`}
          onClick={() => onView(p)}
          className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/8 text-[11px] font-semibold text-textSecondary hover:text-textPrimary flex items-center gap-1 transition-all"
        >
          <Eye className="w-3 h-3" /> View
        </button>
      </div>
    </motion.div>
  );
};

export default PaymentCard;
