import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, CheckCircle2, XCircle, Ban, X, Loader2 } from 'lucide-react';

/**
 * LaundryActionConfirmModal Component
 * Confirmation modal for Approve, Reject, and Suspend operations.
 */
export const LaundryActionConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  actionType = 'approve', // 'approve' | 'reject' | 'suspend'
  laundry,
  isLoading = false,
}) => {
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    if (isOpen) {
      setRejectReason('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !laundry) return null;

  const getConfig = () => {
    switch (actionType) {
      case 'approve': {
        const isSuspended = laundry.status === 'suspended';
        return {
          title: isSuspended ? 'Activate / Unsuspend Laundry' : 'Approve Laundry',
          description: isSuspended
            ? `Are you sure you want to reactivate "${laundry.name}"? This will set the status to active and re-enable owner access.`
            : `Are you sure you want to approve "${laundry.name}"? This will activate the laundry on the platform and enable the owner account.`,
          icon: CheckCircle2,
          iconStyle: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
          btnStyle: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30',
          confirmText: isSuspended ? 'Activate Laundry' : 'Approve Laundry',
        };
      }
      case 'reject':
        return {
          title: 'Reject Laundry Request',
          description: `Are you sure you want to reject "${laundry.name}"? The registration request will be marked as rejected.`,
          icon: XCircle,
          iconStyle: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
          btnStyle: 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30',
          confirmText: 'Reject Laundry',
          hasReasonInput: true,
        };
      case 'suspend':
        return {
          title: 'Suspend Laundry',
          description: `Are you sure you want to suspend "${laundry.name}"? This will temporarily deactivate the laundry and disable owner access to the platform.`,
          icon: Ban,
          iconStyle: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
          btnStyle: 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30',
          confirmText: 'Suspend Laundry',
        };
      default:
        return {
          title: 'Confirm Action',
          description: 'Are you sure you want to proceed with this action?',
          icon: AlertTriangle,
          iconStyle: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
          btnStyle: 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/30',
          confirmText: 'Confirm',
        };
    }
  };

  const config = getConfig();
  const Icon = config.icon;

  const handleConfirmClick = () => {
    if (actionType === 'reject') {
      onConfirm({ id: laundry._id, reason: rejectReason.trim() || 'Rejected by superadmin' });
    } else {
      onConfirm(laundry._id);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/75 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-md rounded-2xl bg-[#090D1E] border border-white/12 shadow-2xl overflow-hidden z-10 p-6 space-y-4"
        >
          <div className="flex items-start justify-between">
            <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center ${config.iconStyle}`}>
              <Icon className="w-5 h-5" />
            </div>

            <button
              onClick={onClose}
              disabled={isLoading}
              className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-textMuted hover:text-textPrimary transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div>
            <h3 className="text-lg font-bold text-textPrimary">{config.title}</h3>
            <p className="text-xs text-textMuted mt-1 leading-relaxed">{config.description}</p>
          </div>

          {/* Optional reason input for reject */}
          {config.hasReasonInput && (
            <div>
              <label className="block text-xs font-medium text-textSecondary mb-1">
                Rejection Reason (Optional)
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Incomplete verification documents provided"
                rows={2}
                className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-textPrimary placeholder:text-textMuted focus:outline-none focus:border-rose-500/50"
              />
            </div>
          )}

          {/* Actions */}
          <div className="pt-3 border-t border-white/8 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-textSecondary border border-white/10 transition-all cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleConfirmClick}
              disabled={isLoading}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs shadow-lg transition-all cursor-pointer disabled:opacity-50 ${config.btnStyle}`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <span>{config.confirmText}</span>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default LaundryActionConfirmModal;
