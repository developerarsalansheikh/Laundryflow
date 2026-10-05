import { motion } from 'framer-motion';
import { Store, User, MapPin, Calendar, Percent } from 'lucide-react';
import LaundryStatusBadge from './LaundryStatusBadge';
import LaundryRowActions from './LaundryRowActions';
import { formatIndianCurrency, formatIndianNumber } from '../../../utils/formatters';

/**
 * LaundryCard Component
 * Card layout for small/mobile viewports.
 */
export const LaundryCard = ({
  laundry,
  onView,
  onApprove,
  onReject,
  onSuspend,
  onEditCommission,
}) => {
  const ownerName = laundry.owner?.name || 'Unassigned';
  const createdDate = laundry.createdAt
    ? new Date(laundry.createdAt).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '—';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-4 rounded-2xl border border-white/8 space-y-3 relative shadow-lg"
    >
      {/* Top Header: Logo, Name, Status, Actions */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {laundry.logo ? (
            <img
              src={laundry.logo}
              alt={laundry.name}
              className="w-10 h-10 rounded-xl object-cover border border-white/10 flex-shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 font-bold text-base flex-shrink-0">
              {laundry.name ? laundry.name.charAt(0).toUpperCase() : <Store className="w-5 h-5" />}
            </div>
          )}
          <div className="min-w-0">
            <h3 className="font-bold text-sm text-textPrimary truncate">{laundry.name}</h3>
            <p className="text-[11px] text-textMuted flex items-center gap-1 truncate">
              <MapPin className="w-3 h-3 text-textMuted flex-shrink-0" />
              <span>{laundry.city || 'No City'}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <LaundryStatusBadge status={laundry.status} />
          <LaundryRowActions
            laundry={laundry}
            onView={onView}
            onApprove={onApprove}
            onReject={onReject}
            onSuspend={onSuspend}
            onEditCommission={onEditCommission}
          />
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-white/[0.02] border border-white/5 text-xs">
        <div>
          <span className="text-[10px] text-textMuted uppercase font-semibold block">Owner</span>
          <span className="font-medium text-textSecondary truncate block flex items-center gap-1 mt-0.5">
            <User className="w-3 h-3 text-textMuted" />
            {ownerName}
          </span>
        </div>

        <div>
          <span className="text-[10px] text-textMuted uppercase font-semibold block">Commission</span>
          <span className="font-mono font-bold text-purple-300 flex items-center gap-1 mt-0.5">
            <Percent className="w-3 h-3 text-purple-400" />
            {laundry.commissionPercent !== undefined ? `${laundry.commissionPercent}%` : '10%'}
          </span>
        </div>

        <div>
          <span className="text-[10px] text-textMuted uppercase font-semibold block">Orders</span>
          <span className="font-medium text-textPrimary mt-0.5 block">
            {formatIndianNumber(laundry.totalOrders || 0)}
          </span>
        </div>

        <div>
          <span className="text-[10px] text-textMuted uppercase font-semibold block">Revenue</span>
          <span className="font-bold text-textPrimary mt-0.5 block">
            {formatIndianCurrency(laundry.totalRevenue || 0)}
          </span>
        </div>
      </div>

      {/* Footer info */}
      <div className="flex items-center justify-between text-[10px] text-textMuted pt-1">
        <span className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          Created: {createdDate}
        </span>
        <button
          onClick={() => onView(laundry)}
          className="text-purple-400 hover:text-purple-300 font-semibold cursor-pointer"
        >
          View Full Details →
        </button>
      </div>
    </motion.div>
  );
};

export default LaundryCard;
