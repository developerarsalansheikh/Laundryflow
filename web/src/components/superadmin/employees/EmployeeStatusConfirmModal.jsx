import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserCheck, UserX, X } from 'lucide-react';

/**
 * EmployeeStatusConfirmModal — Modal confirmation dialog for employee activation/deactivation.
 */
export const EmployeeStatusConfirmModal = ({
  employee,
  isOpen,
  isLoading,
  onClose,
  onConfirm,
}) => {
  const modalRef = useRef(null);

  useEffect(() => {
    if (!isOpen || isLoading) return;
    const handle = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handle);
    return () => document.removeEventListener('keydown', handle);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen || !employee) return null;

  const isActive = Boolean(employee.isActive);
  const actionText = isActive ? 'Deactivate' : 'Activate';
  const targetState = !isActive;

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
            ref={modalRef}
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-md glass-card rounded-2xl border border-white/10 p-6 shadow-2xl z-10"
            role="dialog"
            aria-modal="true"
            aria-labelledby="emp-confirm-title"
          >
            <button
              onClick={onClose}
              disabled={isLoading}
              className="absolute right-4 top-4 text-textMuted hover:text-textPrimary transition-colors disabled:opacity-40"
            >
              <X className="w-4 h-4" />
            </button>

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
                <h3 id="emp-confirm-title" className="text-lg font-bold text-textPrimary">
                  {actionText} Employee Account?
                </h3>
                <p className="text-xs text-textMuted mt-0.5">
                  Employee: <span className="font-semibold text-textSecondary">{employee.name}</span>
                </p>
              </div>
            </div>

            <p className="text-xs text-textSecondary leading-relaxed mb-6 bg-white/4 p-3 rounded-xl border border-white/6">
              {isActive
                ? `Deactivating "${employee.name}" will suspend their access to LaundryFlow tasks.`
                : `Activating "${employee.name}" will restore their account access.`}
            </p>

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
                id="emp-confirm-submit-btn"
                onClick={() => onConfirm(employee._id, targetState)}
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

export default EmployeeStatusConfirmModal;
