import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CreditCard, ShoppingBag, User, Store, Calendar, Percent, ShieldCheck } from 'lucide-react';
import { PaymentStatusBadge } from './PaymentStatusBadge';
import { usePaymentDetails } from '../../../hooks/usePayments';
import { formatIndianCurrency } from '../../../utils/formatters';

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
 * PaymentDetailsDrawer — Slide-over drawer displaying safe payment transaction details.
 */
export const PaymentDetailsDrawer = ({ paymentId, payment: initialPayment, isOpen, onClose }) => {
  const targetId = paymentId || initialPayment?._id;
  const { data: fetchedData, isLoading } = usePaymentDetails(isOpen ? targetId : null);

  const payment = fetchedData?.data || initialPayment;

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

  const txId = payment?.razorpayPaymentId || (payment?._id ? `#${payment._id}` : '—');
  const amount = formatIndianCurrency(payment?.amount);
  const commission = payment?.commissionAmount != null ? formatIndianCurrency(payment.commissionAmount) : '—';
  const laundryEarning = payment?.laundryEarning != null ? formatIndianCurrency(payment.laundryEarning) : '—';
  const method = payment?.method ? String(payment.method).toUpperCase() : '—';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="pay-drawer-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />

          <motion.div
            key="pay-drawer-panel"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
            className="fixed right-0 top-0 h-full w-full max-w-[440px] bg-[#0d1526] border-l border-white/10 shadow-2xl z-50 flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-label="Payment Transaction Details"
          >
            {/* Drawer Header */}
            <div className="flex items-start justify-between gap-4 px-5 pt-5 pb-4 border-b border-white/8 flex-shrink-0">
              <div>
                <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-1">
                  Payment Transaction
                </p>
                <h2 className="text-base font-bold font-mono text-textPrimary">{txId}</h2>
                <p className="text-xs text-textMuted mt-0.5">{amount}</p>
              </div>
              <button
                onClick={onClose}
                id="pay-drawer-close"
                className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 border border-white/8 flex items-center justify-center text-textMuted hover:text-textPrimary transition-all flex-shrink-0 mt-0.5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-1">
              {isLoading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3">
                  <div className="w-8 h-8 rounded-full border-2 border-emerald-500/30 border-t-emerald-400 animate-spin" />
                  <p className="text-xs text-textMuted">Loading payment details...</p>
                </div>
              ) : (
                <>
                  {/* Status badge */}
                  <div className="mb-2">
                    <PaymentStatusBadge status={payment?.status} />
                  </div>

                  <SectionTitle icon={CreditCard} label="Payment Info" iconClass="bg-emerald-500/15 text-emerald-400" />
                  <div className="glass-card rounded-xl border border-white/8 px-4 py-1 divide-y divide-white/4">
                    <Row label="Amount" value={amount} />
                    <Row label="Payment Method" value={method} />
                    <Row label="Currency" value={payment?.currency || 'INR'} />
                    {payment?.razorpayOrderId && <Row label="Razorpay Order ID" value={payment.razorpayOrderId} mono />}
                    {payment?.razorpayPaymentId && <Row label="Razorpay Payment ID" value={payment.razorpayPaymentId} mono />}
                  </div>

                  <SectionTitle icon={Percent} label="Financial Breakdown" iconClass="bg-indigo-500/15 text-indigo-400" />
                  <div className="glass-card rounded-xl border border-white/8 px-4 py-1 divide-y divide-white/4">
                    <Row label="Commission Rate" value={payment?.commissionPercent != null ? `${payment.commissionPercent}%` : null} />
                    <Row label="Platform Commission" value={commission} />
                    <Row label="Laundry Earning" value={laundryEarning} />
                  </div>

                  {payment?.user && (
                    <>
                      <SectionTitle icon={User} label="Customer Info" iconClass="bg-purple-500/15 text-purple-400" />
                      <div className="glass-card rounded-xl border border-white/8 px-4 py-1 divide-y divide-white/4">
                        <Row label="Name" value={payment.user.name || '—'} />
                        <Row label="Email" value={payment.user.email || '—'} mono />
                        <Row label="Phone" value={payment.user.phone || '—'} mono />
                      </div>
                    </>
                  )}

                  {payment?.laundryId && (
                    <>
                      <SectionTitle icon={Store} label="Laundry Business" iconClass="bg-blue-500/15 text-blue-400" />
                      <div className="glass-card rounded-xl border border-white/8 px-4 py-1 divide-y divide-white/4">
                        <Row label="Laundry Name" value={payment.laundryId.name || '—'} />
                        <Row label="City" value={payment.laundryId.city || '—'} />
                        <Row label="Phone" value={payment.laundryId.phone || '—'} mono />
                      </div>
                    </>
                  )}

                  {payment?.order && (
                    <>
                      <SectionTitle icon={ShoppingBag} label="Associated Order" iconClass="bg-amber-500/15 text-amber-400" />
                      <div className="glass-card rounded-xl border border-white/8 px-4 py-1 divide-y divide-white/4">
                        <Row label="Order ID" value={payment.order._id ? `#${payment.order._id}` : '—'} mono />
                        <Row label="Order Status" value={payment.order.status || '—'} />
                        <Row label="Order Amount" value={payment.order.totalAmount != null ? formatIndianCurrency(payment.order.totalAmount) : '—'} />
                      </div>
                    </>
                  )}

                  {payment?.refundStatus && payment.refundStatus !== 'none' && (
                    <>
                      <SectionTitle icon={ShieldCheck} label="Refund Details" iconClass="bg-rose-500/15 text-rose-400" />
                      <div className="glass-card rounded-xl border border-white/8 px-4 py-1 divide-y divide-white/4">
                        <Row label="Refund Status" value={payment.refundStatus} />
                        <Row label="Refund ID" value={payment.refundId || '—'} mono />
                        <Row label="Refund Amount" value={payment.refundAmount != null ? formatIndianCurrency(payment.refundAmount) : '—'} />
                        <Row label="Refunded At" value={formatDate(payment.refundedAt)} />
                      </div>
                    </>
                  )}

                  <SectionTitle icon={Calendar} label="Timestamps" iconClass="bg-slate-500/15 text-slate-400" />
                  <div className="glass-card rounded-xl border border-white/8 px-4 py-1 divide-y divide-white/4">
                    <Row label="Created At" value={formatDate(payment?.createdAt)} />
                    <Row label="Updated At" value={formatDate(payment?.updatedAt)} />
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-white/8 flex-shrink-0">
              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-textSecondary hover:text-textPrimary transition-all"
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

export default PaymentDetailsDrawer;
