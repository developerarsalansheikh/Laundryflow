/**
 * SubscriptionStatusBadge — Real backend subscription statuses.
 * trial | active | past_due | cancelled | expired
 */

const STATUS_CONFIG = {
  trial: {
    label: 'Trial',
    class: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  },
  active: {
    label: 'Active',
    class: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  },
  past_due: {
    label: 'Past Due',
    class: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  },
  cancelled: {
    label: 'Cancelled',
    class: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
  },
  expired: {
    label: 'Expired',
    class: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
  },
};

export const SubscriptionStatusBadge = ({ status, size = 'sm' }) => {
  const cfg = STATUS_CONFIG[status] || {
    label: status || 'Unknown',
    class: 'bg-white/8 text-textMuted border-white/10',
  };

  const sizeClass = size === 'xs'
    ? 'text-[9px] px-1.5 py-0.5'
    : 'text-[10px] px-2 py-0.5';

  return (
    <span className={`inline-flex items-center rounded-full font-bold uppercase tracking-wider border ${sizeClass} ${cfg.class}`}>
      {cfg.label}
    </span>
  );
};

export default SubscriptionStatusBadge;
