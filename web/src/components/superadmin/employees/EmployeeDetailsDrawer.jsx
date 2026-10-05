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
    <div className="flex items-start justify-between gap-4 py-2 border-b border-white/5 last:border-0">
      <span className="text-[11px] text-textMuted font-medium whitespace-nowrap">{label}</span>
      <span className={`text-xs text-textPrimary text-right ${mono ? 'font-mono' : 'font-medium'}`}>
        {value}
      </span>
    </div>
  ) : null;

const SectionTitle = ({ icon: Icon, label, iconClass }) => (
  <div className="flex items-center gap-2 mb-3 mt-5 first:mt-0">
    <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${iconClass}`}>
      <Icon className="w-3.5 h-3.5" />
    </div>
    <span className="text-[11px] font-bold text-textMuted uppercase tracking-wider">{label}</span>
  </div>
);

/**
 * EmployeeDetailsDrawer — Drawer displaying employee details safely without exposing credentials.
 */
export const EmployeeDetailsDrawer = ({ employeeId, employee: initialEmployee, isOpen, onClose }) => {
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
            className="fixed right-0 top-0 h-full w-full max-w-[440px] bg-[#0d1526] border-l border-white/10 shadow-2xl z-50 flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-label="Employee Details"
          >
            <div className="flex items-start justify-between gap-4 px-5 pt-5 pb-4 border-b border-white/8 flex-shrink-0">
              <div>
                <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest mb-1">
                  Employee Record
                </p>
                <h2 className="text-lg font-bold text-textPrimary">{name}</h2>
                <p className="text-xs text-textMuted font-mono mt-0.5">{email}</p>
              </div>
              <button
                onClick={onClose}
                id="emp-drawer-close"
                className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 border border-white/8 flex items-center justify-center text-textMuted hover:text-textPrimary transition-all flex-shrink-0 mt-0.5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-1">
              {isLoading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3">
                  <div className="w-8 h-8 rounded-full border-2 border-amber-500/30 border-t-amber-400 animate-spin" />
                  <p className="text-xs text-textMuted">Loading employee details...</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <UserRoleBadge role={role} />
                    <UserStatusBadge isActive={isActive} />
                    {isVerified && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <CheckCircle className="w-3 h-3" /> Verified
                      </span>
                    )}
                  </div>

                  <SectionTitle icon={User} label="Contact Information" iconClass="bg-amber-500/15 text-amber-400" />
                  <div className="glass-card rounded-xl border border-white/8 px-4 py-1 divide-y divide-white/4">
                    <Row label="Full Name" value={name} />
                    <Row label="Email Address" value={email} mono />
                    <Row label="Phone Number" value={phone} mono />
                  </div>

                  {laundryName && (
                    <>
                      <SectionTitle icon={Store} label="Laundry Assignment" iconClass="bg-purple-500/15 text-purple-400" />
                      <div className="glass-card rounded-xl border border-white/8 px-4 py-1 divide-y divide-white/4">
                        <Row label="Laundry Name" value={laundryName} />
                        {laundryCity && <Row label="City" value={laundryCity} />}
                      </div>
                    </>
                  )}

                  {activeDeliveries !== undefined && (
                    <>
                      <SectionTitle icon={Shield} label="Workload Metrics" iconClass="bg-indigo-500/15 text-indigo-400" />
                      <div className="glass-card rounded-xl border border-white/8 px-4 py-1 divide-y divide-white/4">
                        <Row label="Active Deliveries" value={String(activeDeliveries)} />
                      </div>
                    </>
                  )}

                  <SectionTitle icon={Calendar} label="Timestamps" iconClass="bg-amber-500/15 text-amber-400" />
                  <div className="glass-card rounded-xl border border-white/8 px-4 py-1 divide-y divide-white/4">
                    <Row label="Joined At" value={formatDate(employee?.createdAt)} />
                    <Row label="Updated At" value={formatDate(employee?.updatedAt)} />
                  </div>
                </>
              )}
            </div>

            <div className="px-5 py-4 border-t border-white/8 flex-shrink-0">
              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-semibold text-textSecondary hover:text-textPrimary transition-all"
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
