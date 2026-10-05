import { motion } from 'framer-motion';
import { Store, User } from 'lucide-react';
import { OrderStatusBadge } from './OrderStatusBadge';
import { formatIndianCurrency } from '../../../utils/formatters';

const METHOD_LABELS = { razorpay: 'Razorpay', cod: 'COD', upi: 'UPI' };

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
};

/**
 * OrderCard — Mobile card layout for order records.
 */
export const OrderCard = ({ order, onView, index = 0 }) => {
  const orderId = order._id || '—';
  const shortId = typeof orderId === 'string' ? `#${orderId.slice(-6).toUpperCase()}` : '—';
  const customerName = order.user?.name || '—';
  const laundryName = order.laundryId?.name || '—';
  const amount = formatIndianCurrency(order.totalAmount);
  const method = METHOD_LABELS[order.paymentMethod] || order.paymentMethod || '—';
  const orderStatus = order.status || 'pending';
  const date = formatDate(order.createdAt);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="glass-card rounded-2xl border border-white/8 p-4 shadow-lg space-y-3"
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-mono font-bold text-indigo-400">{shortId}</span>
        <OrderStatusBadge status={orderStatus} />
      </div>

      {/* Customer row */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500/30 to-purple-600/30 border border-white/10 flex items-center justify-center flex-shrink-0">
          <User className="w-3.5 h-3.5 text-indigo-300" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-textPrimary truncate">{customerName}</p>
          <p className="text-[10px] text-textMuted">Customer</p>
        </div>
      </div>

      {/* Laundry row */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-purple-500/15 border border-purple-500/25 flex items-center justify-center flex-shrink-0">
          <Store className="w-3.5 h-3.5 text-purple-400" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-textPrimary truncate">{laundryName}</p>
          <p className="text-[10px] text-textMuted">Laundry</p>
        </div>
      </div>

      {/* Bottom row: Amount, Method, Date, View */}
      <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/6">
        <div>
          <p className="text-sm font-bold text-textPrimary">{amount}</p>
          <p className="text-[10px] text-textMuted mt-0.5">{method} · {date}</p>
        </div>
        <button
          onClick={() => onView(order)}
          className="px-3 py-1.5 text-xs font-semibold text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 rounded-lg transition-all"
        >
          View
        </button>
      </div>
    </motion.div>
  );
};

export default OrderCard;
