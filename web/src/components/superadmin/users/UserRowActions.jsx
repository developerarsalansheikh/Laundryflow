import { Eye, UserCheck, UserX } from 'lucide-react';

/**
 * UserRowActions — Actions per user row.
 * - View (details drawer)
 * - Activate / Deactivate (toggle modal)
 */
export const UserRowActions = ({ user, onView, onToggleStatus }) => {
  const isSuperAdmin = user?.role === 'superadmin';
  const isActive = Boolean(user?.isActive);

  return (
    <div className="flex items-center gap-1.5">
      {/* View Details */}
      <button
        id={`user-view-btn-${user._id}`}
        onClick={() => onView(user)}
        title="View user details"
        className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-indigo-500/15 text-textMuted hover:text-indigo-400 border border-white/8 hover:border-indigo-500/30 transition-all duration-150"
      >
        <Eye className="w-4 h-4" />
      </button>

      {/* Activate / Deactivate */}
      {!isSuperAdmin && (
        <button
          id={`user-toggle-btn-${user._id}`}
          onClick={() => onToggleStatus(user)}
          title={isActive ? 'Deactivate user' : 'Activate user'}
          className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-all duration-150 ${
            isActive
              ? 'bg-white/5 hover:bg-rose-500/15 text-textMuted hover:text-rose-400 border-white/8 hover:border-rose-500/30'
              : 'bg-white/5 hover:bg-emerald-500/15 text-textMuted hover:text-emerald-400 border-white/8 hover:border-emerald-500/30'
          }`}
        >
          {isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
        </button>
      )}
    </div>
  );
};

export default UserRowActions;
