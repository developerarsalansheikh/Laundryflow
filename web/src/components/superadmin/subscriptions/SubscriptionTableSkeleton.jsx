/**
 * SubscriptionTableSkeleton — Loading skeleton for the Subscriptions table.
 */
export const SubscriptionTableSkeleton = ({ rows = 8 }) => {
  return (
    <div className="animate-pulse">
      {/* Table header skeleton */}
      <div className="px-5 py-3 border-b border-white/6 flex gap-6">
        {[45, 20, 15, 12, 12, 15, 10].map((w, i) => (
          <div key={i} className={`h-2 bg-white/5 rounded-full`} style={{ width: `${w}px` }} />
        ))}
      </div>

      {/* Table body skeleton rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="px-5 py-4 border-b border-white/4 flex items-center gap-6"
          style={{ opacity: 1 - i * 0.07 }}
        >
          {/* Laundry name + icon */}
          <div className="flex items-center gap-2.5 flex-1">
            <div className="w-8 h-8 rounded-xl bg-white/5" />
            <div className="space-y-1.5">
              <div className="h-2.5 w-28 bg-white/7 rounded-full" />
              <div className="h-2 w-20 bg-white/4 rounded-full" />
            </div>
          </div>
          {/* City */}
          <div className="h-2.5 w-16 bg-white/5 rounded-full" />
          {/* Status badge */}
          <div className="h-5 w-16 bg-white/5 rounded-full" />
          {/* Commission */}
          <div className="h-2.5 w-10 bg-white/5 rounded-full" />
          {/* Orders */}
          <div className="h-2.5 w-10 bg-white/5 rounded-full" />
          {/* Revenue */}
          <div className="h-2.5 w-20 bg-white/5 rounded-full" />
          {/* Actions */}
          <div className="h-6 w-20 bg-white/5 rounded-lg" />
        </div>
      ))}
    </div>
  );
};

export default SubscriptionTableSkeleton;
