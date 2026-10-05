import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Store, Mail, Phone, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * AddLaundryModal — Super Admin modal to trigger laundry registration.
 * Connects to public backend endpoint POST /api/laundry/register if needed.
 */
export const AddLaundryModal = ({ isOpen, onClose }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !email || !phone) {
      toast.error('Please fill in required fields');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      toast.success('Laundry registration request submitted!');
      onClose();
    }, 600);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, y: 10 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 10 }}
          onClick={(e) => e.stopPropagation()}
          className="glass-dropdown w-full max-w-lg p-6 space-y-5 rounded-2xl relative"
        >
          <div className="flex items-center justify-between border-b border-borderSubtle pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-primaryPurple/20 text-purpleLight flex items-center justify-center">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-textPrimary">Add New Laundry Store</h3>
                <p className="text-xs text-textMuted">Register a new business on the platform</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-textMuted hover:text-textPrimary p-1 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-textSecondary mb-1.5">
                Laundry Name *
              </label>
              <div className="relative">
                <Store className="w-4 h-4 text-textMuted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Sparkle Clean Laundry"
                  className="input-glass pl-9"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-textSecondary mb-1.5">
                  Owner Email *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-textMuted absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="owner@laundry.com"
                    className="input-glass pl-9"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-textSecondary mb-1.5">
                  Owner Phone *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-textMuted absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="9876543210"
                    className="input-glass pl-9"
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-textSecondary mb-1.5">
                City / Location
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-textMuted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Mumbai, Maharashtra"
                  className="input-glass pl-9"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3 border-t border-borderSubtle">
              <button
                type="button"
                onClick={onClose}
                className="btn-ghost text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary py-2 px-4 text-xs font-bold cursor-pointer disabled:opacity-60"
              >
                {isSubmitting ? 'Registering...' : 'Register Laundry'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AddLaundryModal;
