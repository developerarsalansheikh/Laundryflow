import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { AlertCircle, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';

// Hooks
import {
  useLaundries,
  useLaundryStats,
  useCreateLaundry,
  useApproveLaundry,
  useRejectLaundry,
  useSuspendLaundry,
  useUpdateLaundryCommission,
} from '../../hooks/useLaundries';

// Components
import LaundryHeader from '../../components/superadmin/laundries/LaundryHeader';
import LaundrySummary from '../../components/superadmin/laundries/LaundrySummary';
import LaundryFilters from '../../components/superadmin/laundries/LaundryFilters';
import LaundryTable from '../../components/superadmin/laundries/LaundryTable';
import LaundryCard from '../../components/superadmin/laundries/LaundryCard';
import LaundryTableSkeleton from '../../components/superadmin/laundries/LaundryTableSkeleton';
import LaundryEmptyState from '../../components/superadmin/laundries/LaundryEmptyState';
import LaundryDetailsDrawer from '../../components/superadmin/laundries/LaundryDetailsDrawer';
import LaundryFormModal from '../../components/superadmin/laundries/LaundryFormModal';
import LaundryCommissionModal from '../../components/superadmin/laundries/LaundryCommissionModal';
import LaundryActionConfirmModal from '../../components/superadmin/laundries/LaundryActionConfirmModal';

/**
 * Super Admin Laundries Management Page — Phase 7
 */
export const Laundries = () => {
  // ── Filters & Pagination State ──────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 20;

  // ── Modal & Drawer State ───────────────────────────────────────────────────
  const [selectedLaundry, setSelectedLaundry] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [isCommissionModalOpen, setIsCommissionModalOpen] = useState(false);
  const [commissionTargetLaundry, setCommissionTargetLaundry] = useState(null);

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmActionType, setConfirmActionType] = useState('approve');
  const [confirmTargetLaundry, setConfirmTargetLaundry] = useState(null);

  // ── Query & Mutation Hooks ─────────────────────────────────────────────────
  const queryParams = useMemo(
    () => ({
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(cityFilter ? { city: cityFilter } : {}),
      page: currentPage,
      limit,
    }),
    [statusFilter, cityFilter, currentPage, limit]
  );

  const {
    data: laundriesResponse,
    isLoading: laundriesLoading,
    isError: laundriesError,
    error: laundriesErr,
    refetch: refetchLaundries,
  } = useLaundries(queryParams);

  const { data: statsData } = useLaundryStats();

  const createLaundryMutation = useCreateLaundry();
  const approveLaundryMutation = useApproveLaundry();
  const rejectLaundryMutation = useRejectLaundry();
  const suspendLaundryMutation = useSuspendLaundry();
  const updateCommissionMutation = useUpdateLaundryCommission();

  const rawLaundries = useMemo(() => laundriesResponse?.data || [], [laundriesResponse?.data]);
  const totalRecords = laundriesResponse?.total || rawLaundries.length;
  const totalPages = laundriesResponse?.pages || Math.ceil(totalRecords / limit) || 1;

  // ── Extract Unique Available Cities for Dropdown Filter ────────────────────
  const availableCities = useMemo(() => {
    const citiesSet = new Set();
    rawLaundries.forEach((l) => {
      if (l.city) citiesSet.add(l.city);
    });
    return Array.from(citiesSet).sort();
  }, [rawLaundries]);

  // ── Client-Side Safe Search Filter (Name, Owner, Email, City) ──────────────
  const filteredLaundries = useMemo(() => {
    if (!searchQuery.trim()) return rawLaundries;
    const q = searchQuery.toLowerCase().trim();
    return rawLaundries.filter((item) => {
      const nameMatch = item.name?.toLowerCase().includes(q);
      const ownerMatch = item.owner?.name?.toLowerCase().includes(q);
      const emailMatch = item.email?.toLowerCase().includes(q) || item.owner?.email?.toLowerCase().includes(q);
      const cityMatch = item.city?.toLowerCase().includes(q);
      return nameMatch || ownerMatch || emailMatch || cityMatch;
    });
  }, [rawLaundries, searchQuery]);

  // ── Action Handlers ────────────────────────────────────────────────────────
  const handleViewDetails = (laundry) => {
    setSelectedLaundry(laundry);
    setIsDrawerOpen(true);
  };

  const handleOpenAddModal = () => {
    setIsAddModalOpen(true);
  };

  const handleOpenCommissionModal = (laundry) => {
    setCommissionTargetLaundry(laundry);
    setIsCommissionModalOpen(true);
  };

  const handleOpenApproveConfirm = (laundry) => {
    setConfirmTargetLaundry(laundry);
    setConfirmActionType('approve');
    setIsConfirmModalOpen(true);
  };

  const handleOpenRejectConfirm = (laundry) => {
    setConfirmTargetLaundry(laundry);
    setConfirmActionType('reject');
    setIsConfirmModalOpen(true);
  };

  const handleOpenSuspendConfirm = (laundry) => {
    setConfirmTargetLaundry(laundry);
    setConfirmActionType('suspend');
    setIsConfirmModalOpen(true);
  };

  // ── Submit Handlers ────────────────────────────────────────────────────────
  const handleCreateSubmit = async (formData) => {
    try {
      await createLaundryMutation.mutateAsync(formData);
      toast.success('Laundry created successfully.');
      setIsAddModalOpen(false);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to create laundry.';
      toast.error(msg);
    }
  };

  const handleCommissionSubmit = async ({ id, commissionPercent }) => {
    try {
      await updateCommissionMutation.mutateAsync({ id, commissionPercent });
      toast.success(`Commission updated to ${commissionPercent}%.`);
      setIsCommissionModalOpen(false);
      setCommissionTargetLaundry(null);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to update commission.';
      toast.error(msg);
    }
  };

  const handleConfirmAction = async (payload) => {
    try {
      if (confirmActionType === 'approve') {
        const id = typeof payload === 'string' ? payload : payload.id;
        const wasSuspended = confirmTargetLaundry?.status === 'suspended';
        await approveLaundryMutation.mutateAsync(id);
        toast.success(wasSuspended ? 'Laundry activated successfully.' : 'Laundry approved successfully.');
      } else if (confirmActionType === 'reject') {
        const { id, reason } = payload;
        await rejectLaundryMutation.mutateAsync({ id, reason });
        toast.success('Laundry request rejected.');
      } else if (confirmActionType === 'suspend') {
        const id = typeof payload === 'string' ? payload : payload.id;
        await suspendLaundryMutation.mutateAsync(id);
        toast.success('Laundry suspended successfully.');
      }
      setIsConfirmModalOpen(false);
      setConfirmTargetLaundry(null);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Operation failed.';
      toast.error(msg);
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('');
    setCityFilter('');
    setCurrentPage(1);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
      className="space-y-6 pb-14 font-sans"
    >
      {/* Page Header */}
      <LaundryHeader onAddLaundry={handleOpenAddModal} />

      {/* Summary Stat Cards */}
      <LaundrySummary
        stats={statsData?.stats || {}}
        laundries={rawLaundries}
        isLoading={laundriesLoading}
      />

      {/* Search & Filter Control Bar */}
      <LaundryFilters
        searchQuery={searchQuery}
        onSearchChange={(val) => {
          setSearchQuery(val);
          setCurrentPage(1);
        }}
        statusFilter={statusFilter}
        onStatusChange={(val) => {
          setStatusFilter(val);
          setCurrentPage(1);
        }}
        cityFilter={cityFilter}
        onCityChange={(val) => {
          setCityFilter(val);
          setCurrentPage(1);
        }}
        availableCities={availableCities}
        totalResults={filteredLaundries.length}
      />

      {/* Main Content Area */}
      {laundriesLoading ? (
        <LaundryTableSkeleton rows={6} />
      ) : laundriesError ? (
        <div className="glass-card rounded-2xl border border-rose-500/20 p-8 text-center my-6 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-textPrimary">Unable to load laundries</h3>
            <p className="text-xs text-textMuted mt-1">
              {laundriesErr?.response?.data?.message ||
                laundriesErr?.message ||
                'A network error occurred while connecting to backend.'}
            </p>
          </div>
          <button
            onClick={() => refetchLaundries()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Retry Connection</span>
          </button>
        </div>
      ) : filteredLaundries.length === 0 ? (
        <LaundryEmptyState
          onAddLaundry={handleOpenAddModal}
          isFiltered={Boolean(searchQuery || statusFilter || cityFilter)}
          onResetFilters={handleResetFilters}
        />
      ) : (
        <div className="space-y-4">
          {/* Desktop Table View */}
          <div className="hidden md:block">
            <LaundryTable
              laundries={filteredLaundries}
              onView={handleViewDetails}
              onApprove={handleOpenApproveConfirm}
              onReject={handleOpenRejectConfirm}
              onSuspend={handleOpenSuspendConfirm}
              onEditCommission={handleOpenCommissionModal}
            />
          </div>

          {/* Mobile Cards View */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {filteredLaundries.map((laundry) => (
              <LaundryCard
                key={laundry._id}
                laundry={laundry}
                onView={handleViewDetails}
                onApprove={handleOpenApproveConfirm}
                onReject={handleOpenRejectConfirm}
                onSuspend={handleOpenSuspendConfirm}
                onEditCommission={handleOpenCommissionModal}
              />
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="glass-card p-3 rounded-xl border border-white/8 flex items-center justify-between text-xs text-textMuted">
              <span>
                Page <strong className="text-textPrimary">{currentPage}</strong> of{' '}
                <strong className="text-textPrimary">{totalPages}</strong> ({totalRecords} records)
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-textSecondary disabled:opacity-30 transition-all flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>

                <button
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage >= totalPages}
                  className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-textSecondary disabled:opacity-30 transition-all flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Details Side Drawer */}
      <LaundryDetailsDrawer
        laundry={selectedLaundry}
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedLaundry(null);
        }}
      />

      {/* Add Laundry Form Modal */}
      <LaundryFormModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleCreateSubmit}
        isLoading={createLaundryMutation.isPending}
        apiError={createLaundryMutation.error?.response?.data?.message || null}
      />

      {/* Edit Commission Modal */}
      <LaundryCommissionModal
        isOpen={isCommissionModalOpen}
        onClose={() => {
          setIsCommissionModalOpen(false);
          setCommissionTargetLaundry(null);
        }}
        onSubmit={handleCommissionSubmit}
        laundry={commissionTargetLaundry}
        isLoading={updateCommissionMutation.isPending}
        apiError={updateCommissionMutation.error?.response?.data?.message || null}
      />

      {/* Action Confirmation Modal (Approve, Reject, Suspend) */}
      <LaundryActionConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => {
          setIsConfirmModalOpen(false);
          setConfirmTargetLaundry(null);
        }}
        onConfirm={handleConfirmAction}
        actionType={confirmActionType}
        laundry={confirmTargetLaundry}
        isLoading={
          approveLaundryMutation.isPending ||
          rejectLaundryMutation.isPending ||
          suspendLaundryMutation.isPending
        }
      />
    </motion.div>
  );
};

export default Laundries;
