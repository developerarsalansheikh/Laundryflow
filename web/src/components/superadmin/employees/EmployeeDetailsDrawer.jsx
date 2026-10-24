import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Store, Calendar, CheckCircle, Shield } from 'lucide-react';
import { UserRoleBadge } from '../users/UserRoleBadge';
import { UserStatusBadge } from '../users/UserStatusBadge';
import { useEmployeeDetails } from '../../../hooks/useEmployees';

const formatDate = (d) =>
  d
    ? new Date(d).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';

const Row = ({ label, value, mono = false }) =>
  value ? (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-[#E7E2D8] last:border-0">
      <span className="text-[11px] text-stone-500 font-medium whitespace-nowrap">{label}</span>
      <span className={`text-xs text-stone-900 text-right ${mono ? 'font-mono' : 'font-medium font-erode'}`}>
        {value}
      </span>
    </div>
  ) : null;

const SectionTitle = ({ icon: Icon, label, iconClass }) => (
  <div className="flex items-center gap-2 mb-3 mt-5 first:mt-0">
    <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${iconClass}`}>
      <Icon className="w-3.5 h-3.5" />
    </div>
    <span className="text-[11px] font-bold text-stone-500 font-oswald uppercase tracking-wider">{label}</span>
  </div>
);

/**
 * EmployeeDetailsDrawer — Drawer displaying employee details safely without exposing credentials.
 */
export const EmployeeDetailsDrawer = ({
  employeeId,
  employee: initialEmployee,
  isOpen,
  onClose,
  onApprove,
  onReject,
}) => {
  const drawerRef = useRef(null);

  const targetId = employeeId || initialEmployee?._id;
  const { data: fetchedEmployee, isLoading } = useEmployeeDetails(isOpen ? targetId : null);

  const employee = fetchedEmployee || initialEmployee;

  useEffect(() => {
    if (!isOpen) return;
    const handle = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handle);
    return () => document.removeEventListener('keydown', handle);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const name = employee?.name || '—';
  const email = employee?.email || '—';
  const phone = employee?.phone || '—';
  const role = employee?.role || 'delivery';
  const isActive = Boolean(employee?.isActive);
  const isVerified = Boolean(employee?.isVerified);
  const laundryName = employee?.laundryId?.name || null;
  const laundryCity = employee?.laundryId?.city || null;
  const activeDeliveries = employee?.stats?.activeDeliveries;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="drawer-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            aria-hidden="true"
          />

          <motion.div
            key="drawer-panel"
            ref={drawerRef}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
            className="fixed right-0 top-0 h-full w-full max-w-[440px] bg-white border-l border-[#E7E2D8] shadow-2xl z-50 flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-label="Employee Details"
          >
            <div className="flex items-start justify-between gap-4 px-5 pt-5 pb-4 border-b border-[#E7E2D8] bg-[#FAF8F5] flex-shrink-0">
              <div>
                <p className="text-[10px] font-bold text-stone-500 font-oswald uppercase tracking-widest mb-1">
                  Employee Record
                </p>
                <h2 className="text-lg font-bold text-stone-900 font-oswald tracking-tight">{name}</h2>
                <p className="text-xs text-stone-500 font-mono mt-0.5">{email}</p>
              </div>
              <button
                onClick={onClose}
                id="emp-drawer-close"
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 border border-[#DDD5C7] flex items-center justify-center text-stone-600 hover:text-stone-900 transition-all flex-shrink-0 mt-0.5 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-1">
              {isLoading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3">
                  <div className="w-8 h-8 rounded-full border-2 border-stone-300 border-t-stone-800 animate-spin" />
                  <p className="text-xs text-stone-500 font-erode">Loading employee details...</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <UserRoleBadge role={role} />
                    <UserStatusBadge isActive={isActive} />
                    {isVerified && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle className="w-3 h-3" /> Verified
                      </span>
                    )}
                  </div>

                  <SectionTitle icon={User} label="Contact Information" iconClass="bg-stone-100 text-stone-700 border border-[#DDD5C7]" />
                  <div className="bg-white rounded-xl border border-[#E7E2D8] px-4 py-1 divide-y divide-[#E7E2D8] shadow-2xs">
                    <Row label="Full Name" value={name} />
                    <Row label="Email Address" value={email} mono />
                    <Row label="Phone Number" value={phone} mono />
                  </div>

                  {laundryName && (
                    <>
                      <SectionTitle icon={Store} label="Laundry Assignment" iconClass="bg-stone-100 text-stone-700 border border-[#DDD5C7]" />
                      <div className="bg-white rounded-xl border border-[#E7E2D8] px-4 py-1 divide-y divide-[#E7E2D8] shadow-2xs">
                        <Row label="Store Name" value={laundryName} />
                        {laundryCity && <Row label="City" value={laundryCity} />}
                        {employee?.laundryId?.address && <Row label="Address" value={employee.laundryId.address} />}
                        {employee?.laundryId?.phone && <Row label="Store Phone" value={employee.laundryId.phone} mono />}
                      </div>
                    </>
                  )}

                  {role === 'delivery' && (
                    <>
                      <SectionTitle icon={Shield} label="Delivery & Access Policy" iconClass="bg-stone-100 text-stone-700 border border-[#DDD5C7]" />
                      <div className="bg-white rounded-xl border border-[#E7E2D8] px-4 py-1 divide-y divide-[#E7E2D8] shadow-2xs">
                        <Row
                          label="Agent Type"
                          value={
                            employee?.createdSource === 'legacy' || !employee?.createdSource
                              ? 'Legacy Agent (Open Access)'
                              : employee?.createdSource === 'laundry_admin'
                              ? 'Laundry Store Request'
                              : 'Super Admin Created'
                          }
                        />
                        <Row
                          label="Approval Status"
                          value={
                            employee?.createdSource === 'legacy' || !employee?.createdSource
                              ? 'Approved (Legacy)'
                              : (employee?.approvalStatus || 'approved').toUpperCase()
                          }
                        />
                        <Row
                          label="Access Scope"
                          value={
                            employee?.accessMode === 'all_laundries'
                              ? 'All Laundries (Global)'
                              : employee?.accessMode === 'multi_laundry'
                              ? `Multi-Store (${employee?.authorizedLaundries?.length || 0} Stores)`
                              : 'Single Assigned Store'
                          }
                        />
                        {employee?.areaPolicy?.serviceRadiusKm && (
                          <Row label="Dispatch Radius" value={`${employee.areaPolicy.serviceRadiusKm} KM Max`} />
                        )}
                        <Row
                          label="Vehicle Type"
                          value={employee?.vehicleType ? employee.vehicleType.toUpperCase() : 'Standard'}
                        />
                        {employee?.vehicleNumber && <Row label="Vehicle Number" value={employee.vehicleNumber} mono />}
                        <Row
                          label="Availability Status"
                          value={employee?.availabilityStatus ? employee.availabilityStatus.toUpperCase() : 'Available'}
                        />
                        {employee?.totalDeliveries !== undefined && (
                          <Row label="Total Deliveries" value={String(employee.totalDeliveries)} />
                        )}
                        {employee?.totalEarnings !== undefined && (
                          <Row label="Total Earnings" value={`₹${employee.totalEarnings}`} />
                        )}
                      </div>
                    </>
                  )}

                  {activeDeliveries !== undefined && (
                    <>
                      <SectionTitle icon={Shield} label="Workload Metrics" iconClass="bg-stone-100 text-stone-700 border border-[#DDD5C7]" />
                      <div className="bg-white rounded-xl border border-[#E7E2D8] px-4 py-1 divide-y divide-[#E7E2D8] shadow-2xs">
                        <Row label="Active Deliveries" value={String(activeDeliveries)} />
                      </div>
                    </>
                  )}

                  <SectionTitle icon={Calendar} label="Timestamps" iconClass="bg-stone-100 text-stone-700 border border-[#DDD5C7]" />
                  <div className="bg-white rounded-xl border border-[#E7E2D8] px-4 py-1 divide-y divide-[#E7E2D8] shadow-2xs">
                    <Row label="Joined At" value={formatDate(employee?.createdAt)} />
                    <Row label="Updated At" value={formatDate(employee?.updatedAt)} />
                  </div>
                </>
              )}
            </div>

            <div className="px-5 py-4 border-t border-[#E7E2D8] bg-[#FAF8F5] flex-shrink-0 space-y-2">
              {role === 'delivery' && employee?.approvalStatus === 'pending' && (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      onApprove?.(employee);
                      onClose();
                    }}
                    className="py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer font-oswald uppercase tracking-wider"
                  >
                    <CheckCircle className="w-4 h-4" /> Approve Agent
                  </button>
                  <button
                    onClick={() => {
                      onReject?.(employee);
                      onClose();
                    }}
                    className="py-2.5 rounded-full bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-semibold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer font-oswald uppercase tracking-wider"
                  >
                    <X className="w-4 h-4" /> Reject Request
                  </button>
                </div>
              )}
              <button
                onClick={onClose}
                className="btn-secondary w-full py-2.5 rounded-full text-xs font-semibold transition-all font-oswald uppercase tracking-wider cursor-pointer shadow-2xs hover:bg-stone-100"
              >
                Close
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default EmployeeDetailsDrawer;
