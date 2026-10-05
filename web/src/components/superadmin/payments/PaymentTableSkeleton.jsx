/**
 * PaymentTableSkeleton — Loading skeleton for the Payments table.
 */
export const PaymentTableSkeleton = ({ rows = 8 }) => {
  return (
    <div className="animate-pulse">
      {/* Table header skeleton */}
      <div className="px-5 py-3 border-b border-white/6 flex gap-6">
        {[40, 20, 25, 25, 18, 15, 15, 18, 20, 10].map((w, i) => (
          <div key={i} className="h-2 bg-white/5 rounded-full" style={{ width: `${w}px` }} />
        ))}
      </div>

      {/* Table body skeleton rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="px-5 py-4 border-b border-white/4 flex items-center gap-6"
          style={{ opacity: 1 - i * 0.07 }}
        >
          <div className="flex items-center gap-2 flex-1">
            <div className="w-7 h-7 rounded-lg bg-white/5" />
            <div className="h-2.5 w-24 bg-white/7 rounded-full" />
          </div>
          <div className="h-2.5 w-14 bg-white/5 rounded-full" />
          <div className="h-2.5 w-20 bg-white/5 rounded-full" />
          <div className="h-2.5 w-20 bg-white/5 rounded-full" />
          <div className="h-2.5 w-16 bg-white/7 rounded-full" />
          <div className="h-4 w-14 bg-white/5 rounded-md" />
          <div className="h-4 w-16 bg-white/5 rounded-full" />
          <div className="h-2.5 w-14 bg-white/5 rounded-full" />
          <div className="h-2.5 w-20 bg-white/5 rounded-full" />
          <div className="h-6 w-8 bg-white/5 rounded-lg" />
        </div>
      ))}
    </div>
  );
};

export default PaymentTableSkeleton;
