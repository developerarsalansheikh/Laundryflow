import { motion } from 'framer-motion';
import { Mail, Phone, Store } from 'lucide-react';
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

/**
 * UserCard — Mobile card layout for user records.
 */
export const UserCard = ({ user, onView, onToggleStatus, index = 0 }) => {
  const laundryName = user.laundryId?.name || null;
  const joinedDate = formatDate(user.createdAt);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="glass-card rounded-2xl border border-white/8 p-4 shadow-lg space-y-3"
    >
      {/* Top Header: Avatar, Name, Role, Status */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/30 to-purple-600/30 border border-white/10 flex items-center justify-center text-sm font-bold text-indigo-300 flex-shrink-0">
            {getInitials(user.name)}
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-textPrimary truncate">{user.name || '—'}</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <UserRoleBadge role={user.role} />
              <UserStatusBadge isActive={user.isActive} />
            </div>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="space-y-1.5 pt-1 text-xs text-textSecondary border-t border-white/6">
        {user.email && (
          <div className="flex items-center gap-2">
            <Mail className="w-3.5 h-3.5 text-textMuted flex-shrink-0" />
            <span className="truncate font-mono">{user.email}</span>
          </div>
        )}
        {user.phone && (
          <div className="flex items-center gap-2">
            <Phone className="w-3.5 h-3.5 text-textMuted flex-shrink-0" />
            <span className="font-mono">{user.phone}</span>
          </div>
        )}
        {laundryName && (
          <div className="flex items-center gap-2">
            <Store className="w-3.5 h-3.5 text-textMuted flex-shrink-0" />
            <span className="truncate">{laundryName}</span>
          </div>
        )}
      </div>

      {/* Bottom Footer: Joined date & Actions */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/6">
        <span className="text-[10px] text-textMuted">Joined {joinedDate}</span>
        <UserRowActions user={user} onView={onView} onToggleStatus={onToggleStatus} />
      </div>
    </motion.div>
  );
};

export default UserCard;
