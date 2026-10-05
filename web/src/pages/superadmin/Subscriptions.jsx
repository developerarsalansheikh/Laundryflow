import { useState, useCallback, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, AlertTriangle } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import {
  useSubscriptions,
  useSubscriptionStats,
  useSubscriptionPlans,
  useCreateSubscriptionPlan,
  useUpdateSubscriptionPlan,
  useDeleteSubscriptionPlan,
  useActivateSubscription,
  useCancelSubscription,
  useRenewSubscription,
} from '../../hooks/useSubscriptions';

import { SubscriptionHeader } from '../../components/superadmin/subscriptions/SubscriptionHeader';
import { SubscriptionSummary } from '../../components/superadmin/subscriptions/SubscriptionSummary';
import { SubscriptionPlansSection } from '../../components/superadmin/subscriptions/SubscriptionPlansSection';
import { SubscriptionFilters } from '../../components/superadmin/subscriptions/SubscriptionFilters';
import { SubscriptionTable } from '../../components/superadmin/subscriptions/SubscriptionTable';
import { SubscriptionCard } from '../../components/superadmin/subscriptions/SubscriptionCard';
import { SubscriptionTableSkeleton } from '../../components/superadmin/subscriptions/SubscriptionTableSkeleton';
import { SubscriptionEmptyState } from '../../components/superadmin/subscriptions/SubscriptionEmptyState';
import { SubscriptionPagination } from '../../components/superadmin/subscriptions/SubscriptionPagination';
import { SubscriptionDetailsDrawer } from '../../components/superadmin/subscriptions/SubscriptionDetailsDrawer';
import { SubscriptionPlanFormModal } from '../../components/superadmin/subscriptions/SubscriptionPlanFormModal';
import { SubscriptionConfirmModal } from '../../components/superadmin/subscriptions/SubscriptionConfirmModal';

const DEFAULT_FILTERS = { search: '', status: '', planId: '' };
const LIMIT = 20;

const pageVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

/**
 * SuperAdmin Subscriptions Page — /superadmin/subscriptions
 *
 * Full SaaS billing & plan management console backed by real backend subscription APIs.
 */
