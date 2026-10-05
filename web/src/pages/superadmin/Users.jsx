import { useState, useCallback, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, AlertTriangle } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import { useUsers, useToggleUserStatus } from '../../hooks/useUsers';
import { UserHeader } from '../../components/superadmin/users/UserHeader';
import { UserSummary } from '../../components/superadmin/users/UserSummary';
import { UserFilters } from '../../components/superadmin/users/UserFilters';
import { UserTable } from '../../components/superadmin/users/UserTable';
import { UserCard } from '../../components/superadmin/users/UserCard';
import { UserTableSkeleton } from '../../components/superadmin/users/UserTableSkeleton';
import { UserEmptyState } from '../../components/superadmin/users/UserEmptyState';
import { UserPagination } from '../../components/superadmin/users/UserPagination';
import { UserDetailsDrawer } from '../../components/superadmin/users/UserDetailsDrawer';
import { UserStatusConfirmModal } from '../../components/superadmin/users/UserStatusConfirmModal';

const DEFAULT_FILTERS = { search: '', role: '', status: '' };
const LIMIT = 20;

const pageVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

/**
 * SuperAdmin Users Page — /superadmin/users
 *
 * Data source: GET /api/super-admin/users
 * Mutations: PUT /api/super-admin/users/:id/toggle-status
 */
export const Users = () => {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [targetToggleUser, setTargetToggleUser] = useState(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

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

  // Query parameters for server-side filtering
  const queryParams = {
    page,
    limit: LIMIT,
    ...(debouncedFilters.role && { role: debouncedFilters.role }),
    ...(debouncedFilters.status && { status: debouncedFilters.status }),
    ...(debouncedFilters.search && { search: debouncedFilters.search }),
  };

  const { data: usersData, isLoading, isError, error, isFetching, refetch } = useUsers(queryParams);
  const toggleStatusMutation = useToggleUserStatus();

  const users = usersData?.data || [];
  const total = usersData?.total || 0;
  const totalPages = usersData?.pages || 1;

  const hasActiveFilters =
    filters.search !== '' || filters.role !== '' || filters.status !== '';

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

  const handleViewUser = useCallback((user) => {
    setSelectedUser(user);
    setIsDrawerOpen(true);
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setIsDrawerOpen(false);
    setTimeout(() => setSelectedUser(null), 300);
  }, []);

  const handleOpenToggleModal = useCallback((user) => {
    setTargetToggleUser(user);
    setIsConfirmModalOpen(true);
  }, []);

  const handleCloseToggleModal = useCallback(() => {
    if (toggleStatusMutation.isPending) return;
    setIsConfirmModalOpen(false);
    setTimeout(() => setTargetToggleUser(null), 300);
  }, [toggleStatusMutation.isPending]);

  const handleConfirmToggleStatus = async (id, isActive) => {
    try {
      const res = await toggleStatusMutation.mutateAsync({ id, isActive });
      toast.success(res.message || `User ${isActive ? 'activated' : 'deactivated'} successfully.`);
      setIsConfirmModalOpen(false);
      setTargetToggleUser(null);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to update user status.';
      toast.error(msg);
    }
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['superadmin', 'users'] });
    toast.success('Users list refreshed.');
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
        <UserHeader />
      </div>

      {/* ── Summary Stats ── */}
      <UserSummary total={total} users={users} isLoading={isLoading} />

      {/* ── Filters ── */}
      <UserFilters
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
                      <span className="text-indigo-400">{total}</span> user{total !== 1 ? 's' : ''}
                    </>
                  ) : (
                    'No users'
                  )}
                </>
              )}
            </span>
            {isFetching && !isLoading && (
              <span className="ml-2 text-[10px] text-indigo-400 animate-pulse">Updating…</span>
            )}
          </div>
          <button
            id="users-refresh-btn"
            onClick={handleRefresh}
            disabled={isFetching}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 border border-white/8 text-textMuted hover:text-textPrimary transition-all disabled:opacity-50"
            title="Refresh users"
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
              <p className="text-sm font-semibold text-textPrimary">Unable to load users</p>
              <p className="text-xs text-textMuted mt-1">
                {error?.response?.status === 403
                  ? 'Access denied by backend. Verify your superadmin credentials.'
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
        {isLoading && !isError && <UserTableSkeleton rows={LIMIT} />}

        {/* Empty state */}
        {!isLoading && !isError && users.length === 0 && (
          <UserEmptyState hasActiveFilters={hasActiveFilters} onClear={handleClearFilters} />
        )}

        {/* Desktop Table */}
        {!isLoading && !isError && users.length > 0 && (
          <>
            <div className="hidden md:block overflow-x-auto">
              <UserTable users={users} onView={handleViewUser} onToggleStatus={handleOpenToggleModal} />
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3 p-3 sm:p-4">
              {users.map((user, i) => (
                <UserCard key={user._id} user={user} onView={handleViewUser} onToggleStatus={handleOpenToggleModal} index={i} />
              ))}
            </div>

            {/* Pagination */}
            <UserPagination
              page={page}
              totalPages={totalPages}
              total={total}
              limit={LIMIT}
              onPageChange={handlePageChange}
            />
          </>
        )}
      </motion.div>

      {/* ── User Details Drawer ── */}
      <UserDetailsDrawer
        user={selectedUser}
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
      />

      {/* ── Toggle Status Confirm Modal ── */}
      <UserStatusConfirmModal
        user={targetToggleUser}
        isOpen={isConfirmModalOpen}
        isLoading={toggleStatusMutation.isPending}
        onClose={handleCloseToggleModal}
        onConfirm={handleConfirmToggleStatus}
      />
    </motion.div>
  );
};

export default Users;
