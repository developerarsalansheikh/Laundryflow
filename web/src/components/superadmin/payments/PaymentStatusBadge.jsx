/**
 * PaymentStatusBadge — Controlled status badge for payments.
 * Statuses: pending | success | failed | refunded
 */

const STATUS_CONFIG = {
  success: {
    label: 'Success',
    class: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  },
  pending: {
    label: 'Pending',
    class: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  },
  failed: {
    label: 'Failed',
    class: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
  },
  refunded: {
    label: 'Refunded',
    class: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  },
};

export const PaymentStatusBadge = ({ status, size = 'sm' }) => {
  const cfg = STATUS_CONFIG[status] || {
    label: status || 'Unknown',
    class: 'bg-white/8 text-textMuted border-white/10',
  };

  const sizeClass = size === 'xs'
    ? 'text-[9px] px-1.5 py-0.5'
    : 'text-[10px] px-2.5 py-0.5';

  return (
    <span className={`inline-flex items-center rounded-full font-bold uppercase tracking-wider border ${sizeClass} ${cfg.class}`}>
      {cfg.label}
    </span>
  );
};

export default PaymentStatusBadge;
