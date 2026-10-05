/**
 * Order Status Badge Component.
 * Uses REAL backend order status enum:
 * pending | picked_up | in_progress | ready | out_for_delivery | delivered | cancelled
 */

const STATUS_CONFIG = {
  pending: {
    label: 'Pending',
    color: 'bg-amber-500/12 text-amber-400 border-amber-500/25',
    dot: 'bg-amber-400 animate-pulse',
  },
  picked_up: {
    label: 'Picked Up',
    color: 'bg-blue-500/12 text-blue-400 border-blue-500/25',
    dot: 'bg-blue-400 animate-pulse',
  },
  in_progress: {
    label: 'In Progress',
    color: 'bg-indigo-500/12 text-indigo-400 border-indigo-500/25',
    dot: 'bg-indigo-400 animate-pulse',
  },
  ready: {
    label: 'Ready',
    color: 'bg-purple-500/12 text-purple-400 border-purple-500/25',
    dot: 'bg-purple-400 animate-pulse',
  },
  out_for_delivery: {
    label: 'Out for Delivery',
    color: 'bg-orange-500/12 text-orange-400 border-orange-500/25',
    dot: 'bg-orange-400 animate-pulse',
  },
  delivered: {
    label: 'Delivered',
    color: 'bg-emerald-500/12 text-emerald-400 border-emerald-500/25',
    dot: 'bg-emerald-400',
  },
  cancelled: {
    label: 'Cancelled',
    color: 'bg-rose-500/12 text-rose-400 border-rose-500/25',
    dot: 'bg-rose-400',
  },
  // Payment statuses
  success: {
    label: 'Paid',
    color: 'bg-emerald-500/12 text-emerald-400 border-emerald-500/25',
    dot: 'bg-emerald-400',
  },
  failed: {
    label: 'Failed',
    color: 'bg-rose-500/12 text-rose-400 border-rose-500/25',
    dot: 'bg-rose-400',
  },
  refunded: {
    label: 'Refunded',
    color: 'bg-blue-500/12 text-blue-400 border-blue-500/25',
    dot: 'bg-blue-400',
  },
};

export const OrderStatusBadge = ({ status = 'pending', className = '' }) => {
  const normalized = String(status).toLowerCase().trim();
  const config = STATUS_CONFIG[normalized] || {
    label: status || 'Unknown',
    color: 'bg-white/5 text-textMuted border-white/10',
    dot: 'bg-gray-400',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border backdrop-blur-md whitespace-nowrap ${config.color} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} aria-hidden="true" />
      <span>{config.label}</span>
    </span>
  );
};

export default OrderStatusBadge;
