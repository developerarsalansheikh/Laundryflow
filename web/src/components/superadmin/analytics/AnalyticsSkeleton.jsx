/**
 * AnalyticsSkeleton — Loading skeleton for Analytics dashboard.
 */
export const AnalyticsSkeleton = () => {
  return (
    <div className="space-y-5 animate-pulse">
      {/* Metric Cards Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass-card rounded-2xl p-4 border border-white/8">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex-shrink-0" />
              <div className="flex-1 space-y-2 pt-1">
                <div className="h-2.5 w-20 bg-white/5 rounded-full" />
                <div className="h-5 w-16 bg-white/8 rounded-md" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Large Chart Skeleton */}
      <div className="glass-card rounded-2xl p-5 border border-white/8 space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-white/5" />
          <div className="space-y-1">
            <div className="h-3 w-36 bg-white/8 rounded-full" />
            <div className="h-2 w-24 bg-white/5 rounded-full" />
          </div>
        </div>
        <div className="h-64 bg-white/[0.02] rounded-xl flex items-center justify-center">
          <div className="w-10 h-10 rounded-full border-2 border-purple-500/20 border-t-purple-400 animate-spin" />
        </div>
      </div>

      {/* Grid Charts Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="glass-card rounded-2xl p-5 border border-white/8 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white/5" />
              <div className="space-y-1">
                <div className="h-3 w-32 bg-white/8 rounded-full" />
                <div className="h-2 w-20 bg-white/5 rounded-full" />
              </div>
            </div>
            <div className="h-64 bg-white/[0.02] rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default AnalyticsSkeleton;
