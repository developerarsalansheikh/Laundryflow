import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Store, Calendar, CheckCircle, Shield } from 'lucide-react';
import { UserRoleBadge } from './UserRoleBadge';
import { UserStatusBadge } from './UserStatusBadge';
import { useUserDetails } from '../../../hooks/useUsers';

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
 * UserDetailsDrawer — Side drawer for detailed user profile view.
 * Data source: GET /api/super-admin/users/:id
 * SAFE DATA ONLY — Never displays passwords, tokens, or OTPs.
 */
export const UserDetailsDrawer = ({ userId, user: initialUser, isOpen, onClose }) => {
  const drawerRef = useRef(null);

  const targetId = userId || initialUser?._id;
  const { data: fetchedUser, isLoading } = useUserDetails(isOpen ? targetId : null);

  const user = fetchedUser || initialUser;

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handle = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handle);
    return () => document.removeEventListener('keydown', handle);
  }, [isOpen, onClose]);

  // Trap scroll
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

  const name = user?.name || '—';
  const email = user?.email || '—';
  const phone = user?.phone || '—';
  const role = user?.role || 'user';
  const isActive = Boolean(user?.isActive);
  const isVerified = Boolean(user?.isVerified);
  const laundryName = user?.laundryId?.name || null;
  const laundryCity = user?.laundryId?.city || null;
  const laundryStatus = user?.laundryId?.status || null;
  const orderCount = user?.stats?.orderCount;
  const activeDeliveries = user?.stats?.activeDeliveries;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
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

          {/* Drawer Panel */}
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
            aria-label="User Details"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4 px-5 pt-5 pb-4 border-b border-[#E7E2D8] bg-[#FAF8F5] flex-shrink-0">
              <div>
                <p className="text-[10px] font-bold text-stone-500 font-oswald uppercase tracking-widest mb-1">
                  User Account
                </p>
                <h2 className="text-lg font-bold text-stone-900 font-oswald tracking-tight">{name}</h2>
                <p className="text-xs text-stone-500 font-mono mt-0.5">{email}</p>
              </div>
              <button
                onClick={onClose}
                id="user-drawer-close"
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 border border-[#DDD5C7] flex items-center justify-center text-stone-600 hover:text-stone-900 transition-all flex-shrink-0 mt-0.5 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-1">
              {isLoading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3">
                  <div className="w-8 h-8 rounded-full border-2 border-stone-300 border-t-stone-800 animate-spin" />
                  <p className="text-xs text-stone-500 font-erode">Loading user details...</p>
                </div>
              ) : (
                <>
                  {/* Status Badges */}
                  <div className="flex items-center gap-2 mb-2">
                    <UserRoleBadge role={role} />
                    <UserStatusBadge isActive={isActive} />
                    {isVerified && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle className="w-3 h-3" /> Verified
                      </span>
                    )}
                  </div>

                  {/* ── Contact Info ─── */}
                  <SectionTitle icon={User} label="Personal & Contact" iconClass="bg-stone-100 text-stone-700 border border-[#DDD5C7]" />
                  <div className="bg-white rounded-xl border border-[#E7E2D8] px-4 py-1 divide-y divide-[#E7E2D8] shadow-2xs">
                    <Row label="Full Name" value={name} />
                    <Row label="Email Address" value={email} mono />
                    <Row label="Phone Number" value={phone} mono />
                    <Row label="Account Role" value={role} />
                  </div>

                  {/* ── Laundry Assignment ─── */}
                  {laundryName && (
                    <>
                      <SectionTitle icon={Store} label="Assigned Laundry" iconClass="bg-stone-100 text-stone-700 border border-[#DDD5C7]" />
                      <div className="bg-white rounded-xl border border-[#E7E2D8] px-4 py-1 divide-y divide-[#E7E2D8] shadow-2xs">
                        <Row label="Laundry Name" value={laundryName} />
                        {laundryCity && <Row label="City" value={laundryCity} />}
                        {laundryStatus && <Row label="Laundry Status" value={laundryStatus} />}
                      </div>
                    </>
                  )}

                  {/* ── Activity Overview ─── */}
                  {(orderCount !== undefined || activeDeliveries !== undefined) && (
                    <>
                      <SectionTitle icon={Shield} label="Activity Summary" iconClass="bg-stone-100 text-stone-700 border border-[#DDD5C7]" />
                      <div className="bg-white rounded-xl border border-[#E7E2D8] px-4 py-1 divide-y divide-[#E7E2D8] shadow-2xs">
                        {orderCount !== undefined && <Row label="Total Orders Placed" value={String(orderCount)} />}
                        {activeDeliveries !== undefined && <Row label="Active Deliveries" value={String(activeDeliveries)} />}
                      </div>
                    </>
                  )}

                  {/* ── Dates ─── */}
                  <SectionTitle icon={Calendar} label="Account Timestamps" iconClass="bg-stone-100 text-stone-700 border border-[#DDD5C7]" />
                  <div className="bg-white rounded-xl border border-[#E7E2D8] px-4 py-1 divide-y divide-[#E7E2D8] shadow-2xs">
                    <Row label="Created At" value={formatDate(user?.createdAt)} />
                    <Row label="Last Updated" value={formatDate(user?.updatedAt)} />
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-[#E7E2D8] bg-[#FAF8F5] flex-shrink-0">
              <button
                onClick={onClose}
                className="btn-secondary w-full py-2.5 rounded-full font-oswald uppercase tracking-wider text-xs cursor-pointer shadow-2xs hover:bg-stone-100"
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

export default UserDetailsDrawer;
