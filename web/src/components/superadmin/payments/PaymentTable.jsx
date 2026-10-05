import { motion } from 'framer-motion';
import { Eye, CreditCard, Store, User } from 'lucide-react';
import { PaymentStatusBadge } from './PaymentStatusBadge';
import { formatIndianCurrency } from '../../../utils/formatters';

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '--';

/**
 * PaymentTable — Desktop table for platform payment transactions.
 * Columns: Transaction ID / Ref, Order, Customer, Laundry, Amount, Method, Status, Commission, Date, Actions
 */
export const PaymentTable = ({ payments, onView }) => {
  const headers = [
    'Transaction / Ref',
    'Order',
    'Customer',
    'Laundry',
    'Amount',
    'Method',
    'Status',
    'Commission',
    'Date',
    'Actions',
  ];

  return (
    <table className="w-full min-w-[960px]">
      <thead>
        <tr className="border-b border-white/8">
          {headers.map((h) => (
            <th
              key={h}
              className="text-left text-[10px] font-bold uppercase tracking-wider text-textMuted px-4 py-3 first:pl-5 last:pr-5 whitespace-nowrap"
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {payments.map((p, i) => {
          const txId = p.razorpayPaymentId || (p._id ? `#${p._id.slice(-8)}` : '--');
          const orderId = p.order?._id ? `#${p.order._id.slice(-6)}` : '--';
          const customerName = p.user?.name || p.user?.email || '--';
          const laundryName = p.laundryId?.name || '--';
          const amount = formatIndianCurrency(p.amount);
          const commission = p.commissionAmount != null ? formatIndianCurrency(p.commissionAmount) : '--';
          const method = p.method ? String(p.method).toUpperCase() : '--';

          return (
            <motion.tr
              key={p._id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.025 }}
              className="border-b border-white/4 hover:bg-white/[0.025] group transition-colors"
            >
              {/* Transaction ID */}
              <td className="px-4 py-3.5 pl-5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                    <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <span className="text-xs font-mono font-semibold text-textPrimary truncate max-w-[120px]">
                    {txId}
                  </span>
                </div>
              </td>

              {/* Order */}
              <td className="px-4 py-3.5">
                <span className="text-xs font-mono text-textSecondary">{orderId}</span>
              </td>

              {/* Customer */}
              <td className="px-4 py-3.5">
                <div className="flex items-center gap-1.5">
                  <User className="w-3 h-3 text-textMuted flex-shrink-0" />
                  <span className="text-xs text-textPrimary truncate max-w-[110px]">{customerName}</span>
                </div>
              </td>

              {/* Laundry */}
              <td className="px-4 py-3.5">
                <div className="flex items-center gap-1.5">
                  <Store className="w-3 h-3 text-purple-400 flex-shrink-0" />
                  <span className="text-xs font-medium text-purple-300 truncate max-w-[110px]">{laundryName}</span>
                </div>
              </td>

              {/* Amount */}
              <td className="px-4 py-3.5">
                <span className="text-xs font-bold text-emerald-300 tabular-nums">{amount}</span>
              </td>

              {/* Method */}
              <td className="px-4 py-3.5">
                <span className="text-[11px] font-semibold text-textSecondary px-2 py-0.5 rounded-md bg-white/5 border border-white/8">
                  {method}
                </span>
              </td>

              {/* Status */}
              <td className="px-4 py-3.5">
                <PaymentStatusBadge status={p.status} />
              </td>

              {/* Commission */}
              <td className="px-4 py-3.5">
                <span className="text-xs font-semibold text-indigo-300 tabular-nums">{commission}</span>
              </td>

              {/* Date */}
              <td className="px-4 py-3.5">
                <span className="text-xs text-textMuted tabular-nums whitespace-nowrap">{formatDate(p.createdAt)}</span>
              </td>

              {/* Actions */}
              <td className="px-4 py-3.5 pr-5">
                <button
                  id={`pay-view-${p._id}`}
                  onClick={() => onView(p)}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/8 text-textMuted hover:text-textPrimary transition-all"
                  title="View Details"
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>
              </td>
            </motion.tr>
          );
        })}
      </tbody>
    </table>
  );
};

export default PaymentTable;
