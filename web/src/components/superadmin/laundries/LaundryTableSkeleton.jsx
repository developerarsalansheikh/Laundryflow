/**
 * LaundryTableSkeleton Component
 * Skeleton loader for data table.
 */
export const LaundryTableSkeleton = ({ rows = 5 }) => {
  return (
    <div className="glass-card rounded-2xl border border-white/8 overflow-hidden animate-pulse">
      <div className="hidden md:block">
        <div className="px-6 py-4 bg-white/5 border-b border-white/8 grid grid-cols-12 gap-4">
          <div className="col-span-3 h-4 bg-white/10 rounded" />
          <div className="col-span-2 h-4 bg-white/10 rounded" />
          <div className="col-span-2 h-4 bg-white/10 rounded" />
          <div className="col-span-1 h-4 bg-white/10 rounded" />
          <div className="col-span-1 h-4 bg-white/10 rounded" />
          <div className="col-span-2 h-4 bg-white/10 rounded" />
          <div className="col-span-1 h-4 bg-white/10 rounded" />
        </div>
        <div className="divide-y divide-white/5">
          {Array.from({ length: rows }).map((_, idx) => (
            <div key={idx} className="px-6 py-4 grid grid-cols-12 gap-4 items-center">
              <div className="col-span-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/10" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-3.5 bg-white/10 rounded w-3/4" />
                  <div className="h-2.5 bg-white/5 rounded w-1/2" />
                </div>
              </div>
              <div className="col-span-2 space-y-1">
                <div className="h-3 bg-white/10 rounded w-2/3" />
                <div className="h-2 bg-white/5 rounded w-1/2" />
              </div>
              <div className="col-span-2 h-3.5 bg-white/10 rounded w-2/3" />
              <div className="col-span-1 h-5 bg-white/10 rounded-full w-16" />
              <div className="col-span-1 h-3.5 bg-white/10 rounded w-10" />
              <div className="col-span-2 h-3.5 bg-white/10 rounded w-20" />
              <div className="col-span-1 h-6 bg-white/10 rounded-lg w-6 ml-auto" />
            </div>
          ))}
        </div>
      </div>

      {/* Mobile skeleton */}
      <div className="md:hidden p-4 space-y-3">
        {Array.from({ length: 3 }).map((_, idx) => (
          <div key={idx} className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10" />
              <div className="space-y-1.5 flex-1">
                <div className="h-4 bg-white/10 rounded w-1/2" />
                <div className="h-3 bg-white/5 rounded w-1/3" />
              </div>
            </div>
            <div className="h-12 bg-white/5 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default LaundryTableSkeleton;
