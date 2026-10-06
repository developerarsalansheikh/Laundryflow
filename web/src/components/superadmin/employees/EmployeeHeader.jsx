import { Briefcase, Plus } from 'lucide-react';

/**
 * EmployeeHeader Component
 */
export const EmployeeHeader = ({ onCreateDeliveryPartner }) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/8 pb-5">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-[0_0_20px_rgba(245,158,11,0.25)]">
          <Briefcase className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-textPrimary tracking-tight">Workforce & Delivery</h1>
          <p className="text-xs sm:text-sm text-textSecondary mt-0.5 max-w-xl">
            Manage delivery agents and store personnel across the LaundryFlow platform.
          </p>
        </div>
      </div>

      {onCreateDeliveryPartner && (
        <button
          onClick={onCreateDeliveryPartner}
          className="btn-primary self-start sm:self-auto flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/35 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Create Delivery Agent</span>
        </button>
      )}
    </div>
  );
};

export default EmployeeHeader;
