/**
 * Animated skeleton loader for Super Admin Dashboard.
 * Matches the exact shapes and layout of all dashboard component sections:
 * - Header
 * - Stats grid (4 cards)
 * - Middle row: Revenue (7col) + Insights (2col) + Activity (3col)
 * - Lower row: Recent Orders (5col) + Top Laundries (4col) + Payments (3col)
 */
export const DashboardSkeleton = () => {
  return (
    <div className="space-y-6 animate-pulse pb-12">

      {/* ── Header Skeleton ──────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div className="space-y-2.5">
          <div className="h-5 w-48 bg-white/8 rounded-full" />
          <div className="h-9 w-72 bg-white/10 rounded-xl" />
          <div className="h-4 w-80 bg-white/6 rounded-lg" />
        </div>
        <div className="flex gap-2.5 items-center">
          <div className="h-9 w-32 bg-white/6 rounded-xl" />
          <div className="h-9 w-28 bg-white/10 rounded-xl" />
        </div>
      </div>

      {/* ── Stats Grid Skeleton (4 cards) ───────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="glass-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-10 w-10 bg-white/8 rounded-xl" />
                <div className="space-y-1">
                  <div className="h-3 w-24 bg-white/8 rounded" />
                  <div className="h-2.5 w-16 bg-white/5 rounded" />
                </div>
              </div>
              <div className="h-5 w-6 bg-white/5 rounded-full" />
            </div>
            <div className="flex items-end justify-between">
              <div className="space-y-1.5">
                <div className="h-8 w-24 bg-white/10 rounded-lg" />
                <div className="h-2.5 w-20 bg-white/5 rounded" />
              </div>
              <div className="w-24 h-9 bg-white/5 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* ── Middle Row Skeleton ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Revenue Overview — 7 cols */}
        <div className="lg:col-span-7 glass-card p-6 space-y-4">
          <div className="flex items-start justify-between border-b border-white/5 pb-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 bg-white/8 rounded-lg" />
                <div className="h-4 w-32 bg-white/8 rounded" />
              </div>
              <div className="flex gap-4 pl-9">
                <div className="h-7 w-24 bg-white/10 rounded-lg" />
                <div className="w-px h-10 bg-white/5" />
                <div className="h-7 w-20 bg-white/8 rounded-lg" />
              </div>
            </div>
            <div className="h-6 w-16 bg-white/5 rounded-full" />
          </div>
          <div className="h-52 w-full bg-white/[0.04] rounded-xl" />
        </div>

        {/* AI Insights — 2 cols */}
        <div className="lg:col-span-2 glass-card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 bg-white/8 rounded-lg" />
              <div className="h-3.5 w-20 bg-white/8 rounded" />
            </div>
            <div className="h-4 w-14 bg-white/5 rounded-full" />
          </div>
          <div className="space-y-2.5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 bg-white/[0.04] rounded-xl" />
            ))}
          </div>
        </div>

        {/* Live Activity — 3 cols */}
        <div className="lg:col-span-3 glass-card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 bg-white/8 rounded-lg" />
              <div className="h-3.5 w-20 bg-white/8 rounded" />
            </div>
            <div className="h-3 w-8 bg-white/5 rounded" />
          </div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="h-7 w-7 bg-white/8 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-white/8 rounded w-3/4" />
                  <div className="h-2.5 bg-white/5 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Lower Row Skeleton ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Orders — 5 cols */}
        <div className="lg:col-span-5 glass-card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 bg-white/8 rounded-lg" />
              <div className="h-3.5 w-28 bg-white/8 rounded" />
            </div>
            <div className="h-3 w-20 bg-white/5 rounded" />
          </div>
          <div className="divide-y divide-white/5">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between py-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 bg-white/8 rounded-full flex-shrink-0" />
                  <div className="space-y-1.5">
                    <div className="h-3 bg-white/8 rounded w-28" />
                    <div className="h-2.5 bg-white/5 rounded w-20" />
                  </div>
                </div>
                <div className="text-right space-y-1.5">
                  <div className="h-3 bg-white/8 rounded w-16 ml-auto" />
                  <div className="h-4 bg-white/5 rounded-full w-12 ml-auto" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Laundries — 4 cols */}
        <div className="lg:col-span-4 glass-card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 bg-white/8 rounded-lg" />
              <div className="h-3.5 w-24 bg-white/8 rounded" />
            </div>
            <div className="h-3 w-16 bg-white/5 rounded" />
          </div>
          <div className="space-y-2.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="p-2.5 bg-white/[0.03] rounded-xl space-y-2">
                <div className="grid grid-cols-12 gap-1 items-center">
                  <div className="col-span-1 h-5 w-5 bg-white/8 rounded-full" />
                  <div className="col-span-5 flex items-center gap-1.5">
                    <div className="h-6 w-6 bg-white/8 rounded-md flex-shrink-0" />
                    <div className="space-y-1">
                      <div className="h-2.5 bg-white/8 rounded w-20" />
                      <div className="h-2 bg-white/5 rounded w-14" />
                    </div>
                  </div>
                  <div className="col-span-3 space-y-1 text-right">
                    <div className="h-2.5 bg-white/8 rounded w-14 ml-auto" />
                    <div className="h-3 bg-white/5 rounded-full w-10 ml-auto" />
                  </div>
                  <div className="col-span-3 space-y-1 text-right">
                    <div className="h-2.5 bg-white/8 rounded w-10 ml-auto" />
                    <div className="h-2 bg-white/5 rounded w-8 ml-auto" />
                  </div>
                </div>
                <div className="pl-6 h-1 bg-white/8 rounded-full" />
              </div>
            ))}
          </div>
        </div>

        {/* Payments Overview — 3 cols */}
        <div className="lg:col-span-3 glass-card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 bg-white/8 rounded-lg" />
              <div className="h-3.5 w-20 bg-white/8 rounded" />
            </div>
            <div className="h-3 w-16 bg-white/5 rounded" />
          </div>
          {/* Donut placeholder */}
          <div className="flex justify-center">
            <div className="w-32 h-32 rounded-full bg-white/5" style={{ boxShadow: 'inset 0 0 0 20px rgba(255,255,255,0.04)' }} />
          </div>
          {/* Legend rows */}
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-white/8 rounded-full" />
                  <div className="h-2.5 bg-white/8 rounded w-24" />
                </div>
                <div className="h-2.5 bg-white/8 rounded w-12" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardSkeleton;
