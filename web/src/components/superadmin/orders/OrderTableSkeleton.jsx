/**
 * OrderTableSkeleton — Loading skeleton for the orders table/cards.
 */
export const OrderTableSkeleton = ({ rows = 8 }) => {
  return (
    <div className="space-y-1">
      {/* Table header skeleton */}
      <div className="hidden md:grid grid-cols-[1.5fr_1.5fr_1.5fr_1fr_1fr_1fr_1.2fr_80px] gap-4 px-4 py-3 border-b border-white/6">
        {['Order ID', 'Customer', 'Laundry', 'Amount', 'Method', 'Status', 'Date', ''].map((h) => (
          <div key={h} className="h-3 w-16 bg-white/5 rounded-full animate-pulse" />
        ))}
      </div>

      {/* Row skeletons */}
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="hidden md:grid grid-cols-[1.5fr_1.5fr_1.5fr_1fr_1fr_1fr_1.2fr_80px] gap-4 px-4 py-4 border-b border-white/4 animate-pulse"
          style={{ animationDelay: `${i * 0.04}s` }}
        >
          <div className="h-4 w-28 bg-white/6 rounded-full" />
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-white/5 rounded-full flex-shrink-0" />
            <div className="h-3.5 w-24 bg-white/5 rounded-full" />
          </div>
          <div className="h-4 w-24 bg-white/5 rounded-full" />
          <div className="h-4 w-16 bg-white/6 rounded-full" />
          <div className="h-5 w-16 bg-white/5 rounded-full" />
          <div className="h-5 w-20 bg-white/5 rounded-full" />
          <div className="h-3.5 w-24 bg-white/5 rounded-full" />
          <div className="h-7 w-7 bg-white/5 rounded-lg" />
        </div>
      ))}

      {/* Mobile card skeletons */}
      <div className="md:hidden space-y-3 p-1">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="glass-card rounded-2xl border border-white/8 p-4 animate-pulse space-y-3"
            style={{ animationDelay: `${i * 0.05}s` }}
          >
            <div className="flex justify-between">
              <div className="h-4 w-32 bg-white/6 rounded-full" />
              <div className="h-5 w-20 bg-white/5 rounded-full" />
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white/5 rounded-full" />
              <div className="h-3.5 w-28 bg-white/5 rounded-full" />
            </div>
            <div className="h-3 w-full bg-white/4 rounded-full" />
            <div className="flex justify-between">
              <div className="h-4 w-20 bg-white/6 rounded-full" />
              <div className="h-3 w-24 bg-white/4 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrderTableSkeleton;
