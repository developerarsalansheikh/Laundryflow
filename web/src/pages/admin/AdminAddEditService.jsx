import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Sparkles,
  Save,
  Clock,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { adminApi } from '../../api/adminApi';
import { ROUTES } from '../../routes/routeConstants';

const CATEGORY_OPTIONS = [
  'Wash & Fold',
  'Dry Cleaning',
  'Ironing',
  'Shoe Cleaning',
  'Premium Care',
  'Curtains & Drapes',
  'Bedding & Blankets',
];

const UNIT_OPTIONS = [
  { value: 'piece', label: 'Per Piece' },
  { value: 'kg', label: 'Per Kilogram (Kg)' },
  { value: 'pair', label: 'Per Pair' },
  { value: 'meter', label: 'Per Meter' },
  { value: 'set', label: 'Per Set' },
];

export const AdminAddEditService = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: '',
    category: 'Wash & Fold',
    price: '',
    unit: 'piece',
    turnaroundHours: 24,
    description: '',
    isActive: true,
  });

  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState({
    name: '',
    clothingType: '',
    price: '',
    estimatedHours: '24',
  });

  const [errors, setErrors] = useState({});

  // Fetch existing service data if editing
  const { data: existingService, isLoading: serviceLoading } = useQuery({
    queryKey: ['admin-service-detail', id],
    queryFn: () => adminApi.getServiceById(id),
    enabled: isEdit,
  });

  useEffect(() => {
    if (existingService) {
      setFormData({
        name: existingService.name || '',
        category: existingService.category || 'Wash & Fold',
        price: existingService.price !== undefined ? String(existingService.price) : '',
        unit: existingService.unit || 'piece',
        turnaroundHours: existingService.turnaroundHours || 24,
        description: existingService.description || '',
        isActive: existingService.isActive !== false,
      });
      if (Array.isArray(existingService.items) && existingService.items.length > 0) {
        setItems(existingService.items);
      }
    }
  }, [existingService]);

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Service name is required';
    if (items.length === 0) {
      if (!formData.price || Number(formData.price) <= 0) errs.price = 'Price must be greater than 0';
    }
    if (!formData.turnaroundHours || Number(formData.turnaroundHours) < 1) {
      errs.turnaroundHours = 'Turnaround must be at least 1 hour';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const mutation = useMutation({
    mutationFn: (payload) => {
      return isEdit
        ? adminApi.updateService(id, payload)
        : adminApi.createService(payload);
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Service updated successfully' : 'Service published to catalog');
      queryClient.invalidateQueries({ queryKey: ['admin-services'] });
      navigate(ROUTES.ADMIN.SERVICES);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to save service');
    },
  });

  const handleAddItem = () => {
    if (!newItem.name.trim()) {
      toast.error('Item name is required');
      return;
    }
    if (!newItem.price || Number(newItem.price) <= 0) {
      toast.error('Valid item price is required');
      return;
    }
    setItems([
      ...items,
      {
        name: newItem.name.trim(),
        clothingType: newItem.clothingType.trim() || 'General',
        price: Number(newItem.price),
        estimatedHours: Number(newItem.estimatedHours) || Number(formData.turnaroundHours) || 24,
        isActive: true,
      },
    ]);
    setNewItem({ name: '', clothingType: '', price: '', estimatedHours: '24' });
  };

  const handleRemoveItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const basePrice = items.length > 0
      ? (Number(formData.price) > 0 ? Number(formData.price) : Number(items[0].price))
      : Number(formData.price);

    const payload = {
      ...formData,
      price: basePrice,
      turnaroundHours: Number(formData.turnaroundHours),
    };

    if (items.length > 0) {
      payload.items = items.map((it) => ({
        name: it.name.trim(),
        clothingType: it.clothingType?.trim() || 'General',
        price: Number(it.price),
        description: it.description?.trim() || '',
        isActive: it.isActive !== false,
        estimatedHours: Number(it.estimatedHours || formData.turnaroundHours || 24),
      }));
    }

    mutation.mutate(payload);
  };

  if (isEdit && serviceLoading) {
    return <div className="py-24 text-center text-xs text-textMuted">Loading service details...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(ROUTES.ADMIN.SERVICES)}
          className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-textSecondary hover:text-textPrimary hover:bg-white/[0.08] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-textPrimary">
            {isEdit ? 'Edit Service' : 'Add New Service'}
          </h1>
          <p className="text-xs text-textMuted mt-0.5">
            {isEdit ? 'Update pricing or descriptions for this service' : 'Create an item to add to your customer rate card'}
          </p>
        </div>
      </div>

      {/* Form Card */}
      <form
        onSubmit={handleSubmit}
        className="glass-card p-6 sm:p-8 space-y-6"
      >
        {/* Basic Details */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-textPrimary flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purpleLight" />
            <span>Service Overview</span>
          </h2>

          <div>
            <label className="block text-xs font-semibold text-textSecondary mb-1.5">
              Service Name <span className="text-statusDanger">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g., Premium Suit Dry Clean"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`w-full p-3 text-xs rounded-xl bg-white/[0.04] border text-textPrimary placeholder-textMuted focus:outline-none focus:border-primaryPurple focus:ring-1 focus:ring-primaryPurple transition-all ${
                errors.name ? 'border-statusDanger' : 'border-white/10'
              }`}
            />
            {errors.name && <p className="text-[11px] text-statusDanger mt-1">{errors.name}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-textSecondary mb-1.5">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full p-3 text-xs rounded-xl bg-white/[0.05] border border-white/10 text-textPrimary focus:outline-none focus:border-primaryPurple"
              >
                {CATEGORY_OPTIONS.map((cat) => (
                  <option key={cat} value={cat} className="bg-slate-900 text-textPrimary">
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-textSecondary mb-1.5">
                Billing Unit
              </label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full p-3 text-xs rounded-xl bg-white/[0.05] border border-white/10 text-textPrimary focus:outline-none focus:border-primaryPurple"
              >
                {UNIT_OPTIONS.map((u) => (
                  <option key={u.value} value={u.value} className="bg-slate-900 text-textPrimary">
                    {u.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Pricing & Turnaround */}
        <div className="pt-4 border-t border-white/[0.07] space-y-4">
          <h2 className="text-sm font-bold text-textPrimary flex items-center gap-2">
            <Clock className="w-4 h-4 text-purpleLight" />
            <span>Pricing & Fulfillment</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-textSecondary mb-1.5">
                Price (₹) <span className="text-statusDanger">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-textMuted text-xs font-bold">
                  ₹
                </span>
                <input
                  type="number"
                  placeholder="0.00"
                  min="1"
                  step="0.5"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className={`w-full pl-8 pr-3 py-3 text-xs rounded-xl bg-white/[0.04] border text-textPrimary placeholder-textMuted focus:outline-none focus:border-primaryPurple focus:ring-1 focus:ring-primaryPurple transition-all ${
                    errors.price ? 'border-statusDanger' : 'border-white/10'
                  }`}
                />
              </div>
              {errors.price && <p className="text-[11px] text-statusDanger mt-1">{errors.price}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-textSecondary mb-1.5">
                Processing Turnaround (Hours)
              </label>
              <input
                type="number"
                min="1"
                placeholder="24"
                value={formData.turnaroundHours}
                onChange={(e) => setFormData({ ...formData, turnaroundHours: e.target.value })}
                className={`w-full p-3 text-xs rounded-xl bg-white/[0.04] border text-textPrimary placeholder-textMuted focus:outline-none focus:border-primaryPurple focus:ring-1 focus:ring-primaryPurple transition-all ${
                  errors.turnaroundHours ? 'border-statusDanger' : 'border-white/10'
                }`}
              />
              {errors.turnaroundHours && (
                <p className="text-[11px] text-statusDanger mt-1">{errors.turnaroundHours}</p>
              )}
            </div>
          </div>
        </div>

        {/* Garment / Sub-Items Pricing (Matching Mobile Admin parity) */}
        <div className="pt-4 border-t border-white/[0.07] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-textPrimary flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purpleLight" />
                <span>Clothing Items & Sub-Pricing (Optional)</span>
              </h2>
              <p className="text-[11px] text-textMuted mt-0.5">
                Configure individual garment prices for this service (e.g., Men&apos;s Suit, Shirt, Saree, Blanket).
              </p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-white/[0.05] border border-white/10 text-textSecondary">
              {items.length} items configured
            </span>
          </div>

          {/* New Item Form */}
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-3">
            <span className="text-xs font-semibold text-textSecondary block">Add Garment Item</span>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <input
                  type="text"
                  placeholder="Item Name (e.g., 2-Piece Suit)"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  className="w-full p-2.5 text-xs rounded-xl bg-white/[0.04] border border-white/10 text-textPrimary placeholder-textMuted"
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Type (e.g., Suit / Ethnic / Topwear)"
                  value={newItem.clothingType}
                  onChange={(e) => setNewItem({ ...newItem, clothingType: e.target.value })}
                  className="w-full p-2.5 text-xs rounded-xl bg-white/[0.04] border border-white/10 text-textPrimary placeholder-textMuted"
                />
              </div>
              <div>
                <input
                  type="number"
                  min="1"
                  placeholder="Price (₹)"
                  value={newItem.price}
                  onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                  className="w-full p-2.5 text-xs rounded-xl bg-white/[0.04] border border-white/10 text-textPrimary placeholder-textMuted"
                />
              </div>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  placeholder="Hours"
                  value={newItem.estimatedHours}
                  onChange={(e) => setNewItem({ ...newItem, estimatedHours: e.target.value })}
                  className="w-20 p-2.5 text-xs rounded-xl bg-white/[0.04] border border-white/10 text-textPrimary placeholder-textMuted"
                />
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="flex-1 px-3 py-2.5 text-xs font-semibold rounded-xl bg-primaryPurple/20 border border-primaryPurple/40 text-purpleLight hover:bg-primaryPurple/30 transition-all"
                >
                  + Add Item
                </button>
              </div>
            </div>
          </div>

          {/* Items List */}
          {items.length > 0 && (
            <div className="space-y-2">
              {items.map((it, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-primaryPurple/10 text-purpleLight flex items-center justify-center text-xs font-bold">
                      {idx + 1}
                    </span>
                    <div>
                      <span className="text-xs font-semibold text-textPrimary block">{it.name}</span>
                      <span className="text-[10px] text-textMuted">{it.clothingType || 'General'} • {it.estimatedHours || 24}h turnaround</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-emerald-400">₹{it.price}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="text-statusDanger hover:bg-statusDanger/10 p-1.5 rounded-lg transition-colors text-xs"
                      title="Remove Item"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Description */}
        <div className="pt-4 border-t border-white/[0.07] space-y-4">
          <div>
            <label className="block text-xs font-semibold text-textSecondary mb-1.5">
              Description / Care Instructions
            </label>
            <textarea
              rows={3}
              placeholder="Explain cleaning methodology, fabric precautions, detergents used..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full p-3 text-xs rounded-xl bg-white/[0.04] border border-white/10 text-textPrimary placeholder-textMuted focus:outline-none focus:border-primaryPurple transition-all"
            />
          </div>

          {/* Active Status Checkbox */}
          <div className="flex items-center gap-2.5 pt-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 text-primaryPurple rounded bg-white/[0.05] border-white/20 focus:ring-primaryPurple cursor-pointer"
            />
            <label htmlFor="isActive" className="text-xs font-semibold text-textPrimary cursor-pointer">
              Publish Service (Active & bookable by customers in marketplace)
            </label>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="pt-6 border-t border-white/[0.07] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate(ROUTES.ADMIN.SERVICES)}
            className="px-4 py-2.5 text-xs font-semibold rounded-xl bg-white/[0.04] text-textSecondary hover:text-textPrimary hover:bg-white/[0.08] transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="btn-primary px-5 py-2.5 text-xs font-semibold gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{mutation.isPending ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Service'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminAddEditService;
