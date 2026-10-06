import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Truck, User, Lock, Phone, Mail, Store, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import { useLaundries } from '../../../hooks/useLaundries';

const INITIAL_FORM = {
  name: '',
  phone: '',
  email: '',
  password: '',
  vehicleType: 'bike',
  vehicleNumber: '',
  laundryId: '',
  isActive: true,
};

export const CreateDeliveryPartnerModal = ({ isOpen, onClose, onSubmit, isLoading = false, apiError = null }) => {
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  // Load available active laundries for assignment dropdown
  const { data: laundriesResponse, isLoading: laundriesLoading } = useLaundries({ limit: 100 });
  const laundries = laundriesResponse?.data || [];

  useEffect(() => {
    if (isOpen) {
      setFormData(INITIAL_FORM);
      setErrors({});
      setShowPassword(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Full Name is required.';
    if (!formData.phone.trim()) {
      errs.phone = 'Mobile number is required.';
    } else if (!/^\d{10}$/.test(formData.phone.trim())) {
      errs.phone = 'Enter a valid 10-digit mobile number.';
    }

    if (!formData.email.trim()) {
      errs.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errs.email = 'Enter a valid email address.';
    }

    if (!formData.password) {
      errs.password = 'Password is required.';
    } else if (formData.password.length < 6) {
      errs.password = 'Password must be at least 6 characters.';
    }

    if (!formData.laundryId) {
      errs.laundryId = 'Please assign a laundry store.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim().toLowerCase(),
      password: formData.password,
      vehicleType: formData.vehicleType,
      vehicleNumber: formData.vehicleNumber.trim().toUpperCase(),
      laundryId: formData.laundryId,
      isActive: formData.isActive,
    });
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-lg glass-card rounded-2xl border border-white/10 p-6 shadow-2xl z-10 max-h-[92vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/8 mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-textPrimary">Create Delivery Agent</h2>
                <p className="text-xs text-textSecondary">Onboard a verified platform delivery partner</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-textMuted hover:text-textPrimary hover:bg-white/5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* API Error Alert */}
          {apiError && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center gap-2 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{apiError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-medium text-textSecondary mb-1">
                Full Name <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 w-4 h-4 text-textMuted" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Rahul Sharma"
                  className={`input-glass pl-9 w-full ${errors.name ? 'border-rose-500/50' : ''}`}
                />
              </div>
              {errors.name && <p className="text-[11px] text-rose-400 mt-1">{errors.name}</p>}
            </div>

            {/* Phone & Email Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-textSecondary mb-1">
                  Mobile Number <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 w-4 h-4 text-textMuted" />
                  <input
                    type="tel"
                    name="phone"
                    maxLength={10}
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="10-digit number"
                    className={`input-glass pl-9 w-full ${errors.phone ? 'border-rose-500/50' : ''}`}
                  />
                </div>
                {errors.phone && <p className="text-[11px] text-rose-400 mt-1">{errors.phone}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-textSecondary mb-1">
                  Email Address <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-textMuted" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="agent@laundryflow.com"
                    className={`input-glass pl-9 w-full ${errors.email ? 'border-rose-500/50' : ''}`}
                  />
                </div>
                {errors.email && <p className="text-[11px] text-rose-400 mt-1">{errors.email}</p>}
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-textSecondary mb-1">
                Password <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 w-4 h-4 text-textMuted" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Minimum 6 characters"
                  className={`input-glass pl-9 pr-10 w-full ${errors.password ? 'border-rose-500/50' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-textMuted hover:text-textPrimary"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-[11px] text-rose-400 mt-1">{errors.password}</p>}
            </div>

            {/* Assigned Laundry Store */}
            <div>
              <label className="block text-xs font-medium text-textSecondary mb-1">
                Assigned Laundry Store <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <Store className="absolute left-3 top-2.5 w-4 h-4 text-textMuted pointer-events-none" />
                <select
                  name="laundryId"
                  value={formData.laundryId}
                  onChange={handleChange}
                  disabled={laundriesLoading}
                  className={`input-glass pl-9 w-full appearance-none ${errors.laundryId ? 'border-rose-500/50' : ''}`}
                >
                  <option value="" className="bg-slate-900 text-slate-300">
                    {laundriesLoading ? 'Loading stores...' : 'Select a laundry store'}
                  </option>
                  {laundries.map((l) => (
                    <option key={l._id} value={l._id} className="bg-slate-900 text-slate-100">
                      {l.name} — {l.city} ({l.status})
                    </option>
                  ))}
                </select>
              </div>
              {errors.laundryId && <p className="text-[11px] text-rose-400 mt-1">{errors.laundryId}</p>}
            </div>

            {/* Vehicle Type & Vehicle Number Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-textSecondary mb-1">Vehicle Type</label>
                <select
                  name="vehicleType"
                  value={formData.vehicleType}
                  onChange={handleChange}
                  className="input-glass w-full"
                >
                  <option value="bike" className="bg-slate-900 text-slate-100">Motorcycle / Bike</option>
                  <option value="scooter" className="bg-slate-900 text-slate-100">Scooter</option>
                  <option value="bicycle" className="bg-slate-900 text-slate-100">Bicycle</option>
                  <option value="van" className="bg-slate-900 text-slate-100">Delivery Van</option>
                  <option value="other" className="bg-slate-900 text-slate-100">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-textSecondary mb-1">Vehicle Number</label>
                <input
                  type="text"
                  name="vehicleNumber"
                  value={formData.vehicleNumber}
                  onChange={handleChange}
                  placeholder="e.g. MH02AB1234"
                  className="input-glass w-full uppercase"
                />
              </div>
            </div>

            {/* Active Status Toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/8 mt-2">
              <div>
                <p className="text-xs font-semibold text-textPrimary">Account Status</p>
                <p className="text-[11px] text-textMuted">Enable or disable delivery assignment immediately</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/8">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-2 rounded-xl text-xs font-medium text-textSecondary hover:text-textPrimary hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary px-5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2"
              >
                {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {isLoading ? 'Creating...' : 'Create Delivery Agent'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CreateDeliveryPartnerModal;
