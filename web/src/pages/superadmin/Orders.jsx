import { useState, useCallback, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, AlertTriangle } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import { useOrders, useOrderStats } from '../../hooks/useOrders';
import { OrderHeader } from '../../components/superadmin/orders/OrderHeader';
import { OrderStats } from '../../components/superadmin/orders/OrderStats';
import { OrderFilters } from '../../components/superadmin/orders/OrderFilters';
import { OrderTable } from '../../components/superadmin/orders/OrderTable';
import { OrderCard } from '../../components/superadmin/orders/OrderCard';
import { OrderTableSkeleton } from '../../components/superadmin/orders/OrderTableSkeleton';
import { OrderEmptyState } from '../../components/superadmin/orders/OrderEmptyState';
import { OrderPagination } from '../../components/superadmin/orders/OrderPagination';
import { OrderDetailsDrawer } from '../../components/superadmin/orders/OrderDetailsDrawer';

const DEFAULT_FILTERS = {
  search: '',
  status: '',
  paymentStatus: '',
  laundryId: '',
  today: '',
  startDate: '',
  endDate: '',
};
const LIMIT = 20;

const pageVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

/**
 * SuperAdmin Orders Page — /superadmin/orders
 *
 * Data source: GET /api/super-admin/orders
 * Stats: GET /api/super-admin/dashboard
 */
export const Orders = () => {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [debouncedFilters, setDebouncedFilters] = useState(DEFAULT_FILTERS);
  const debounceTimer = useRef(null);

  // Debounce search input
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedFilters(filters);
      setPage(1);
    }, 380);
    return () => clearTimeout(debounceTimer.current);
  }, [filters]);

  // Build query params for server-side filtering
  const queryParams = {
    page,
    limit: LIMIT,
    ...(debouncedFilters.status && { status: debouncedFilters.status }),
    ...(debouncedFilters.paymentStatus && { paymentStatus: debouncedFilters.paymentStatus }),
    ...(debouncedFilters.laundryId && { laundryId: debouncedFilters.laundryId }),
    ...(debouncedFilters.search && { search: debouncedFilters.search }),
    ...(debouncedFilters.today && { today: debouncedFilters.today }),
    ...(debouncedFilters.startDate && { startDate: debouncedFilters.startDate }),
    ...(debouncedFilters.endDate && { endDate: debouncedFilters.endDate }),
  };

  const { data: ordersData, isLoading, isError, error, isFetching, refetch } = useOrders(queryParams);
  const { data: dashboardData, isLoading: statsLoading } = useOrderStats();

  const orders = ordersData?.data || [];
  const total = ordersData?.total || 0;
  const totalPages = ordersData?.pages || 1;

  // Flatten stats from dashboard
  const stats = dashboardData?.stats || null;

  const hasActiveFilters =
    filters.search !== '' ||
    filters.status !== '' ||
    filters.paymentStatus !== '' ||
    filters.laundryId !== '' ||
    filters.today !== '' ||
    filters.startDate !== '' ||
    filters.endDate !== '';

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

  const handleViewOrder = useCallback((order) => {
    setSelectedOrder(order);
    setIsDrawerOpen(true);
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setIsDrawerOpen(false);
    setTimeout(() => setSelectedOrder(null), 300);
  }, []);

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['superadmin', 'orders'] });
    queryClient.invalidateQueries({ queryKey: ['superadmin', 'dashboard'] });
    toast.success('Orders refreshed.');
  };

  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      className="space-y-5"
    >
      {/* ── Header ── */}
      <div className="glass-card rounded-2xl border border-white/8 p-5 sm:p-6">
        <OrderHeader />
      </div>

      {/* ── Stats ── */}
      <OrderStats stats={stats} isLoading={statsLoading} />

      {/* ── Filters ── */}
      <OrderFilters
        filters={filters}
        onChange={handleFiltersChange}
        onClear={handleClearFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {/* ── Table / Cards ── */}
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
                <span className="inline-block w-20 h-3 bg-white/8 rounded-full animate-pulse" />
              ) : (
                <>
                  {total > 0 ? (
                    <>
                      <span className="text-indigo-400">{total}</span> order{total !== 1 ? 's' : ''}
                    </>
                  ) : (
                    'No orders'
                  )}
                </>
              )}
            </span>
            {isFetching && !isLoading && (
              <span className="ml-2 text-[10px] text-indigo-400 animate-pulse">Updating…</span>
            )}
          </div>
          <button
            id="orders-refresh-btn"
            onClick={handleRefresh}
            disabled={isFetching}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 border border-white/8 text-textMuted hover:text-textPrimary transition-all disabled:opacity-50"
            title="Refresh orders"
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
              <p className="text-sm font-semibold text-textPrimary">Unable to load orders</p>
              <p className="text-xs text-textMuted mt-1">
                {error?.response?.status === 403
                  ? 'Access denied by backend. Verify your superadmin session.'
                  : 'A server error occurred. Please try again.'}
              </p>
            </div>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 text-xs font-semibold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 rounded-xl hover:bg-indigo-500/20 transition-all"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading */}
        {isLoading && !isError && <OrderTableSkeleton rows={LIMIT} />}

        {/* Empty state */}
        {!isLoading && !isError && orders.length === 0 && (
          <OrderEmptyState hasActiveFilters={hasActiveFilters} onClear={handleClearFilters} />
        )}

        {/* Desktop Table */}
        {!isLoading && !isError && orders.length > 0 && (
          <>
            <div className="hidden md:block overflow-x-auto">
              <OrderTable orders={orders} onView={handleViewOrder} />
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3 p-3 sm:p-4">
              {orders.map((order, i) => (
                <OrderCard key={order._id} order={order} onView={handleViewOrder} index={i} />
              ))}
            </div>

            {/* Pagination */}
            <OrderPagination
              page={page}
              totalPages={totalPages}
              total={total}
              limit={LIMIT}
              onPageChange={handlePageChange}
            />
          </>
        )}
      </motion.div>

      {/* ── Order Details Drawer ── */}
      <OrderDetailsDrawer
        order={selectedOrder}
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
      />
    </motion.div>
  );
};

export default Orders;
