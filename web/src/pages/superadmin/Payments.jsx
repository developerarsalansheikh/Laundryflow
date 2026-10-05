import { useState, useCallback, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, AlertTriangle } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import { usePayments } from '../../hooks/usePayments';
import { PaymentHeader } from '../../components/superadmin/payments/PaymentHeader';
import { PaymentSummary } from '../../components/superadmin/payments/PaymentSummary';
import { PaymentFilters } from '../../components/superadmin/payments/PaymentFilters';
import { PaymentTable } from '../../components/superadmin/payments/PaymentTable';
import { PaymentCard } from '../../components/superadmin/payments/PaymentCard';
import { PaymentTableSkeleton } from '../../components/superadmin/payments/PaymentTableSkeleton';
import { PaymentEmptyState } from '../../components/superadmin/payments/PaymentEmptyState';
import { PaymentPagination } from '../../components/superadmin/payments/PaymentPagination';
import { PaymentDetailsDrawer } from '../../components/superadmin/payments/PaymentDetailsDrawer';

const DEFAULT_FILTERS = { search: '', status: '', method: '' };
const LIMIT = 20;

const pageVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

/**
 * SuperAdmin Payments Page — /superadmin/payments
 *
 * Real platform-wide payment financial operations console.
 * Data source: GET /api/super-admin/payments
 */
export const Payments = () => {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const [debouncedFilters, setDebouncedFilters] = useState(DEFAULT_FILTERS);
  const debounceTimer = useRef(null);

  // Debounce search input (380ms)
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedFilters(filters);
      setPage(1);
    }, 380);
    return () => clearTimeout(debounceTimer.current);
  }, [filters]);

  const queryParams = {
    page,
    limit: LIMIT,
    ...(debouncedFilters.status && { status: debouncedFilters.status }),
    ...(debouncedFilters.method && { method: debouncedFilters.method }),
    ...(debouncedFilters.search && { search: debouncedFilters.search }),
  };

  const { data: paymentsData, isLoading, isError, error, isFetching, refetch } = usePayments(queryParams);

  const payments = paymentsData?.data || [];
  const total = paymentsData?.total || 0;
  const totalPages = paymentsData?.pages || 1;

  const hasActiveFilters =
    filters.search !== '' || filters.status !== '' || filters.method !== '';

  const handleFiltersChange = useCallback((newFilters) => {
    setFilters(newFilters);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setPage(1);
  }, []);

  const handlePageChange = useCallback((newPage) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleView = useCallback((payment) => {
    setSelectedPayment(payment);
    setIsDrawerOpen(true);
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setIsDrawerOpen(false);
    setTimeout(() => setSelectedPayment(null), 300);
  }, []);

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['superadmin', 'payments'] });
    toast.success('Payment transactions refreshed.');
  };

  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      className="space-y-5"
    >
      {/* Header */}
      <div className="glass-card rounded-2xl border border-white/8 p-5 sm:p-6">
        <PaymentHeader />
      </div>

      {/* Financial Summary Stats */}
      <PaymentSummary paymentsData={paymentsData} isLoading={isLoading} />

      {/* Filters */}
      <PaymentFilters
        filters={filters}
        onChange={handleFiltersChange}
        onClear={handleClearFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Table / Cards */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="glass-card rounded-2xl border border-white/8 overflow-hidden"
      >
        {/* Table toolbar */}
        <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3.5 border-b border-white/6">
          <div>
            <span className="text-xs font-semibold text-textPrimary">
              {isLoading ? (
                <span className="inline-block w-24 h-3 bg-white/8 rounded-full animate-pulse" />
              ) : (
                <>
                  {payments.length > 0 ? (
                    <>
                      <span className="text-emerald-400">{total}</span> transaction{total !== 1 ? 's' : ''}
                    </>
                  ) : (
                    'No transactions'
                  )}
                </>
              )}
            </span>
            {isFetching && !isLoading && (
              <span className="ml-2 text-[10px] text-emerald-400 animate-pulse">Updating…</span>
            )}
          </div>
          <button
            id="pay-refresh-btn"
            onClick={handleRefresh}
            disabled={isFetching}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 border border-white/8 text-textMuted hover:text-textPrimary transition-all disabled:opacity-50"
            title="Refresh transactions"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Error state */}
        {isError && (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-textPrimary">Unable to load payment data</p>
              <p className="text-xs text-textMuted mt-1">
                {error?.response?.status === 403
                  ? 'Access denied by backend. SuperAdmin session required.'
                  : 'A server error occurred. Please try again.'}
              </p>
            </div>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl hover:bg-emerald-500/20 transition-all"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading skeleton */}
        {isLoading && !isError && <PaymentTableSkeleton rows={LIMIT} />}

        {/* Empty state */}
        {!isLoading && !isError && payments.length === 0 && (
          <PaymentEmptyState hasActiveFilters={hasActiveFilters} onClear={handleClearFilters} />
        )}

        {/* Desktop table */}
        {!isLoading && !isError && payments.length > 0 && (
          <>
            <div className="hidden md:block overflow-x-auto">
              <PaymentTable payments={payments} onView={handleView} />
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-3 p-3 sm:p-4">
              {payments.map((p, i) => (
                <PaymentCard key={p._id} payment={p} onView={handleView} index={i} />
              ))}
            </div>

            {/* Pagination */}
            <PaymentPagination
              page={page}
              totalPages={totalPages}
              total={total}
              limit={LIMIT}
              onPageChange={handlePageChange}
            />
          </>
        )}
      </motion.div>

      {/* Details Drawer */}
      <PaymentDetailsDrawer
        payment={selectedPayment}
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
      />
    </motion.div>
  );
};

export default Payments;
