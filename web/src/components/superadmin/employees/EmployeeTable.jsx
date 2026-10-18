import { motion } from 'framer-motion';
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

const AvatarCell = ({ name }) => (
  <div className="flex items-center gap-2.5 min-w-0">
    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500/30 to-orange-600/30 border border-white/10 flex items-center justify-center text-xs font-bold text-amber-300 flex-shrink-0">
      {getInitials(name)}
    </div>
    <span className="text-xs font-semibold text-textPrimary truncate">{name || '—'}</span>
  </div>
);

/**
 * EmployeeTable — Desktop table layout.
 */
export const EmployeeTable = ({ employees, onView, onEdit, onToggleStatus, onApprove, onReject }) => {
  return (
    <div className="overflow-x-auto rounded-xl">
      <table className="w-full min-w-[900px] border-collapse">
        <thead>
          <tr className="border-b border-white/8">
            {['Employee', 'Email', 'Phone', 'Role', 'Assigned Store', 'Vehicle', 'Status & Scope', 'Joined', ''].map((h) => (
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
          {employees.map((emp, i) => {
            const laundryName = emp.laundryId?.name || (emp.role === 'superadmin' ? 'Platform Wide' : '—');
            const joinedDate = formatDate(emp.createdAt);
            const vehicleInfo = emp.vehicleType
              ? `${emp.vehicleType.charAt(0).toUpperCase() + emp.vehicleType.slice(1)}${emp.vehicleNumber ? ` (${emp.vehicleNumber})` : ''}`
              : emp.role === 'delivery' ? 'Standard' : '—';

            return (
              <motion.tr
                key={emp._id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.025 }}
                className="border-b border-white/4 hover:bg-white/3 transition-colors group"
              >
                {/* Employee */}
                <td className="px-4 py-3.5">
                  <AvatarCell name={emp.name} />
                </td>

                {/* Email */}
                <td className="px-4 py-3.5">
                  <span className="text-xs text-textSecondary font-mono truncate max-w-[180px] block">
                    {emp.email || '—'}
                  </span>
                </td>

                {/* Phone */}
                <td className="px-4 py-3.5">
                  <span className="text-xs text-textSecondary font-mono">{emp.phone || '—'}</span>
                </td>

                {/* Role */}
                <td className="px-4 py-3.5">
                  <UserRoleBadge role={emp.role} />
                </td>

                {/* Laundry */}
                <td className="px-4 py-3.5">
                  <span className="text-xs text-textSecondary truncate max-w-[140px] block" title={laundryName}>
                    {laundryName}
                  </span>
                </td>

                {/* Vehicle */}
                <td className="px-4 py-3.5">
                  <span className="text-xs text-textSecondary truncate max-w-[130px] block">
                    {vehicleInfo}
                  </span>
                </td>

                {/* Status & Scope */}
                <td className="px-4 py-3.5">
                  <div className="flex flex-col gap-1 items-start">
                    <UserStatusBadge isActive={emp.isActive} />
                    {emp.role === 'delivery' && (
                      emp.createdSource === 'legacy' || !emp.createdSource ? (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                          Legacy Open
                        </span>
                      ) : emp.approvalStatus === 'pending' ? (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/20 animate-pulse">
                          Pending Approval
                        </span>
                      ) : emp.approvalStatus === 'rejected' ? (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-rose-500/10 text-rose-600 border border-rose-500/20">
                          Rejected
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-blue-500/10 text-blue-600 border border-blue-500/20">
                          {emp.accessMode === 'all_laundries' ? 'Global Scope' : emp.accessMode === 'multi_laundry' ? 'Multi Store' : 'Store Assigned'}
                        </span>
                      )
                    )}
                  </div>
                </td>

                {/* Joined */}
                <td className="px-4 py-3.5">
                  <span className="text-xs text-textMuted">{joinedDate}</span>
                </td>

                {/* Actions */}
                <td className="px-4 py-3.5">
                  <EmployeeRowActions
                    employee={emp}
                    onView={onView}
                    onEdit={onEdit}
                    onToggleStatus={onToggleStatus}
                    onApprove={onApprove}
                    onReject={onReject}
                  />
                </td>
              </motion.tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default EmployeeTable;
