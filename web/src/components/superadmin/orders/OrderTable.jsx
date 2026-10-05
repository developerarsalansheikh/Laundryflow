import { motion } from 'framer-motion';
import { OrderStatusBadge } from './OrderStatusBadge';
import { OrderRowActions } from './OrderRowActions';
import { formatIndianCurrency } from '../../../utils/formatters';

const METHOD_LABELS = {
  razorpay: 'Razorpay',
  cod: 'COD',
  upi: 'UPI',
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const getInitials = (name = '') =>
  name
    .trim()
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase() || '?';

const AvatarCell = ({ name }) => (
  <div className="flex items-center gap-2.5 min-w-0">
    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500/30 to-purple-600/30 border border-white/10 flex items-center justify-center text-[10px] font-bold text-indigo-300 flex-shrink-0">
      {getInitials(name)}
    </div>
    <span className="text-xs font-medium text-textPrimary truncate">{name || '—'}</span>
  </div>
);

/**
 * OrderTable — Desktop table layout.
 * Data source: GET /api/super-admin/orders
 */
export const OrderTable = ({ orders, onView }) => {
  return (
    <div className="overflow-x-auto rounded-xl">
      <table className="w-full min-w-[800px] border-collapse">
        <thead>
          <tr className="border-b border-white/8">
            {['Order ID', 'Customer', 'Laundry', 'Amount', 'Method', 'Status', 'Date', ''].map((h) => (
              <th
                key={h}
                className="px-4 py-3 text-left text-[10px] font-semibold text-textMuted uppercase tracking-wider whitespace-nowrap"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {orders.map((order, i) => {
            const orderId = order._id || '—';
            const shortId = typeof orderId === 'string' ? `#${orderId.slice(-6).toUpperCase()}` : '—';
            const customerName = order.user?.name || '—';
            const laundryName = order.laundryId?.name || '—';
            const amount = formatIndianCurrency(order.totalAmount);
            const method = METHOD_LABELS[order.paymentMethod] || order.paymentMethod || '—';
            const orderStatus = order.status || 'pending';
            const date = formatDate(order.createdAt);

            return (
              <motion.tr
                key={order._id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.025 }}
                className="border-b border-white/4 hover:bg-white/3 transition-colors group"
              >
                {/* Order ID */}
                <td className="px-4 py-3.5">
                  <span className="text-xs font-mono font-semibold text-indigo-400">{shortId}</span>
                </td>

                {/* Customer */}
                <td className="px-4 py-3.5">
                  <AvatarCell name={customerName} />
                </td>

                {/* Laundry */}
                <td className="px-4 py-3.5">
                  <span className="text-xs text-textSecondary truncate max-w-[120px] block">{laundryName}</span>
                </td>

                {/* Amount */}
                <td className="px-4 py-3.5">
                  <span className="text-xs font-semibold text-textPrimary">{amount}</span>
                </td>

                {/* Payment Method */}
                <td className="px-4 py-3.5">
                  <span className="text-xs font-medium text-textSecondary">{method}</span>
                </td>

                {/* Status */}
                <td className="px-4 py-3.5">
                  <OrderStatusBadge status={orderStatus} />
                </td>

                {/* Date */}
                <td className="px-4 py-3.5">
                  <span className="text-xs text-textMuted">{date}</span>
                </td>

                {/* Actions */}
                <td className="px-4 py-3.5">
                  <OrderRowActions order={order} onView={onView} />
                </td>
              </motion.tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default OrderTable;
