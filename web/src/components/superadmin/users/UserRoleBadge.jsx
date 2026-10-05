/**
 * UserRoleBadge Component.
 * Maps backend roles to UI labels & LaundryFlow badge styles:
 * user → Customer
 * admin → Laundry Admin
 * delivery → Delivery Partner
 * superadmin → Super Admin
 */

const ROLE_CONFIG = {
  user: {
    label: 'Customer',
    color: 'bg-indigo-500/12 text-indigo-400 border-indigo-500/25',
    dot: 'bg-indigo-400',
  },
  admin: {
    label: 'Laundry Admin',
    color: 'bg-purple-500/12 text-purple-400 border-purple-500/25',
    dot: 'bg-purple-400',
  },
  delivery: {
    label: 'Delivery Partner',
    color: 'bg-amber-500/12 text-amber-400 border-amber-500/25',
    dot: 'bg-amber-400',
  },
  superadmin: {
    label: 'Super Admin',
    color: 'bg-emerald-500/12 text-emerald-400 border-emerald-500/25',
    dot: 'bg-emerald-400',
  },
};

export const UserRoleBadge = ({ role = 'user', className = '' }) => {
  const normalized = String(role).toLowerCase().trim();
  const config = ROLE_CONFIG[normalized] || {
    label: role || 'User',
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

export default UserRoleBadge;
