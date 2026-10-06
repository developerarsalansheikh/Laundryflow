import { motion } from 'framer-motion';
import { Mail, Phone, Store } from 'lucide-react';
import { UserRoleBadge } from '../users/UserRoleBadge';
import { UserStatusBadge } from '../users/UserStatusBadge';
import { EmployeeRowActions } from './EmployeeRowActions';

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
 * EmployeeCard — Mobile card layout for employee records.
 */
export const EmployeeCard = ({ employee, onView, onEdit, onToggleStatus, index = 0 }) => {
  const laundryName = employee.laundryId?.name || null;
  const joinedDate = formatDate(employee.createdAt);
  const vehicleInfo = employee.vehicleType
    ? `${employee.vehicleType.toUpperCase()}${employee.vehicleNumber ? ` • ${employee.vehicleNumber}` : ''}`
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="glass-card rounded-2xl border border-white/8 p-4 shadow-lg space-y-3"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/30 to-orange-600/30 border border-white/10 flex items-center justify-center text-sm font-bold text-amber-300 flex-shrink-0">
            {getInitials(employee.name)}
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-textPrimary truncate">{employee.name || '—'}</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <UserRoleBadge role={employee.role} />
              <UserStatusBadge isActive={employee.isActive} />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-1.5 pt-1 text-xs text-textSecondary border-t border-white/6">
        {employee.email && (
          <div className="flex items-center gap-2">
            <Mail className="w-3.5 h-3.5 text-textMuted flex-shrink-0" />
            <span className="truncate font-mono">{employee.email}</span>
          </div>
        )}
        {employee.phone && (
          <div className="flex items-center gap-2">
            <Phone className="w-3.5 h-3.5 text-textMuted flex-shrink-0" />
            <span className="font-mono">{employee.phone}</span>
          </div>
        )}
        {laundryName && (
          <div className="flex items-center gap-2">
            <Store className="w-3.5 h-3.5 text-textMuted flex-shrink-0" />
            <span className="truncate">{laundryName}</span>
          </div>
        )}
        {vehicleInfo && (
          <div className="flex items-center gap-2 text-[11px] text-indigo-300/80">
            <span className="px-1.5 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 font-mono">
              {vehicleInfo}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/6">
        <span className="text-[10px] text-textMuted">Joined {joinedDate}</span>
        <EmployeeRowActions
          employee={employee}
          onView={onView}
          onEdit={onEdit}
          onToggleStatus={onToggleStatus}
        />
      </div>
    </motion.div>
  );
};

export default EmployeeCard;