export const Subscriptions = () => {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);

  // Drawer state
  const [selectedSub, setSelectedSub] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Plan Form Modal state
  const [isPlanFormOpen, setIsPlanFormOpen] = useState(false);
  const [planToEdit, setPlanToEdit] = useState(null);

  // Confirm Modal state
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    type: null, // 'delete-plan' | 'activate' | 'cancel' | 'renew'
    item: null,
  });

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
    ...(debouncedFilters.planId && { planId: debouncedFilters.planId }),
    ...(debouncedFilters.search && { search: debouncedFilters.search }),
  };

  // Queries
  const { data: subsData, isLoading, isError, error, isFetching, refetch } = useSubscriptions(queryParams);
  const { data: statsData, isLoading: statsLoading } = useSubscriptionStats();
  const { data: plansData } = useSubscriptionPlans();

  // Mutations
  const createPlanMutation = useCreateSubscriptionPlan();
  const updatePlanMutation = useUpdateSubscriptionPlan();
  const deletePlanMutation = useDeleteSubscriptionPlan();
  const activateSubMutation = useActivateSubscription();
  const cancelSubMutation = useCancelSubscription();
  const renewSubMutation = useRenewSubscription();

  const subscriptions = subsData?.data || [];
  const total = subsData?.total || 0;
  const totalPages = subsData?.pages || 1;
  const plans = plansData?.data || [];

  const hasActiveFilters = filters.search !== '' || filters.status !== '' || filters.planId !== '';

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

  // View Details Drawer
  const handleView = useCallback((sub) => {
    setSelectedSub(sub);
    setIsDrawerOpen(true);
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setIsDrawerOpen(false);
    setTimeout(() => setSelectedSub(null), 300);
  }, []);

  // Plan CRUD handlers
  const handleOpenCreatePlan = () => {
    setPlanToEdit(null);
    setIsPlanFormOpen(true);
  };

  const handleOpenEditPlan = (plan) => {
    setPlanToEdit(plan);
    setIsPlanFormOpen(true);
  };

  const handleClosePlanForm = () => {
    setIsPlanFormOpen(false);
    setTimeout(() => setPlanToEdit(null), 300);
  };

  const handleSavePlan = async (formData) => {
    try {
      if (planToEdit) {
        await updatePlanMutation.mutateAsync({ id: planToEdit._id, payload: formData });
        toast.success('Subscription plan updated successfully.');
      } else {
        await createPlanMutation.mutateAsync(formData);
        toast.success('Subscription plan created successfully.');
      }
      handleClosePlanForm();
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to save plan.';
      toast.error(msg);
    }
  };

  // Confirm modal triggers
  const handleOpenConfirm = (type, item) => {
    setConfirmState({ isOpen: true, type, item });
  };

  const handleCloseConfirm = () => {
    setConfirmState({ isOpen: false, type: null, item: null });
  };

  const handleExecuteConfirm = async (extraPayload = {}) => {
    const { type, item } = confirmState;
    if (!item) return;

    try {
      if (type === 'delete-plan') {
        await deletePlanMutation.mutateAsync(item._id);
        toast.success('Plan deleted successfully.');
      } else if (type === 'activate') {
        await activateSubMutation.mutateAsync(item._id);
        toast.success('Subscription activated successfully.');
      } else if (type === 'cancel') {
        await cancelSubMutation.mutateAsync({ id: item._id, payload: extraPayload });
        toast.success('Subscription cancelled.');
      } else if (type === 'renew') {
        await renewSubMutation.mutateAsync({ id: item._id, payload: extraPayload });
        toast.success('Subscription renewed successfully.');
      }
      handleCloseConfirm();
    } catch (err) {
      if (err?.response?.status === 409) {
        toast.error('This plan cannot be deleted because it is being used by active subscriptions.');
      } else {
        const msg = err?.response?.data?.message || err?.message || 'Action failed.';
        toast.error(msg);
      }
    }
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['superadmin', 'subscriptions'] });
    queryClient.invalidateQueries({ queryKey: ['superadmin', 'subscription-plans'] });
    queryClient.invalidateQueries({ queryKey: ['superadmin', 'subscriptions', 'stats'] });
    toast.success('Subscription data refreshed.');
  };

  const isActionLoading =
    createPlanMutation.isPending ||
    updatePlanMutation.isPending ||
    deletePlanMutation.isPending ||
    activateSubMutation.isPending ||
    cancelSubMutation.isPending ||
    renewSubMutation.isPending;

  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      className="space-y-5"
    >
      {/* Header */}
      <div className="glass-card rounded-2xl border border-white/8 p-5 sm:p-6">
        <SubscriptionHeader />
      </div>

      {/* Subscription Plans Management Section */}
      <SubscriptionPlansSection
        onCreatePlan={handleOpenCreatePlan}
        onEditPlan={handleOpenEditPlan}
        onDeletePlan={(plan) => handleOpenConfirm('delete-plan', plan)}
      />

      {/* Real Statistics Summary */}
      <SubscriptionSummary stats={statsData} isLoading={statsLoading} />

      {/* Filters */}
      <SubscriptionFilters
        filters={filters}
        plans={plans}
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
                  {subscriptions.length > 0 ? (
                    <>
                      <span className="text-purple-400">{total}</span> subscription{total !== 1 ? 's' : ''}
                    </>
                  ) : (
                    'No subscriptions'
                  )}
                </>
              )}
            </span>
            {isFetching && !isLoading && (
              <span className="ml-2 text-[10px] text-purple-400 animate-pulse">Updating…</span>
            )}
          </div>
          <button
            id="sub-refresh-btn"
            onClick={handleRefresh}
            disabled={isFetching}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 border border-white/8 text-textMuted hover:text-textPrimary transition-all disabled:opacity-50"
            title="Refresh subscriptions"
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
              <p className="text-sm font-semibold text-textPrimary">Unable to load subscriptions</p>
              <p className="text-xs text-textMuted mt-1">
                {error?.response?.status === 403
                  ? 'Access denied by backend. SuperAdmin session required.'
                  : 'A server error occurred. Please try again.'}
              </p>
            </div>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 text-xs font-semibold text-purple-400 bg-purple-500/10 border border-purple-500/20 rounded-xl hover:bg-purple-500/20 transition-all"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading skeleton */}
        {isLoading && !isError && <SubscriptionTableSkeleton rows={LIMIT} />}

        {/* Empty state */}
        {!isLoading && !isError && subscriptions.length === 0 && (
          <SubscriptionEmptyState hasActiveFilters={hasActiveFilters} onClear={handleClearFilters} />
        )}

        {/* Desktop table */}
        {!isLoading && !isError && subscriptions.length > 0 && (
          <>
            <div className="hidden md:block overflow-x-auto">
              <SubscriptionTable
                subscriptions={subscriptions}
                onView={handleView}
                onActivate={(sub) => handleOpenConfirm('activate', sub)}
                onCancel={(sub) => handleOpenConfirm('cancel', sub)}
                onRenew={(sub) => handleOpenConfirm('renew', sub)}
              />
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-3 p-3 sm:p-4">
              {subscriptions.map((sub, i) => (
                <SubscriptionCard
                  key={sub._id}
                  subscription={sub}
                  onView={handleView}
                  onActivate={(s) => handleOpenConfirm('activate', s)}
                  onCancel={(s) => handleOpenConfirm('cancel', s)}
                  onRenew={(s) => handleOpenConfirm('renew', s)}
                  index={i}
                />
              ))}
            </div>

            {/* Pagination */}
            <SubscriptionPagination
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
      <SubscriptionDetailsDrawer
        subscription={selectedSub}
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        onActivate={(sub) => handleOpenConfirm('activate', sub)}
        onCancel={(sub) => handleOpenConfirm('cancel', sub)}
        onRenew={(sub) => handleOpenConfirm('renew', sub)}
      />

      {/* Create / Edit Plan Form Modal */}
      <SubscriptionPlanFormModal
        isOpen={isPlanFormOpen}
        planToEdit={planToEdit}
        isLoading={createPlanMutation.isPending || updatePlanMutation.isPending}
        onClose={handleClosePlanForm}
        onSubmit={handleSavePlan}
      />

      {/* Generic Confirmation Modal */}
      <SubscriptionConfirmModal
        type={confirmState.type}
        item={confirmState.item}
        isOpen={confirmState.isOpen}
        isLoading={isActionLoading}
        onClose={handleCloseConfirm}
        onConfirm={handleExecuteConfirm}
      />
    </motion.div>
  );
};

export default Subscriptions;
