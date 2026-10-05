import { motion } from 'framer-motion';
import { Store, User, MapPin, Calendar } from 'lucide-react';
import LaundryStatusBadge from './LaundryStatusBadge';
import LaundryRowActions from './LaundryRowActions';
import { formatIndianCurrency, formatIndianNumber } from '../../../utils/formatters';

/**
 * LaundryTable Component
 * Responsive data table for desktop/tablet views.
 */
export const LaundryTable = ({
  laundries = [],
  onView,
  onApprove,
  onReject,
  onSuspend,
  onEditCommission,
}) => {
  return (
    <div className="glass-card rounded-2xl border border-white/8 overflow-hidden shadow-2xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/8 bg-white/[0.02] text-[11px] font-semibold text-textMuted uppercase tracking-wider">
              <th className="py-3.5 px-4 font-semibold">Laundry</th>
              <th className="py-3.5 px-4 font-semibold">Owner</th>
              <th className="py-3.5 px-4 font-semibold">City</th>
              <th className="py-3.5 px-4 font-semibold">Status</th>
              <th className="py-3.5 px-4 font-semibold text-center">Commission</th>
              <th className="py-3.5 px-4 font-semibold text-right">Orders</th>
              <th className="py-3.5 px-4 font-semibold text-right">Revenue</th>
              <th className="py-3.5 px-4 font-semibold">Created</th>
              <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-xs">
            {laundries.map((laundry, idx) => {
              const ownerName = laundry.owner?.name || 'Unassigned';
              const ownerEmail = laundry.owner?.email || laundry.owner?.phone || '—';
              const createdDate = laundry.createdAt
                ? new Date(laundry.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })
                : '—';

              return (
                <motion.tr
                  key={laundry._id || idx}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: idx * 0.03 }}
                  className="hover:bg-white/[0.03] transition-colors group"
                >
                  {/* Laundry Name & Logo */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      {laundry.logo ? (
                        <img
                          src={laundry.logo}
                          alt={laundry.name}
                          className="w-9 h-9 rounded-xl object-cover border border-white/10 flex-shrink-0"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 font-bold text-sm flex-shrink-0">
                          {laundry.name ? laundry.name.charAt(0).toUpperCase() : <Store className="w-4 h-4" />}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-semibold text-textPrimary group-hover:text-purple-300 transition-colors truncate">
                          {laundry.name}
                        </p>
                        {laundry.email && (
                          <p className="text-[11px] text-textMuted truncate">
                            {laundry.email}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Owner */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-textMuted flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium text-textSecondary truncate">{ownerName}</p>
                        <p className="text-[10px] text-textMuted truncate">{ownerEmail}</p>
                      </div>
                    </div>
                  </td>

                  {/* City */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5 text-textSecondary">
                      <MapPin className="w-3.5 h-3.5 text-textMuted flex-shrink-0" />
                      <span className="truncate">{laundry.city || '—'}</span>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-4">
                    <LaundryStatusBadge status={laundry.status} />
                  </td>

                  {/* Commission Rate */}
                  <td className="py-3.5 px-4 text-center font-mono font-semibold text-purple-300">
                    {laundry.commissionPercent !== undefined ? `${laundry.commissionPercent}%` : '10%'}
                  </td>

                  {/* Orders Count */}
                  <td className="py-3.5 px-4 text-right font-medium text-textSecondary tabular-nums">
                    {formatIndianNumber(laundry.totalOrders || 0)}
                  </td>

                  {/* Total Revenue */}
                  <td className="py-3.5 px-4 text-right font-bold text-textPrimary tabular-nums">
                    {formatIndianCurrency(laundry.totalRevenue || 0)}
                  </td>

                  {/* Created Date */}
                  <td className="py-3.5 px-4 text-textMuted text-[11px] whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-textMuted" />
                      <span>{createdDate}</span>
                    </div>
                  </td>

                  {/* Actions Dropdown */}
                  <td className="py-3.5 px-4 text-right">
                    <LaundryRowActions
                      laundry={laundry}
                      onView={onView}
                      onApprove={onApprove}
                      onReject={onReject}
                      onSuspend={onSuspend}
                      onEditCommission={onEditCommission}
                    />
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LaundryTable;
