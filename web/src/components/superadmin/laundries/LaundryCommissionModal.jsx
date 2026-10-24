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
          className="relative w-full max-w-md rounded-2xl bg-white border border-[#E7E2D8] shadow-2xl overflow-hidden z-10"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-[#E7E2D8] flex items-center justify-between bg-[#FAF8F5]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-stone-100 border border-[#DDD5C7] flex items-center justify-center text-stone-800">
                <Percent className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-stone-900 font-oswald uppercase tracking-wide">Edit Commission</h2>
                <p className="text-xs text-stone-500 truncate max-w-[200px] font-erode">{laundry.name}</p>
              </div>
            </div>

            <button
              onClick={onClose}
              disabled={isLoading}
              className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 border border-[#DDD5C7] flex items-center justify-center text-stone-600 hover:text-stone-900 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {apiError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{apiError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1 font-erode">
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
                  className={`w-full px-3.5 py-2.5 rounded-xl bg-white border text-sm font-mono text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900 transition-all shadow-2xs ${
                    error ? 'border-rose-500' : 'border-[#DDD5C7]'
                  }`}
                  placeholder="e.g. 10"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400 font-mono">
                  %
                </span>
              </div>
              {error && <p className="text-[11px] text-rose-600 mt-1 font-erode">{error}</p>}
              <p className="text-[11px] text-stone-500 mt-1.5 leading-relaxed font-erode">
                SuperAdmin commission percentage deducted on every order for this laundry.
              </p>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-[#E7E2D8] flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-2 rounded-full bg-stone-100 hover:bg-stone-200 text-xs font-semibold text-stone-700 border border-[#DDD5C7] transition-all cursor-pointer font-oswald uppercase tracking-wider"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary inline-flex items-center gap-2 px-5 py-2 rounded-full font-oswald uppercase tracking-wider text-xs shadow-2xs cursor-pointer disabled:opacity-50"
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
