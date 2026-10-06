import { ChevronRight, CheckCircle2, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../routes/routeConstants';

export const PendingStoreApprovals = ({ recentLaundries = [], pendingCount = 0 }) => {
  const navigate = useNavigate();

  const pendingStores = recentLaundries.filter((l) => l.status === 'pending');

  return (
    <div className="glass-card p-5 rounded-2xl border border-white/8 flex flex-col h-full">
      <div className="flex items-center justify-between pb-3 border-b border-white/8 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-textPrimary uppercase tracking-wider">Pending Approvals</h2>
            <p className="text-[10px] text-textMuted">Store registration queue</p>
          </div>
        </div>
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/25">
          {pendingCount} Pending
        </span>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto max-h-[220px]">
        {pendingStores.length > 0 ? (
          pendingStores.slice(0, 4).map((laundry) => (
            <div
              key={laundry._id}
              onClick={() => navigate(ROUTES.SUPERADMIN.LAUNDRIES)}
              className="p-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/6 transition-all cursor-pointer flex items-center justify-between gap-2"
            >
              <div className="min-w-0">
                <p className="text-xs font-semibold text-textPrimary truncate">{laundry.name}</p>
                <p className="text-[10px] text-textMuted truncate">{laundry.city || 'City unspecified'}</p>
              </div>
              <span className="text-[10px] font-medium text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 whitespace-nowrap">
                Review
              </span>
            </div>
          ))
        ) : (
          <div className="py-8 text-center flex flex-col items-center justify-center space-y-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold text-textPrimary">All Caught Up</p>
            <p className="text-[11px] text-textMuted max-w-[170px] leading-relaxed">
              No store applications pending approval right now.
            </p>
          </div>
        )}
      </div>

      <button
        onClick={() => navigate(ROUTES.SUPERADMIN.LAUNDRIES)}
        className="mt-3 w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/8 text-[11px] font-semibold text-textSecondary hover:text-textPrimary flex items-center justify-center gap-1 transition-all"
      >
        <span>Manage Applications</span>
        <ChevronRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

export default PendingStoreApprovals;
