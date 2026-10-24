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
            className="relative w-full max-w-md bg-white rounded-2xl border border-[#E7E2D8] p-6 shadow-2xl z-10"
            role="dialog"
            aria-modal="true"
            aria-labelledby="user-confirm-title"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              disabled={isLoading}
              className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 border border-[#DDD5C7] flex items-center justify-center text-stone-600 hover:text-stone-900 transition-all absolute right-4 top-4 cursor-pointer disabled:opacity-40"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Icon & Title */}
            <div className="flex items-start gap-4 mb-4">
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 border ${
                  isActive
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}
              >
                {isActive ? <UserX className="w-5 h-5" /> : <UserCheck className="w-5 h-5" />}
              </div>

              <div>
                <h3 id="user-confirm-title" className="text-lg font-bold text-stone-900 font-oswald uppercase tracking-wide">
                  {actionText} User Account?
                </h3>
                <p className="text-xs text-stone-500 mt-0.5 font-erode">
                  Target user: <span className="font-semibold text-stone-900">{user.name}</span> ({user.email})
                </p>
              </div>
            </div>

            {/* Description */}
            <p className="text-xs text-stone-600 leading-relaxed mb-6 bg-[#FAF8F5] p-3 rounded-xl border border-[#E7E2D8] font-erode">
              {isActive
                ? `Deactivating "${user.name}" will suspend their access to LaundryWave. They will not be able to log in until reactivated.`
                : `Activating "${user.name}" will restore their full access to the LaundryWave platform.`}
            </p>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-2.5 rounded-full bg-stone-100 hover:bg-stone-200 border border-[#DDD5C7] text-xs font-semibold text-stone-700 transition-all disabled:opacity-40 font-oswald uppercase tracking-wider cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                id="user-confirm-submit-btn"
                onClick={() => onConfirm(user._id, targetState)}
                disabled={isLoading}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold text-white transition-all shadow-2xs font-oswald uppercase tracking-wider cursor-pointer disabled:opacity-50 ${
                  isActive
                    ? 'bg-rose-600 hover:bg-rose-500'
                    : 'bg-emerald-600 hover:bg-emerald-500'
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
