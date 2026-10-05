import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Percent, AlertCircle, Loader2 } from 'lucide-react';

/**
 * LaundryCommissionModal Component
 * Modal for editing commission percentage for a laundry business.
 */
export const LaundryCommissionModal = ({
  isOpen,
  onClose,
  onSubmit,
  laundry,
  isLoading = false,
  apiError = null,
}) => {
  const [commission, setCommission] = useState(10);
  const [error, setError] = useState('');

  useEffect(() => {
    if (laundry) {
      setCommission(laundry.commissionPercent !== undefined ? laundry.commissionPercent : 10);
      setError('');
    }
  }, [laundry, isOpen]);

  // Escape key listener
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

  const handleSubmit = (e) => {
    e.preventDefault();
    const val = Number(commission);
    if (isNaN(val) || val < 0 || val > 100) {
      setError('Commission must be between 0% and 100%');
      return;
    }
    setError('');
    onSubmit({ id: laundry._id, commissionPercent: val });
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
          className="relative w-full max-w-md rounded-2xl bg-[#090D1E] border border-white/12 shadow-2xl overflow-hidden z-10"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-white/8 flex items-center justify-between bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <Percent className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-textPrimary">Edit Commission</h2>
                <p className="text-xs text-textMuted truncate max-w-[200px]">{laundry.name}</p>
              </div>
            </div>

            <button
              onClick={onClose}
              disabled={isLoading}
              className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-textMuted hover:text-textPrimary transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {apiError && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{apiError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-textSecondary mb-1">
                Commission Rate (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={commission}
                  onChange={(e) => {
                    setCommission(e.target.value);
                    if (error) setError('');
                  }}
                  className={`w-full px-3.5 py-2.5 rounded-xl bg-white/5 border text-sm font-mono text-purple-300 placeholder:text-textMuted focus:outline-none transition-all ${
                    error ? 'border-rose-500' : 'border-white/10 focus:border-purple-500/50'
                  }`}
                  placeholder="e.g. 10"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-textMuted font-mono">
                  %
                </span>
              </div>
              {error && <p className="text-[11px] text-rose-400 mt-1">{error}</p>}
              <p className="text-[11px] text-textMuted mt-1.5 leading-relaxed">
                SuperAdmin commission percentage deducted on every order for this laundry.
              </p>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-white/8 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-textSecondary border border-white/10 transition-all cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs shadow-lg shadow-purple-600/30 transition-all cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Update Commission</span>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default LaundryCommissionModal;
