import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, Tag } from 'lucide-react';

const INITIAL_FORM = {
  name: '',
  slug: '',
  description: '',
  price: 0,
  currency: 'INR',
  billingCycle: 'monthly',
  features: [],
  maxOrders: -1,
  maxEmployees: -1,
  isActive: true,
  isPopular: false,
  sortOrder: 0,
};

/**
 * SubscriptionPlanFormModal — Form modal to Create / Edit a Subscription Plan.
 */
export const SubscriptionPlanFormModal = ({
  isOpen,
  planToEdit,
  isLoading,
  onClose,
  onSubmit,
}) => {
  const [form, setForm] = useState(INITIAL_FORM);
  const [featureInput, setFeatureInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (planToEdit) {
      setForm({
        name: planToEdit.name || '',
        slug: planToEdit.slug || '',
        description: planToEdit.description || '',
        price: planToEdit.price ?? 0,
        currency: planToEdit.currency || 'INR',
        billingCycle: planToEdit.billingCycle || 'monthly',
        features: Array.isArray(planToEdit.features) ? [...planToEdit.features] : [],
        maxOrders: planToEdit.maxOrders ?? -1,
        maxEmployees: planToEdit.maxEmployees ?? -1,
        isActive: planToEdit.isActive !== false,
        isPopular: Boolean(planToEdit.isPopular),
        sortOrder: planToEdit.sortOrder ?? 0,
      });
    } else {
      setForm(INITIAL_FORM);
    }
    setErrorMsg('');
    setFeatureInput('');
  }, [planToEdit, isOpen]);

  // Auto-generate slug from name if creating
  const handleNameChange = (e) => {
    const val = e.target.value;
    setForm((prev) => ({
      ...prev,
      name: val,
      ...(!planToEdit && {
        slug: val
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, ''),
      }),
    }));
  };

  const handleAddFeature = () => {
    if (!featureInput.trim()) return;
    setForm((prev) => ({
      ...prev,
      features: [...prev.features, featureInput.trim()],
    }));
    setFeatureInput('');
  };

  const handleRemoveFeature = (index) => {
    setForm((prev) => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!form.name.trim()) {
      setErrorMsg('Plan name is required');
      return;
    }
    if (!form.slug.trim()) {
      setErrorMsg('Plan slug is required');
      return;
    }
    if (form.price < 0) {
      setErrorMsg('Price cannot be negative');
      return;
    }

    onSubmit(form);
  };

  if (!isOpen) return null;

  const isEdit = Boolean(planToEdit);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={!isLoading ? onClose : undefined}
            className="fixed inset-0 bg-black/65 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-lg glass-card rounded-2xl border border-white/10 p-6 shadow-2xl z-10 max-h-[90vh] flex flex-col"
            role="dialog"
            aria-modal="true"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/8 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <Tag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-textPrimary">
                    {isEdit ? 'Edit Subscription Plan' : 'Create Subscription Plan'}
                  </h3>
                  <p className="text-xs text-textMuted">Define pricing tier & features</p>
                </div>
              </div>
              <button
                onClick={onClose}
                disabled={isLoading}
                className="text-textMuted hover:text-textPrimary transition-colors disabled:opacity-40"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Error banner */}
            {errorMsg && (
              <div className="mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs font-semibold text-rose-400 flex-shrink-0">
                {errorMsg}
              </div>
            )}

            {/* Form Body */}
            <form id="plan-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
              <div className="grid grid-cols-2 gap-3">
                {/* Name */}
                <div>
                  <label htmlFor="plan-name" className="block text-xs font-semibold text-textMuted mb-1">
                    Plan Name *
                  </label>
                  <input
                    type="text"
                    id="plan-name"
                    value={form.name}
                    onChange={handleNameChange}
                    placeholder="e.g. Pro Plan"
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-textPrimary placeholder:text-textMuted focus:outline-none focus:ring-1 focus:ring-purple-500/50"
                  />
                </div>

                {/* Slug */}
                <div>
                  <label htmlFor="plan-slug" className="block text-xs font-semibold text-textMuted mb-1">
                    Slug *
                  </label>
                  <input
                    type="text"
                    id="plan-slug"
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    placeholder="pro-plan"
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-textPrimary placeholder:text-textMuted focus:outline-none focus:ring-1 focus:ring-purple-500/50 font-mono"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label htmlFor="plan-desc" className="block text-xs font-semibold text-textMuted mb-1">
                  Description
                </label>
                <textarea
                  id="plan-desc"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Short description of this plan..."
                  rows={2}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-textPrimary placeholder:text-textMuted focus:outline-none focus:ring-1 focus:ring-purple-500/50 resize-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                {/* Price */}
                <div>
                  <label htmlFor="plan-price" className="block text-xs font-semibold text-textMuted mb-1">
                    Price (₹) *
                  </label>
                  <input
                    type="number"
                    id="plan-price"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                    min={0}
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-textPrimary focus:outline-none focus:ring-1 focus:ring-purple-500/50 tabular-nums"
                  />
                </div>

                {/* Billing Cycle */}
                <div>
                  <label htmlFor="plan-cycle" className="block text-xs font-semibold text-textMuted mb-1">
                    Cycle *
                  </label>
                  <select
                    id="plan-cycle"
                    value={form.billingCycle}
                    onChange={(e) => setForm({ ...form, billingCycle: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-textPrimary focus:outline-none focus:ring-1 focus:ring-purple-500/50"
                  >
                    <option value="monthly" className="bg-[#0f172a]">Monthly</option>
                    <option value="yearly" className="bg-[#0f172a]">Yearly</option>
                  </select>
                </div>

                {/* Sort Order */}
                <div>
                  <label htmlFor="plan-sort" className="block text-xs font-semibold text-textMuted mb-1">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    id="plan-sort"
                    value={form.sortOrder}
                    onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-textPrimary focus:outline-none focus:ring-1 focus:ring-purple-500/50 tabular-nums"
                  />
                </div>
              </div>

              {/* Limits */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-white/[0.02] rounded-xl border border-white/6">
                <div>
                  <label htmlFor="plan-max-orders" className="block text-[11px] font-semibold text-textMuted mb-1">
                    Max Orders (-1 = Unlimited)
                  </label>
                  <input
                    type="number"
                    id="plan-max-orders"
                    value={form.maxOrders}
                    onChange={(e) => setForm({ ...form, maxOrders: Number(e.target.value) })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-textPrimary focus:outline-none focus:ring-1 focus:ring-purple-500/50 tabular-nums"
                  />
                </div>
                <div>
                  <label htmlFor="plan-max-emp" className="block text-[11px] font-semibold text-textMuted mb-1">
                    Max Employees (-1 = Unlimited)
                  </label>
                  <input
                    type="number"
                    id="plan-max-emp"
                    value={form.maxEmployees}
                    onChange={(e) => setForm({ ...form, maxEmployees: Number(e.target.value) })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-textPrimary focus:outline-none focus:ring-1 focus:ring-purple-500/50 tabular-nums"
                  />
                </div>
              </div>

              {/* Features Input */}
              <div>
                <label className="block text-xs font-semibold text-textMuted mb-1">Features List</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={featureInput}
                    onChange={(e) => setFeatureInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddFeature();
                      }
                    }}
                    placeholder="Add feature item..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-textPrimary placeholder:text-textMuted focus:outline-none focus:ring-1 focus:ring-purple-500/50"
                  />
                  <button
                    type="button"
                    onClick={handleAddFeature}
                    className="px-3 py-2 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-xs font-semibold text-purple-300 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {form.features.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {form.features.map((feat, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] bg-purple-500/10 border border-purple-500/20 text-purple-300"
                      >
                        {feat}
                        <button
                          type="button"
                          onClick={() => handleRemoveFeature(idx)}
                          className="hover:text-rose-400 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Toggles */}
              <div className="flex items-center justify-between gap-4 pt-2 border-t border-white/6">
                <label className="flex items-center gap-2 text-xs text-textSecondary cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                    className="rounded bg-white/5 border-white/20 text-purple-600 focus:ring-purple-500/50"
                  />
                  Active Plan
                </label>

                <label className="flex items-center gap-2 text-xs text-textSecondary cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isPopular}
                    onChange={(e) => setForm({ ...form, isPopular: e.target.checked })}
                    className="rounded bg-white/5 border-white/20 text-purple-600 focus:ring-purple-500/50"
                  />
                  Featured / Popular Badge
                </label>
              </div>
            </form>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/8 flex-shrink-0">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-textSecondary hover:text-textPrimary transition-all disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="plan-form"
                disabled={isLoading}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-semibold text-white shadow-lg shadow-purple-600/30 flex items-center gap-2 transition-all disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>{isEdit ? 'Update Plan' : 'Create Plan'}</span>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default SubscriptionPlanFormModal;
