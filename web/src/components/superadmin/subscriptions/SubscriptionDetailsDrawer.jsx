import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Store, Calendar, CreditCard, AlertCircle, RotateCw, CheckCircle2, XCircle } from 'lucide-react';
import { SubscriptionStatusBadge } from './SubscriptionStatusBadge';
import { useSubscriptionDetails } from '../../../hooks/useSubscriptions';

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

const fmtCurrency = (amount, currency = 'INR') =>
  amount != null
    ? new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount)
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
 * SubscriptionDetailsDrawer — Drawer displaying real subscription details.
 */
export const SubscriptionDetailsDrawer = ({
  subscriptionId,
  subscription: initialSub,
  isOpen,
  onClose,
  onActivate,
  onCancel,
  onRenew,
}) => {
  const targetId = subscriptionId || initialSub?._id;
  const { data: fetchedData, isLoading } = useSubscriptionDetails(isOpen ? targetId : null);

  const sub = fetchedData?.data || initialSub;

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

  const laundryName = sub?.laundry?.name || '—';
  const city = sub?.laundry?.city || '—';
  const ownerName = sub?.laundry?.owner?.name || '—';
  const ownerEmail = sub?.laundry?.owner?.email || '—';
  const ownerPhone = sub?.laundry?.owner?.phone || '—';

  const planName = sub?.plan?.name || '—';
  const billingCycle = sub?.plan?.billingCycle || '—';
  const price = fmtCurrency(sub?.price, sub?.currency);

  const canActivate = sub?.status === 'trial' || sub?.status === 'past_due';
  const canCancel = sub?.status === 'trial' || sub?.status === 'active' || sub?.status === 'past_due';
  const canRenew = sub?.status === 'active' || sub?.status === 'past_due' || sub?.status === 'expired';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="sub-drawer-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />

          <motion.div
            key="sub-drawer-panel"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
            className="fixed right-0 top-0 h-full w-full max-w-[440px] bg-white border-l border-[#E7E2D8] shadow-2xl z-50 flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-label="Subscription Details"
          >
            {/* Drawer Header */}
            <div className="flex items-start justify-between gap-4 px-5 pt-5 pb-4 border-b border-[#E7E2D8] bg-[#FAF8F5] flex-shrink-0">
              <div>
                <p className="text-[10px] font-bold text-stone-500 font-oswald uppercase tracking-widest mb-1">
                  Subscription Record
                </p>
                <h2 className="text-lg font-bold text-stone-900 font-oswald tracking-tight">{laundryName}</h2>
                <p className="text-xs text-stone-500 mt-0.5 font-erode">{city}</p>
              </div>
              <button
                onClick={onClose}
                id="sub-drawer-close"
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
                  <p className="text-xs text-stone-500 font-erode">Loading subscription details...</p>
                </div>
              ) : (
                <>
                  {/* Status badge */}
                  <div className="mb-2">
                    <SubscriptionStatusBadge status={sub?.status} />
                  </div>

                  <SectionTitle icon={CreditCard} label="Plan Details" iconClass="bg-stone-100 text-stone-700 border border-[#DDD5C7]" />
                  <div className="bg-white rounded-xl border border-[#E7E2D8] px-4 py-1 divide-y divide-[#E7E2D8] shadow-2xs">
                    <Row label="Plan Name" value={planName} />
                    <Row label="Billing Cycle" value={billingCycle} />
                    <Row label="Price" value={price} />
                    <Row label="Auto Renew" value={sub?.autoRenew ? 'Yes' : 'No'} />
                  </div>

                  <SectionTitle icon={Store} label="Laundry & Owner" iconClass="bg-stone-100 text-stone-700 border border-[#DDD5C7]" />
                  <div className="bg-white rounded-xl border border-[#E7E2D8] px-4 py-1 divide-y divide-[#E7E2D8] shadow-2xs">
                    <Row label="Laundry Name" value={laundryName} />
                    <Row label="City" value={city} />
                    <Row label="Owner Name" value={ownerName} />
                    <Row label="Owner Email" value={ownerEmail} mono />
                    <Row label="Owner Phone" value={ownerPhone} mono />
                  </div>

                  <SectionTitle icon={Calendar} label="Validity Period" iconClass="bg-stone-100 text-stone-700 border border-[#DDD5C7]" />
                  <div className="bg-white rounded-xl border border-[#E7E2D8] px-4 py-1 divide-y divide-[#E7E2D8] shadow-2xs">
                    <Row label="Start Date" value={formatDate(sub?.startDate)} />
                    <Row label="End Date" value={formatDate(sub?.endDate)} />
                    {sub?.trialStartDate && <Row label="Trial Start" value={formatDate(sub?.trialStartDate)} />}
                    {sub?.trialEndDate && <Row label="Trial End" value={formatDate(sub?.trialEndDate)} />}
                  </div>

                  {sub?.cancelledAt && (
                    <>
                      <SectionTitle icon={AlertCircle} label="Cancellation Details" iconClass="bg-rose-50 text-rose-700 border border-rose-200" />
                      <div className="bg-white rounded-xl border border-[#E7E2D8] px-4 py-1 divide-y divide-[#E7E2D8] shadow-2xs">
                        <Row label="Cancelled At" value={formatDate(sub?.cancelledAt)} />
                        {sub?.cancelReason && <Row label="Reason" value={sub?.cancelReason} />}
                      </div>
                    </>
                  )}

                  <SectionTitle icon={Calendar} label="Timestamps" iconClass="bg-stone-100 text-stone-700 border border-[#DDD5C7]" />
                  <div className="bg-white rounded-xl border border-[#E7E2D8] px-4 py-1 divide-y divide-[#E7E2D8] shadow-2xs">
                    <Row label="Created At" value={formatDate(sub?.createdAt)} />
                    <Row label="Updated At" value={formatDate(sub?.updatedAt)} />
                  </div>
                </>
              )}
            </div>

            {/* Footer with action buttons */}
            <div className="px-5 py-4 border-t border-[#E7E2D8] bg-[#FAF8F5] flex items-center gap-2 flex-shrink-0">
              {canActivate && onActivate && (
                <button
                  onClick={() => { onClose(); onActivate(sub); }}
                  className="flex-1 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white flex items-center justify-center gap-1.5 transition-all font-oswald uppercase tracking-wider cursor-pointer shadow-2xs"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Activate
                </button>
              )}
              {canRenew && onRenew && (
                <button
                  onClick={() => { onClose(); onRenew(sub); }}
                  className="btn-primary flex-1 py-2.5 rounded-full text-xs font-semibold flex items-center justify-center gap-1.5 transition-all font-oswald uppercase tracking-wider cursor-pointer shadow-2xs"
                >
                  <RotateCw className="w-3.5 h-3.5" /> Renew
                </button>
              )}
              {canCancel && onCancel && (
                <button
                  onClick={() => { onClose(); onCancel(sub); }}
                  className="py-2.5 px-4 rounded-full bg-rose-50 hover:bg-rose-100 border border-rose-200 text-xs font-semibold text-rose-700 flex items-center justify-center gap-1.5 transition-all font-oswald uppercase tracking-wider cursor-pointer"
                >
                  <XCircle className="w-3.5 h-3.5" /> Cancel
                </button>
              )}
              <button
                onClick={onClose}
                className="btn-secondary py-2.5 px-4 rounded-full text-xs font-semibold transition-all font-oswald uppercase tracking-wider cursor-pointer shadow-2xs hover:bg-stone-100"
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

export default SubscriptionDetailsDrawer;
