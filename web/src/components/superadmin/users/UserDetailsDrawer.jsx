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
            className="fixed right-0 top-0 h-full w-full max-w-[440px] bg-[#0d1526] border-l border-white/10 shadow-2xl z-50 flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-label="User Details"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4 px-5 pt-5 pb-4 border-b border-white/8 flex-shrink-0">
              <div>
                <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">
                  User Account
                </p>
                <h2 className="text-lg font-bold text-textPrimary">{name}</h2>
                <p className="text-xs text-textMuted font-mono mt-0.5">{email}</p>
              </div>
              <button
                onClick={onClose}
                id="user-drawer-close"
                className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 border border-white/8 flex items-center justify-center text-textMuted hover:text-textPrimary transition-all flex-shrink-0 mt-0.5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-1">
              {isLoading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3">
                  <div className="w-8 h-8 rounded-full border-2 border-indigo-500/30 border-t-indigo-400 animate-spin" />
                  <p className="text-xs text-textMuted">Loading user details...</p>
                </div>
              ) : (
                <>
                  {/* Status Badges */}
                  <div className="flex items-center gap-2 mb-2">
                    <UserRoleBadge role={role} />
                    <UserStatusBadge isActive={isActive} />
                    {isVerified && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <CheckCircle className="w-3 h-3" /> Verified
                      </span>
                    )}
                  </div>

                  {/* ── Contact Info ─── */}
                  <SectionTitle icon={User} label="Personal & Contact" iconClass="bg-indigo-500/15 text-indigo-400" />
                  <div className="glass-card rounded-xl border border-white/8 px-4 py-1 divide-y divide-white/4">
                    <Row label="Full Name" value={name} />
                    <Row label="Email Address" value={email} mono />
                    <Row label="Phone Number" value={phone} mono />
                    <Row label="Account Role" value={role} />
                  </div>

                  {/* ── Laundry Assignment ─── */}
                  {laundryName && (
                    <>
                      <SectionTitle icon={Store} label="Assigned Laundry" iconClass="bg-purple-500/15 text-purple-400" />
                      <div className="glass-card rounded-xl border border-white/8 px-4 py-1 divide-y divide-white/4">
                        <Row label="Laundry Name" value={laundryName} />
                        {laundryCity && <Row label="City" value={laundryCity} />}
                        {laundryStatus && <Row label="Laundry Status" value={laundryStatus} />}
                      </div>
                    </>
                  )}

                  {/* ── Activity Overview ─── */}
                  {(orderCount !== undefined || activeDeliveries !== undefined) && (
                    <>
                      <SectionTitle icon={Shield} label="Activity Summary" iconClass="bg-blue-500/15 text-blue-400" />
                      <div className="glass-card rounded-xl border border-white/8 px-4 py-1 divide-y divide-white/4">
                        {orderCount !== undefined && <Row label="Total Orders Placed" value={String(orderCount)} />}
                        {activeDeliveries !== undefined && <Row label="Active Deliveries" value={String(activeDeliveries)} />}
                      </div>
                    </>
                  )}

                  {/* ── Dates ─── */}
                  <SectionTitle icon={Calendar} label="Account Timestamps" iconClass="bg-amber-500/15 text-amber-400" />
                  <div className="glass-card rounded-xl border border-white/8 px-4 py-1 divide-y divide-white/4">
                    <Row label="Created At" value={formatDate(user?.createdAt)} />
                    <Row label="Last Updated" value={formatDate(user?.updatedAt)} />
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
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

export default UserDetailsDrawer;
