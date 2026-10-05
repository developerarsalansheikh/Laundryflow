/**
 * UserStatusBadge Component.
 * Visual status indicator for user active state.
 */
export const UserStatusBadge = ({ isActive = true, className = '' }) => {
  const active = Boolean(isActive);

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border backdrop-blur-md whitespace-nowrap ${
        active
          ? 'bg-emerald-500/12 text-emerald-400 border-emerald-500/25'
          : 'bg-rose-500/12 text-rose-400 border-rose-500/25'
      } ${className}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-emerald-400' : 'bg-rose-400'}`}
        aria-hidden="true"
      />
      <span>{active ? 'Active' : 'Inactive'}</span>
    </span>
  );
};

export default UserStatusBadge;
