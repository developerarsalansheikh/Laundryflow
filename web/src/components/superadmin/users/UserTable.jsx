import { motion } from 'framer-motion';
import { UserRoleBadge } from './UserRoleBadge';
import { UserStatusBadge } from './UserStatusBadge';
import { UserRowActions } from './UserRowActions';

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const getInitials = (name = '') =>
  name
    .trim()
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase() || '?';

const AvatarCell = ({ name, email }) => (
  <div className="flex items-center gap-2.5 min-w-0">
    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500/30 to-purple-600/30 border border-white/10 flex items-center justify-center text-xs font-bold text-indigo-300 flex-shrink-0">
      {getInitials(name)}
    </div>
    <div className="min-w-0">
      <p className="text-xs font-semibold text-textPrimary truncate">{name || '—'}</p>
      <p className="text-[10px] text-textMuted truncate md:hidden">{email}</p>
    </div>
  </div>
);

/**
 * UserTable — Desktop table layout.
 * Data source: GET /api/super-admin/users
 */
export const UserTable = ({ users, onView, onToggleStatus }) => {
  return (
    <div className="overflow-x-auto rounded-xl">
      <table className="w-full min-w-[850px] border-collapse">
        <thead>
          <tr className="border-b border-white/8">
            {['User', 'Email', 'Phone', 'Role', 'Laundry', 'Status', 'Joined', ''].map((h) => (
              <th
                key={h}
                className="px-4 py-3 text-left text-[10px] font-semibold text-textMuted uppercase tracking-wider whitespace-nowrap"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {users.map((user, i) => {
            const laundryName = user.laundryId?.name || '—';
            const joinedDate = formatDate(user.createdAt);

            return (
              <motion.tr
                key={user._id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.025 }}
                className="border-b border-white/4 hover:bg-white/3 transition-colors group"
              >
                {/* User */}
                <td className="px-4 py-3.5">
                  <AvatarCell name={user.name} email={user.email} />
                </td>

                {/* Email */}
                <td className="px-4 py-3.5">
                  <span className="text-xs text-textSecondary font-mono truncate max-w-[180px] block">
                    {user.email || '—'}
                  </span>
                </td>

                {/* Phone */}
                <td className="px-4 py-3.5">
                  <span className="text-xs text-textSecondary font-mono">{user.phone || '—'}</span>
                </td>

                {/* Role */}
                <td className="px-4 py-3.5">
                  <UserRoleBadge role={user.role} />
                </td>

                {/* Laundry */}
                <td className="px-4 py-3.5">
                  <span className="text-xs text-textSecondary truncate max-w-[120px] block">
                    {laundryName}
                  </span>
                </td>

                {/* Status */}
                <td className="px-4 py-3.5">
                  <UserStatusBadge isActive={user.isActive} />
                </td>

                {/* Joined */}
                <td className="px-4 py-3.5">
                  <span className="text-xs text-textMuted">{joinedDate}</span>
                </td>

                {/* Actions */}
                <td className="px-4 py-3.5">
                  <UserRowActions user={user} onView={onView} onToggleStatus={onToggleStatus} />
                </td>
              </motion.tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default UserTable;
