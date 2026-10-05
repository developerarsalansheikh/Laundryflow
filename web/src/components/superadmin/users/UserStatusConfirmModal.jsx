import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserCheck, UserX, X } from 'lucide-react';

/**
 * UserStatusConfirmModal — Modal confirmation dialog for activate/deactivate user.
 */
export const UserStatusConfirmModal = ({
  user,
  isOpen,
  isLoading,
  onClose,
  onConfirm,
}) => {
  const modalRef = useRef(null);

  // Close on Escape
  useEffect(() => {
    if (!isOpen || isLoading) return;
    const handle = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handle);
    return () => document.removeEventListener('keydown', handle);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen || !user) return null;

  const isActive = Boolean(user.isActive);
  const actionText = isActive ? 'Deactivate' : 'Activate';
  const targetState = !isActive;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={!isLoading ? onClose : undefined}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-md glass-card rounded-2xl border border-white/10 p-6 shadow-2xl z-10"
            role="dialog"
            aria-modal="true"
            aria-labelledby="user-confirm-title"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              disabled={isLoading}
              className="absolute right-4 top-4 text-textMuted hover:text-textPrimary transition-colors disabled:opacity-40"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Icon & Title */}
            <div className="flex items-start gap-4 mb-4">
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 border ${
                  isActive
                    ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                    : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                }`}
              >
                {isActive ? <UserX className="w-5 h-5" /> : <UserCheck className="w-5 h-5" />}
              </div>

              <div>
                <h3 id="user-confirm-title" className="text-lg font-bold text-textPrimary">
                  {actionText} User Account?
                </h3>
                <p className="text-xs text-textMuted mt-0.5">
                  Target user: <span className="font-semibold text-textSecondary">{user.name}</span> ({user.email})
                </p>
              </div>
            </div>

            {/* Description */}
            <p className="text-xs text-textSecondary leading-relaxed mb-6 bg-white/4 p-3 rounded-xl border border-white/6">
              {isActive
                ? `Deactivating "${user.name}" will suspend their access to LaundryFlow. They will not be able to log in until reactivated.`
                : `Activating "${user.name}" will restore their full access to the LaundryFlow platform.`}
            </p>

            {/* Actions */}
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
                id="user-confirm-submit-btn"
                onClick={() => onConfirm(user._id, targetState)}
                disabled={isLoading}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white transition-all shadow-lg disabled:opacity-50 ${
                  isActive
                    ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30'
                    : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
                }`}
              >
                {isLoading ? (
                  <>
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    <span>Updating...</span>
                  </>
                ) : (
                  <span>Confirm {actionText}</span>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default UserStatusConfirmModal;
