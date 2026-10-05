import { mapStatus } from '../../../utils/formatters';

const BADGE_CLASSES = {
  success: 'bg-emerald-500/12 text-emerald-400 border-emerald-500/25 shadow-[0_0_12px_rgba(16,185,129,0.15)]',
  warning: 'bg-amber-500/12 text-amber-400 border-amber-500/25 shadow-[0_0_12px_rgba(245,158,11,0.15)]',
  danger: 'bg-rose-500/12 text-rose-400 border-rose-500/25 shadow-[0_0_12px_rgba(244,63,94,0.15)]',
  info: 'bg-blue-500/12 text-blue-400 border-blue-500/25 shadow-[0_0_12px_rgba(59,130,246,0.15)]',
  neutral: 'bg-white/5 text-textMuted border-white/10',
};

const DOT_CLASSES = {
  success: 'bg-emerald-400 animate-pulse',
  warning: 'bg-amber-400 animate-pulse',
  danger: 'bg-rose-400',
  info: 'bg-blue-400 animate-pulse',
  neutral: 'bg-gray-400',
};

/**
 * Custom Status Badge for Laundries
 */
export const LaundryStatusBadge = ({ status = 'pending', className = '' }) => {
  const { label, variant } = mapStatus(status);
  const badgeStyle = BADGE_CLASSES[variant] || BADGE_CLASSES.neutral;
  const dotStyle = DOT_CLASSES[variant] || DOT_CLASSES.neutral;

  // Capitalize properly
  const displayLabel =
    status === 'pending'
      ? 'Pending'
      : status === 'active'
      ? 'Active'
      : status === 'suspended'
      ? 'Suspended'
      : status === 'rejected'
      ? 'Rejected'
      : label;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border backdrop-blur-md transition-all ${badgeStyle} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotStyle}`} aria-hidden="true" />
      <span className="capitalize">{displayLabel}</span>
    </span>
  );
};

export default LaundryStatusBadge;
