import { Briefcase } from 'lucide-react';

/**
 * EmployeeHeader Component
 */
export const EmployeeHeader = () => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/8 pb-5">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-[0_0_20px_rgba(245,158,11,0.25)]">
          <Briefcase className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-textPrimary tracking-tight">Employees</h1>
          <p className="text-xs sm:text-sm text-textSecondary mt-0.5 max-w-xl">
            Manage employees and delivery workforce across the LaundryFlow platform.
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmployeeHeader;
