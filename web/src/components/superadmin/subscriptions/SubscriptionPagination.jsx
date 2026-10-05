import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * SubscriptionPagination — Pagination controls for subscriptions list.
 */
export const SubscriptionPagination = ({ page, totalPages, total, limit, onPageChange }) => {
  if (!totalPages || totalPages <= 1) return null;

  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-white/8">
      <p className="text-xs text-textMuted">
        Showing <span className="font-semibold text-textSecondary">{from}–{to}</span> of{' '}
        <span className="font-semibold text-textSecondary">{total}</span> accounts
      </p>

      <div className="flex items-center gap-1">
        <button
          id="sub-prev-page"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 border border-white/8 text-textMuted hover:text-textPrimary transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
          let pageNum;
          if (totalPages <= 7) {
            pageNum = i + 1;
          } else if (page <= 4) {
            pageNum = i + 1;
          } else if (page >= totalPages - 3) {
            pageNum = totalPages - 6 + i;
          } else {
            pageNum = page - 3 + i;
          }

          return (
            <button
              key={pageNum}
              id={`sub-page-${pageNum}`}
              onClick={() => onPageChange(pageNum)}
              className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-semibold transition-all border ${
                page === pageNum
                  ? 'bg-purple-600 text-white border-purple-500/50 shadow-[0_0_12px_rgba(168,85,247,0.4)]'
                  : 'bg-white/5 hover:bg-white/10 border-white/8 text-textMuted hover:text-textPrimary'
              }`}
            >
              {pageNum}
            </button>
          );
        })}

        <button
          id="sub-next-page"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 border border-white/8 text-textMuted hover:text-textPrimary transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default SubscriptionPagination;
