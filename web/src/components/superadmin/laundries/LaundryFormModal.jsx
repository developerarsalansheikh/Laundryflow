import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Store, User, Lock, MapPin, Phone, Mail, Clock, AlertCircle, Loader2 } from 'lucide-react';

const INITIAL_FORM_DATA = {
  name: '',
  description: '',
  phone: '',
  email: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
  openTime: '09:00',
  closeTime: '21:00',
  ownerName: '',
  ownerPassword: '',
};

/**
 * LaundryFormModal Component
 * Modal form for creating a new Laundry & Owner account based on backend register contract.
 */
export const LaundryFormModal = ({ isOpen, onClose, onSubmit, isLoading = false, apiError = null }) => {
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      setFormData(INITIAL_FORM_DATA);
      setErrors({});
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Laundry name is required';
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(formData.phone.trim())) {
      newErrors.phone = 'Enter valid 10-digit phone number';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Enter valid email address';
    }

    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.state.trim()) newErrors.state = 'State is required';
    if (!formData.pincode.trim()) {
      newErrors.pincode = 'Pincode is required';
    } else if (!/^\d{6}$/.test(formData.pincode.trim())) {
      newErrors.pincode = 'Enter valid 6-digit pincode';
    }

    if (!formData.ownerName.trim()) newErrors.ownerName = 'Owner name is required';
    if (!formData.ownerPassword) {
      newErrors.ownerPassword = 'Owner password is required';
    } else if (formData.ownerPassword.length < 6) {
      newErrors.ownerPassword = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit(formData);
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
          className="relative w-full max-w-2xl rounded-2xl bg-[#090D1E] border border-white/12 shadow-2xl overflow-hidden z-10 my-8"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-white/8 flex items-center justify-between bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-textPrimary">Add New Laundry</h2>
                <p className="text-xs text-textMuted">Register laundry business & owner account</p>
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

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
            {/* API Error Alert */}
            {apiError && (
              <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{apiError}</span>
              </div>
            )}

            {/* Section 1: Laundry Business Info */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5" />
                Laundry Business Details
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Laundry Name */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-textSecondary mb-1">
                    Laundry Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. Express Cleaners"
                    className={`w-full px-3.5 py-2 rounded-xl bg-white/5 border text-xs text-textPrimary placeholder:text-textMuted focus:outline-none transition-all ${
                      errors.name ? 'border-rose-500' : 'border-white/10 focus:border-purple-500/50'
                    }`}
                  />
                  {errors.name && <p className="text-[11px] text-rose-400 mt-1">{errors.name}</p>}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-medium text-textSecondary mb-1">
                    Business Email <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-textMuted absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="info@expresscleaners.com"
                      className={`w-full pl-9 pr-3.5 py-2 rounded-xl bg-white/5 border text-xs text-textPrimary placeholder:text-textMuted focus:outline-none transition-all ${
                        errors.email ? 'border-rose-500' : 'border-white/10 focus:border-purple-500/50'
                      }`}
                    />
                  </div>
                  {errors.email && <p className="text-[11px] text-rose-400 mt-1">{errors.email}</p>}
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-medium text-textSecondary mb-1">
                    Business Phone <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-textMuted absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="9876543210"
                      maxLength={10}
                      className={`w-full pl-9 pr-3.5 py-2 rounded-xl bg-white/5 border text-xs text-textPrimary placeholder:text-textMuted focus:outline-none transition-all ${
                        errors.phone ? 'border-rose-500' : 'border-white/10 focus:border-purple-500/50'
                      }`}
                    />
                  </div>
                  {errors.phone && <p className="text-[11px] text-rose-400 mt-1">{errors.phone}</p>}
                </div>

                {/* Address */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-textSecondary mb-1">
                    Street Address <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="w-3.5 h-3.5 text-textMuted absolute left-3 top-2.5" />
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="Shop 12, Main Market, MG Road"
                      className={`w-full pl-9 pr-3.5 py-2 rounded-xl bg-white/5 border text-xs text-textPrimary placeholder:text-textMuted focus:outline-none transition-all ${
                        errors.address ? 'border-rose-500' : 'border-white/10 focus:border-purple-500/50'
                      }`}
                    />
                  </div>
                  {errors.address && <p className="text-[11px] text-rose-400 mt-1">{errors.address}</p>}
                </div>

                {/* City */}
                <div>
                  <label className="block text-xs font-medium text-textSecondary mb-1">
                    City <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="Mumbai"
                    className={`w-full px-3.5 py-2 rounded-xl bg-white/5 border text-xs text-textPrimary placeholder:text-textMuted focus:outline-none transition-all ${
                      errors.city ? 'border-rose-500' : 'border-white/10 focus:border-purple-500/50'
                    }`}
                  />
                  {errors.city && <p className="text-[11px] text-rose-400 mt-1">{errors.city}</p>}
                </div>

                {/* State */}
                <div>
                  <label className="block text-xs font-medium text-textSecondary mb-1">
                    State <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    placeholder="Maharashtra"
                    className={`w-full px-3.5 py-2 rounded-xl bg-white/5 border text-xs text-textPrimary placeholder:text-textMuted focus:outline-none transition-all ${
                      errors.state ? 'border-rose-500' : 'border-white/10 focus:border-purple-500/50'
                    }`}
                  />
                  {errors.state && <p className="text-[11px] text-rose-400 mt-1">{errors.state}</p>}
                </div>

                {/* Pincode */}
                <div>
                  <label className="block text-xs font-medium text-textSecondary mb-1">
                    Pincode <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleChange}
                    placeholder="400001"
                    maxLength={6}
                    className={`w-full px-3.5 py-2 rounded-xl bg-white/5 border text-xs text-textPrimary placeholder:text-textMuted focus:outline-none transition-all ${
                      errors.pincode ? 'border-rose-500' : 'border-white/10 focus:border-purple-500/50'
                    }`}
                  />
                  {errors.pincode && <p className="text-[11px] text-rose-400 mt-1">{errors.pincode}</p>}
                </div>

                {/* Timings */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-textSecondary mb-1 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-textMuted" /> Open
                    </label>
                    <input
                      type="time"
                      name="openTime"
                      value={formData.openTime}
                      onChange={handleChange}
                      className="w-full px-2.5 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-textPrimary focus:outline-none focus:border-purple-500/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-textSecondary mb-1 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-textMuted" /> Close
                    </label>
                    <input
                      type="time"
                      name="closeTime"
                      value={formData.closeTime}
                      onChange={handleChange}
                      className="w-full px-2.5 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-textPrimary focus:outline-none focus:border-purple-500/50"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Owner User Account Info */}
            <div className="space-y-4 pt-4 border-t border-white/8">
              <h3 className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                Owner Admin Account
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Owner Name */}
                <div>
                  <label className="block text-xs font-medium text-textSecondary mb-1">
                    Owner Full Name <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-textMuted absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      name="ownerName"
                      value={formData.ownerName}
                      onChange={handleChange}
                      placeholder="Rajesh Kumar"
                      className={`w-full pl-9 pr-3.5 py-2 rounded-xl bg-white/5 border text-xs text-textPrimary placeholder:text-textMuted focus:outline-none transition-all ${
                        errors.ownerName ? 'border-rose-500' : 'border-white/10 focus:border-purple-500/50'
                      }`}
                    />
                  </div>
                  {errors.ownerName && <p className="text-[11px] text-rose-400 mt-1">{errors.ownerName}</p>}
                </div>

                {/* Owner Password */}
                <div>
                  <label className="block text-xs font-medium text-textSecondary mb-1">
                    Initial Owner Password <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 text-textMuted absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      name="ownerPassword"
                      value={formData.ownerPassword}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className={`w-full pl-9 pr-3.5 py-2 rounded-xl bg-white/5 border text-xs text-textPrimary placeholder:text-textMuted focus:outline-none transition-all ${
                        errors.ownerPassword ? 'border-rose-500' : 'border-white/10 focus:border-purple-500/50'
                      }`}
                    />
                  </div>
                  {errors.ownerPassword && <p className="text-[11px] text-rose-400 mt-1">{errors.ownerPassword}</p>}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-4 border-t border-white/8 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-textSecondary border border-white/10 transition-all cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium text-xs shadow-lg shadow-purple-600/30 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creating...</span>
                  </>
                ) : (
                  <span>Create Laundry</span>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default LaundryFormModal;
