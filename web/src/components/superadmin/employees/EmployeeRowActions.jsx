import { Eye, Edit3, UserCheck, UserX } from 'lucide-react';

/**
 * EmployeeRowActions — Actions per employee row.
 */
export const EmployeeRowActions = ({ employee, onView, onEdit, onToggleStatus }) => {
  const isActive = Boolean(employee?.isActive);

  return (
    <div className="flex items-center gap-1.5">
      <button
        id={`employee-view-btn-${employee._id}`}
        onClick={() => onView(employee)}
        title="View details"
        className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-amber-500/15 text-textMuted hover:text-amber-400 border border-white/8 hover:border-amber-500/30 transition-all duration-150"
      >
        <Eye className="w-4 h-4" />
      </button>

      {onEdit && (
        <button
          id={`employee-edit-btn-${employee._id}`}
          onClick={() => onEdit(employee)}
          title="Edit details"
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-indigo-500/15 text-textMuted hover:text-indigo-400 border border-white/8 hover:border-indigo-500/30 transition-all duration-150"
        >
          <Edit3 className="w-3.5 h-3.5" />
        </button>
      )}

      <button
        id={`employee-toggle-btn-${employee._id}`}
        onClick={() => onToggleStatus(employee)}
        title={isActive ? 'Deactivate employee' : 'Activate employee'}
        className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-all duration-150 ${
          isActive
            ? 'bg-white/5 hover:bg-rose-500/15 text-textMuted hover:text-rose-400 border-white/8 hover:border-rose-500/30'
            : 'bg-white/5 hover:bg-emerald-500/15 text-textMuted hover:text-emerald-400 border-white/8 hover:border-emerald-500/30'
        }`}
      >
        {isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
      </button>
    </div>
  );
};

export default EmployeeRowActions;
