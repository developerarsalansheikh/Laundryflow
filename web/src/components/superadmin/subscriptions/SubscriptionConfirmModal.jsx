import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, CheckCircle2, XCircle, RotateCw, Trash2, X } from 'lucide-react';

/**
 * SubscriptionConfirmModal — Generic confirm dialog for subscription & plan actions.
 * Types: 'delete-plan' | 'activate' | 'cancel' | 'renew'
 */
export const SubscriptionConfirmModal = ({
  type,
  item,
  isOpen,
  isLoading,
  onClose,
  onConfirm,
}) => {
  const [cancelReason, setCancelReason] = useState('');
  const [newEndDate, setNewEndDate] = useState('');

  useEffect(() => {
    setCancelReason('');
    setNewEndDate('');
  }, [isOpen, item]);

  if (!isOpen || !item) return null;

  const handleConfirm = () => {
    if (type === 'cancel') {
      onConfirm({ cancelReason });
    } else if (type === 'renew') {
      onConfirm({ newEndDate: newEndDate || undefined });
    } else {
      onConfirm();
    }
  };

  const getTitleAndIcon = () => {
    switch (type) {
      case 'delete-plan':
        return {
          title: 'Delete Subscription Plan',
          subtitle: `Are you sure you want to delete "${item.name}"?`,
          icon: Trash2,
          iconClass: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
          btnClass: 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30',
          btnText: 'Delete Plan',
        };
      case 'activate':
        return {
          title: 'Activate Subscription',
          subtitle: `Activate subscription for "${item.laundry?.name || 'Laundry'}"?`,
          icon: CheckCircle2,
          iconClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
          btnClass: 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30',
          btnText: 'Activate',
        };
      case 'cancel':
        return {
          title: 'Cancel Subscription',
          subtitle: `Cancel subscription for "${item.laundry?.name || 'Laundry'}"?`,
          icon: XCircle,
          iconClass: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
          btnClass: 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30',
          btnText: 'Confirm Cancel',
        };
      case 'renew':
        return {
          title: 'Renew Subscription',
          subtitle: `Renew / extend subscription for "${item.laundry?.name || 'Laundry'}"?`,
          icon: RotateCw,
          iconClass: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
          btnClass: 'bg-purple-600 hover:bg-purple-500 shadow-purple-600/30',
          btnText: 'Renew Subscription',
        };
      default:
        return {
          title: 'Confirm Action',
          subtitle: 'Are you sure?',
          icon: AlertTriangle,
          iconClass: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
          btnClass: 'bg-purple-600 hover:bg-purple-500',
          btnText: 'Confirm',
        };
    }
  };

  const { title, subtitle, icon: Icon, iconClass, btnClass, btnText } = getTitleAndIcon();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={!isLoading ? onClose : undefined}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-md glass-card rounded-2xl border border-white/10 p-6 shadow-2xl z-10"
            role="dialog"
            aria-modal="true"
          >
            <button
              onClick={onClose}
              disabled={isLoading}
              className="absolute right-4 top-4 text-textMuted hover:text-textPrimary transition-colors disabled:opacity-40"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-start gap-4 mb-4">
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 border ${iconClass}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-textPrimary">{title}</h3>
                <p className="text-xs text-textMuted mt-0.5">{subtitle}</p>
              </div>
            </div>

            {/* Extra inputs based on type */}
            {type === 'cancel' && (
              <div className="mb-5">
                <label htmlFor="cancel-reason" className="block text-xs font-semibold text-textMuted mb-1">
                  Cancellation Reason (Optional)
                </label>
                <textarea
                  id="cancel-reason"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Reason for cancelling subscription..."
                  rows={2}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-textPrimary placeholder:text-textMuted focus:outline-none focus:ring-1 focus:ring-purple-500/50 resize-none"
                />
              </div>
            )}

            {type === 'renew' && (
              <div className="mb-5">
                <label htmlFor="renew-date" className="block text-xs font-semibold text-textMuted mb-1">
                  New End Date (Optional — leaves automatic cycle calculation if blank)
                </label>
                <input
                  type="date"
                  id="renew-date"
                  value={newEndDate}
                  onChange={(e) => setNewEndDate(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-textPrimary focus:outline-none focus:ring-1 focus:ring-purple-500/50"
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-textSecondary hover:text-textPrimary transition-all disabled:opacity-40"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirm}
                disabled={isLoading}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white transition-all shadow-lg disabled:opacity-50 ${btnClass}`}
              >
                {isLoading ? (
                  <>
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>{btnText}</span>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default SubscriptionConfirmModal;
