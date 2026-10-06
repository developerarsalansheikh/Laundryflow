import { Store, Truck, ArrowUpRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../routes/routeConstants';

export const PlatformOperationsDistribution = ({ stats = {} }) => {
  const navigate = useNavigate();

  const totalLaundries = stats.totalLaundries || 0;
  const activeLaundries = stats.activeLaundries || 0;
  const pendingLaundries = stats.pendingLaundries || 0;
  const suspendedLaundries = Math.max(0, totalLaundries - activeLaundries - pendingLaundries);

  const activePercent = totalLaundries > 0 ? Math.round((activeLaundries / totalLaundries) * 100) : 0;

  return (
    <div className="glass-card p-5 rounded-2xl border border-white/8 flex flex-col h-full">
      <div className="flex items-center justify-between pb-3 border-b border-white/8 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Store className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-textPrimary uppercase tracking-wider">Store Network Health</h2>
            <p className="text-[10px] text-textMuted">Operational status metrics</p>
          </div>
        </div>
        <span className="text-xs font-bold text-emerald-400">
          {activePercent}% Active
        </span>
      </div>

      <div className="space-y-3 flex-1 flex flex-col justify-center">
        {/* Progress bar */}
        <div>
          <div className="flex justify-between text-[11px] text-textMuted mb-1 font-medium">
            <span>Store Availability</span>
            <span>{activeLaundries} of {totalLaundries} stores</span>
          </div>
          <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden flex">
            <div
              style={{ width: `${activePercent}%` }}
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
            />
            {pendingLaundries > 0 && (
              <div
                style={{ width: `${Math.round((pendingLaundries / (totalLaundries || 1)) * 100)}%` }}
                className="bg-amber-500 h-full transition-all duration-500"
              />
            )}
          </div>
        </div>

        {/* Breakdown pills */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          <div className="p-2 rounded-xl bg-emerald-500/5 border border-emerald-500/15 text-center">
            <p className="text-[10px] text-emerald-400/80 font-medium">Active</p>
            <p className="text-sm font-bold text-emerald-400 mt-0.5">{activeLaundries}</p>
          </div>
          <div className="p-2 rounded-xl bg-amber-500/5 border border-amber-500/15 text-center">
            <p className="text-[10px] text-amber-400/80 font-medium">Pending</p>
            <p className="text-sm font-bold text-amber-400 mt-0.5">{pendingLaundries}</p>
          </div>
          <div className="p-2 rounded-xl bg-slate-500/5 border border-slate-500/15 text-center">
            <p className="text-[10px] text-slate-400/80 font-medium">Suspended</p>
            <p className="text-sm font-bold text-slate-300 mt-0.5">{suspendedLaundries}</p>
          </div>
        </div>

        {/* Quick link */}
        <button
          onClick={() => navigate(ROUTES.SUPERADMIN.EMPLOYEES)}
          className="mt-2 w-full py-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/25 text-[11px] font-semibold text-indigo-300 flex items-center justify-center gap-1.5 transition-all"
        >
          <Truck className="w-3.5 h-3.5" />
          <span>Workforce & Delivery Agents</span>
          <ArrowUpRight className="w-3 h-3 ml-0.5" />
        </button>
      </div>
    </div>
  );
};

export default PlatformOperationsDistribution;
