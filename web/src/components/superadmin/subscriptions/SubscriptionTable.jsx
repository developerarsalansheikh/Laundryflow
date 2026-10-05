import { motion } from 'framer-motion';
import { Store } from 'lucide-react';
import { SubscriptionStatusBadge } from './SubscriptionStatusBadge';
import { SubscriptionRowActions } from './SubscriptionRowActions';

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '--';

const fmtCurrency = (amount, currency = 'INR') =>
  amount != null
    ? new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount)
    : '--';

/**
 * SubscriptionTable — Desktop table with real Subscription backend fields.
 * Columns: Laundry, Owner, Plan, Status, Price, Billing Cycle, Start Date, End Date, Actions
 */
export const SubscriptionTable = ({ subscriptions, onView, onActivate, onCancel, onRenew }) => {
  const headers = [
    'Laundry',
    'Owner',
    'Plan',
    'Status',
    'Price',
    'Cycle',
    'Start Date',
    'End Date',
    'Actions',
  ];

  return (
    <table className="w-full min-w-[900px]">
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
        {subscriptions.map((sub, i) => {
          const laundryName = sub.laundry?.name || '--';
          const city = sub.laundry?.city || '';
          const ownerName = sub.laundry?.owner?.name || sub.laundry?.owner?.email || '--';
          const planName = sub.plan?.name || '--';
          const billingCycle = sub.plan?.billingCycle || '--';
          const price = fmtCurrency(sub.price, sub.currency);

          return (
            <motion.tr
              key={sub._id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.025 }}
              className="border-b border-white/4 hover:bg-white/[0.025] group transition-colors"
            >
              {/* Laundry */}
              <td className="px-4 py-3.5 pl-5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/20 flex items-center justify-center flex-shrink-0">
                    <Store className="w-4 h-4 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-textPrimary truncate max-w-[130px]">{laundryName}</p>
                    {city && <p className="text-[10px] text-textMuted">{city}</p>}
                  </div>
                </div>
              </td>

              {/* Owner */}
              <td className="px-4 py-3.5">
                <p className="text-xs text-textSecondary truncate max-w-[110px]">{ownerName}</p>
              </td>

              {/* Plan */}
              <td className="px-4 py-3.5">
                <span className="text-xs font-semibold text-purple-300">{planName}</span>
              </td>

              {/* Status */}
              <td className="px-4 py-3.5">
                <SubscriptionStatusBadge status={sub.status} />
              </td>

              {/* Price */}
              <td className="px-4 py-3.5">
                <span className="text-xs font-semibold text-emerald-300 tabular-nums">{price}</span>
              </td>

              {/* Cycle */}
              <td className="px-4 py-3.5">
                <span className="text-xs text-textSecondary capitalize">{billingCycle}</span>
              </td>

              {/* Start Date */}
              <td className="px-4 py-3.5">
                <span className="text-xs text-textMuted tabular-nums">{formatDate(sub.startDate)}</span>
              </td>

              {/* End Date */}
              <td className="px-4 py-3.5">
                <span className="text-xs text-textMuted tabular-nums">{formatDate(sub.endDate)}</span>
              </td>

              {/* Actions */}
              <td className="px-4 py-3.5 pr-5">
                <SubscriptionRowActions
                  subscription={sub}
                  onView={onView}
                  onActivate={onActivate}
                  onCancel={onCancel}
                  onRenew={onRenew}
                />
              </td>
            </motion.tr>
          );
        })}
      </tbody>
    </table>
  );
};

export default SubscriptionTable;
