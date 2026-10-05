import { useState, useCallback, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, AlertTriangle } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import { useEmployees, useToggleEmployeeStatus } from '../../hooks/useEmployees';
import { EmployeeHeader } from '../../components/superadmin/employees/EmployeeHeader';
import { EmployeeSummary } from '../../components/superadmin/employees/EmployeeSummary';
import { EmployeeFilters } from '../../components/superadmin/employees/EmployeeFilters';
import { EmployeeTable } from '../../components/superadmin/employees/EmployeeTable';
import { EmployeeCard } from '../../components/superadmin/employees/EmployeeCard';
import { EmployeeTableSkeleton } from '../../components/superadmin/employees/EmployeeTableSkeleton';
import { EmployeeEmptyState } from '../../components/superadmin/employees/EmployeeEmptyState';
import { EmployeePagination } from '../../components/superadmin/employees/EmployeePagination';
import { EmployeeDetailsDrawer } from '../../components/superadmin/employees/EmployeeDetailsDrawer';
import { EmployeeStatusConfirmModal } from '../../components/superadmin/employees/EmployeeStatusConfirmModal';

const DEFAULT_FILTERS = { search: '', role: '', status: '' };
const LIMIT = 20;

const pageVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

/**
 * SuperAdmin Employees Page — /superadmin/employees
 *
 * Displays platform workforce accounts (Delivery Partners & Laundry Admins).
 * Data source: GET /api/super-admin/users
 */
export const Employees = () => {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [targetToggleEmployee, setTargetToggleEmployee] = useState(null);
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
  // If role filter is empty, we request delivery & admin roles by default or filter client-side
  const queryParams = {
    page,
    limit: LIMIT,
    ...(debouncedFilters.role && { role: debouncedFilters.role }),
    ...(debouncedFilters.status && { status: debouncedFilters.status }),
    ...(debouncedFilters.search && { search: debouncedFilters.search }),
  };

  const { data: usersData, isLoading, isError, error, isFetching, refetch } = useEmployees(queryParams);
  const toggleStatusMutation = useToggleEmployeeStatus();

  const allUsers = usersData?.data || [];
  // Filter for employee roles (delivery partner or laundry admin) when no specific role filter is set
  const employees = debouncedFilters.role
    ? allUsers
    : allUsers.filter((u) => u.role === 'delivery' || u.role === 'admin');

  const total = usersData?.total || employees.length;
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

  const handleViewEmployee = useCallback((employee) => {
    setSelectedEmployee(employee);
    setIsDrawerOpen(true);
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setIsDrawerOpen(false);
    setTimeout(() => setSelectedEmployee(null), 300);
  }, []);

  const handleOpenToggleModal = useCallback((employee) => {
    setTargetToggleEmployee(employee);
    setIsConfirmModalOpen(true);
  }, []);

  const handleCloseToggleModal = useCallback(() => {
    if (toggleStatusMutation.isPending) return;
    setIsConfirmModalOpen(false);
    setTimeout(() => setTargetToggleEmployee(null), 300);
  }, [toggleStatusMutation.isPending]);

  const handleConfirmToggleStatus = async (id, isActive) => {
    try {
      const res = await toggleStatusMutation.mutateAsync({ id, isActive });
      toast.success(res.message || `Employee ${isActive ? 'activated' : 'deactivated'} successfully.`);
      setIsConfirmModalOpen(false);
      setTargetToggleEmployee(null);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to update employee status.';
      toast.error(msg);
    }
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['superadmin', 'employees'] });
    toast.success('Employees refreshed.');
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
        <EmployeeHeader />
      </div>

      {/* Summary */}
      <EmployeeSummary total={total} employees={employees} isLoading={isLoading} />

      {/* Filters */}
      <EmployeeFilters
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
        <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3.5 border-b border-white/6">
          <div>
            <span className="text-xs font-semibold text-textPrimary">
              {isLoading ? (
                <span className="inline-block w-20 h-3 bg-white/8 rounded-full animate-pulse" />
              ) : (
                <>
                  {employees.length > 0 ? (
                    <>
                      <span className="text-amber-400">{total}</span> employee{total !== 1 ? 's' : ''}
                    </>
                  ) : (
                    'No employees'
                  )}
                </>
              )}
            </span>
            {isFetching && !isLoading && (
              <span className="ml-2 text-[10px] text-amber-400 animate-pulse">Updating…</span>
            )}
          </div>
          <button
            id="emp-refresh-btn"
            onClick={handleRefresh}
            disabled={isFetching}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 border border-white/8 text-textMuted hover:text-textPrimary transition-all disabled:opacity-50"
            title="Refresh workforce"
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
              <p className="text-sm font-semibold text-textPrimary">Unable to load employees</p>
              <p className="text-xs text-textMuted mt-1">
                {error?.response?.status === 403
                  ? 'Access denied by backend. SuperAdmin session required.'
                  : 'A server error occurred. Please try again.'}
              </p>
            </div>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 text-xs font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-xl hover:bg-amber-500/20 transition-all"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading */}
        {isLoading && !isError && <EmployeeTableSkeleton rows={LIMIT} />}

        {/* Empty state */}
        {!isLoading && !isError && employees.length === 0 && (
          <EmployeeEmptyState hasActiveFilters={hasActiveFilters} onClear={handleClearFilters} />
        )}

        {/* Desktop Table */}
        {!isLoading && !isError && employees.length > 0 && (
          <>
            <div className="hidden md:block overflow-x-auto">
              <EmployeeTable employees={employees} onView={handleViewEmployee} onToggleStatus={handleOpenToggleModal} />
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3 p-3 sm:p-4">
              {employees.map((emp, i) => (
                <EmployeeCard key={emp._id} employee={emp} onView={handleViewEmployee} onToggleStatus={handleOpenToggleModal} index={i} />
              ))}
            </div>

            {/* Pagination */}
            <EmployeePagination
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
      <EmployeeDetailsDrawer
        employee={selectedEmployee}
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
      />

      {/* Status Confirm Modal */}
      <EmployeeStatusConfirmModal
        employee={targetToggleEmployee}
        isOpen={isConfirmModalOpen}
        isLoading={toggleStatusMutation.isPending}
        onClose={handleCloseToggleModal}
        onConfirm={handleConfirmToggleStatus}
      />
    </motion.div>
  );
};

export default Employees;
