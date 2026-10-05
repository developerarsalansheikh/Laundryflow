import { Star, Award, TrendingUp, Package } from 'lucide-react';
import { formatIndianCurrency } from '../../../utils/formatters';

/**
 * LaundryPerformance — Ranked list of top performing laundries based on actual backend data.
 */
export const LaundryPerformance = ({ topLaundries = [] }) => {
  return (
    <div className="glass-card rounded-2xl border border-white/8 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/20 flex items-center justify-center">
          <Award className="w-4 h-4 text-amber-400" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-textPrimary">Top Performing Laundries</h3>
          <p className="text-[11px] text-textMuted">Ranked by revenue generated & completed orders</p>
        </div>
      </div>

      {topLaundries.length === 0 ? (
        <div className="py-12 text-center text-xs text-textMuted">
          No top laundry rankings recorded yet.
        </div>
      ) : (
        <div className="space-y-2.5">
          {topLaundries.map((laundry, index) => {
            const rank = index + 1;
            const revenue = formatIndianCurrency(laundry.totalRevenue);
            const orders = laundry.totalOrders ?? '--';

            return (
              <div
                key={laundry._id || index}
                className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white/[0.025] hover:bg-white/[0.05] border border-white/6 transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center font-extrabold text-xs flex-shrink-0 ${
                      rank === 1
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                        : rank === 2
                        ? 'bg-slate-400/20 text-slate-300 border border-slate-400/40'
                        : rank === 3
                        ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
                        : 'bg-white/5 text-textMuted border border-white/8'
                    }`}
                  >
                    #{rank}
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs font-bold text-textPrimary truncate">{laundry.name}</p>
                    <p className="text-[10px] text-textMuted truncate">{laundry.city}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 flex-shrink-0">
                  <div className="text-right">
                    <div className="flex items-center justify-end gap-1 text-xs font-bold text-emerald-400 tabular-nums">
                      <TrendingUp className="w-3 h-3" />
                      <span>{revenue}</span>
                    </div>
                    <div className="flex items-center justify-end gap-1 text-[10px] text-textMuted tabular-nums">
                      <Package className="w-2.5 h-2.5" />
                      <span>{orders} orders</span>
                    </div>
                  </div>

                  {laundry.rating && (
                    <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs font-bold text-amber-400">
                      <Star className="w-3 h-3 fill-amber-400" />
                      <span>{laundry.rating}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LaundryPerformance;
