import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Store,
  MapPin,
  ShieldCheck,
  Truck,
  Save,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { adminApi } from '../../api/adminApi';

export const AdminProfile = () => {
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    street: '',
    city: '',
    state: '',
    postalCode: '',
    deliveryRadius: 10,
    maxServiceDistanceKm: 20,
    defaultTurnaroundHours: 24,
    minOrderAmount: 199,
    deliveryFee: 49,
    openingTime: '08:00 AM',
    closingTime: '08:00 PM',
    distancePricing: [],
  });

  // Fetch current store profile
  const { data: laundry, isLoading } = useQuery({
    queryKey: ['admin-my-laundry'],
    queryFn: adminApi.getMyLaundry,
  });

  useEffect(() => {
    if (laundry) {
      const addr = laundry.address || {};
      setFormData({
        name: laundry.name || '',
        phone: laundry.phone || '',
        email: laundry.email || '',
        street: addr.street || addr.addressLine1 || '',
        city: addr.city || laundry.city || '',
        state: addr.state || '',
        postalCode: addr.postalCode || addr.zipCode || '',
        deliveryRadius: laundry.serviceRadius || laundry.deliveryRadius || 10,
        maxServiceDistanceKm: laundry.maxServiceDistanceKm || 20,
        defaultTurnaroundHours: laundry.defaultTurnaroundHours || 24,
        minOrderAmount: laundry.minOrderAmount || 199,
        deliveryFee: laundry.deliveryFee || 49,
        openingTime: laundry.timings?.opening || laundry.openingTime || '08:00 AM',
        closingTime: laundry.timings?.closing || laundry.closingTime || '08:00 PM',
        distancePricing: Array.isArray(laundry.distancePricing) ? laundry.distancePricing : [],
      });
    }
  }, [laundry]);

  // Mutation: Save changes
  const updateMutation = useMutation({
    mutationFn: (payload) => adminApi.updateMyLaundry(payload),
    onSuccess: () => {
      toast.success('Store settings updated successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-my-laundry'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update store settings');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Store name is required');
      return;
    }

    updateMutation.mutate({
      name: formData.name,
      phone: formData.phone,
      email: formData.email,
      address: {
        street: formData.street,
        city: formData.city,
        state: formData.state,
        postalCode: formData.postalCode,
      },
      city: formData.city,
      serviceRadius: Number(formData.deliveryRadius),
      maxServiceDistanceKm: Number(formData.maxServiceDistanceKm),
      defaultTurnaroundHours: Number(formData.defaultTurnaroundHours),
      minOrderAmount: Number(formData.minOrderAmount),
      deliveryFee: Number(formData.deliveryFee),
      distancePricing: formData.distancePricing,
      timings: {
        opening: formData.openingTime,
        closing: formData.closingTime,
      },
    });
  };

  if (isLoading) {
    return <div className="py-24 text-center text-xs text-textMuted">Loading store settings...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-textPrimary">
              Store Profile & Rules
            </h1>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Verified Store</span>
            </span>
          </div>
          <p className="text-xs text-textMuted mt-1">
            Configure your facility address, service boundary, and operating constraints
          </p>
        </div>

        <button
          onClick={handleSubmit}
          disabled={updateMutation.isPending}
          className="btn-primary px-5 py-2.5 text-xs font-semibold gap-2 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{updateMutation.isPending ? 'Saving...' : 'Save Settings'}</span>
        </button>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Identity & Contact Section */}
        <div className="glass-card p-6 sm:p-8 space-y-4">
          <h2 className="text-sm font-bold text-textPrimary flex items-center gap-2">
            <Store className="w-4 h-4 text-purpleLight" />
            <span>Store Identity & Contact</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-textSecondary mb-1.5">
                Store Business Name <span className="text-statusDanger">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-3 text-xs rounded-xl bg-white/[0.04] border border-white/10 text-textPrimary focus:outline-none focus:border-primaryPurple transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-textSecondary mb-1.5">
                Contact Phone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full p-3 text-xs rounded-xl bg-white/[0.04] border border-white/10 text-textPrimary focus:outline-none focus:border-primaryPurple transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-textSecondary mb-1.5">
                Support Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full p-3 text-xs rounded-xl bg-white/[0.04] border border-white/10 text-textPrimary focus:outline-none focus:border-primaryPurple transition-all"
              />
            </div>
          </div>
        </div>

        {/* Physical Address Section */}
        <div className="glass-card p-6 sm:p-8 space-y-4">
          <h2 className="text-sm font-bold text-textPrimary flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-400" />
            <span>Facility Address</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-textSecondary mb-1.5">
                Street Address / Building
              </label>
              <input
                type="text"
                value={formData.street}
                onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                className="w-full p-3 text-xs rounded-xl bg-white/[0.04] border border-white/10 text-textPrimary focus:outline-none focus:border-primaryPurple transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-textSecondary mb-1.5">
                City
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full p-3 text-xs rounded-xl bg-white/[0.04] border border-white/10 text-textPrimary focus:outline-none focus:border-primaryPurple transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-textSecondary mb-1.5">
                State / Province
              </label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full p-3 text-xs rounded-xl bg-white/[0.04] border border-white/10 text-textPrimary focus:outline-none focus:border-primaryPurple transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-textSecondary mb-1.5">
                Postal Code (PIN)
              </label>
              <input
                type="text"
                value={formData.postalCode}
                onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                className="w-full p-3 text-xs rounded-xl bg-white/[0.04] border border-white/10 text-textPrimary focus:outline-none focus:border-primaryPurple transition-all"
              />
            </div>
          </div>
        </div>

        {/* Operational Constraints & Policy */}
        <div className="glass-card p-6 sm:p-8 space-y-4">
          <h2 className="text-sm font-bold text-textPrimary flex items-center gap-2">
            <Truck className="w-4 h-4 text-purpleLight" />
            <span>Delivery Radius & Rules</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-textSecondary mb-1.5">
                Service Radius (km)
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={formData.deliveryRadius}
                onChange={(e) => setFormData({ ...formData, deliveryRadius: e.target.value })}
                className="w-full p-3 text-xs rounded-xl bg-white/[0.04] border border-white/10 text-textPrimary focus:outline-none focus:border-primaryPurple transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-textSecondary mb-1.5">
                Minimum Order Amount (₹)
              </label>
              <input
                type="number"
                min="0"
                value={formData.minOrderAmount}
                onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })}
                className="w-full p-3 text-xs rounded-xl bg-white/[0.04] border border-white/10 text-textPrimary focus:outline-none focus:border-primaryPurple transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-textSecondary mb-1.5">
                Standard Delivery Fee (₹)
              </label>
              <input
                type="number"
                min="0"
                value={formData.deliveryFee}
                onChange={(e) => setFormData({ ...formData, deliveryFee: e.target.value })}
                className="w-full p-3 text-xs rounded-xl bg-white/[0.04] border border-white/10 text-textPrimary focus:outline-none focus:border-primaryPurple transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-textSecondary mb-1.5">
                Max Service Distance (km)
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={formData.maxServiceDistanceKm}
                onChange={(e) => setFormData({ ...formData, maxServiceDistanceKm: e.target.value })}
                className="w-full p-3 text-xs rounded-xl bg-white/[0.04] border border-white/10 text-textPrimary focus:outline-none focus:border-primaryPurple transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-textSecondary mb-1.5">
                Default Turnaround Time (hours)
              </label>
              <input
                type="number"
                min="1"
                value={formData.defaultTurnaroundHours}
                onChange={(e) => setFormData({ ...formData, defaultTurnaroundHours: e.target.value })}
                className="w-full p-3 text-xs rounded-xl bg-white/[0.04] border border-white/10 text-textPrimary focus:outline-none focus:border-primaryPurple transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-textSecondary mb-1.5">
                Opening Time
              </label>
              <input
                type="text"
                placeholder="08:00 AM"
                value={formData.openingTime}
                onChange={(e) => setFormData({ ...formData, openingTime: e.target.value })}
                className="w-full p-3 text-xs rounded-xl bg-white/[0.04] border border-white/10 text-textPrimary focus:outline-none focus:border-primaryPurple transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-textSecondary mb-1.5">
                Closing Time
              </label>
              <input
                type="text"
                placeholder="08:00 PM"
                value={formData.closingTime}
                onChange={(e) => setFormData({ ...formData, closingTime: e.target.value })}
                className="w-full p-3 text-xs rounded-xl bg-white/[0.04] border border-white/10 text-textPrimary focus:outline-none focus:border-primaryPurple transition-all"
              />
            </div>
          </div>
        </div>

        {/* Distance-Based Pricing (Feature B) */}
        <div className="glass-card p-6 sm:p-8 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-textPrimary flex items-center gap-2">
                <Truck className="w-4 h-4 text-primaryPurple" />
                <span>Distance-Based Delivery Pricing (Feature B)</span>
              </h2>
              <p className="text-[11px] text-textMuted mt-0.5">
                Configure tiered delivery rates based on customer distance. Example: 0–5 km: ₹30, 5–10 km: ₹60.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                const tiers = [...(formData.distancePricing || [])];
                const lastTier = tiers[tiers.length - 1];
                const minKm = lastTier ? Number(lastTier.maxDistanceKm) : 0;
                tiers.push({ minDistanceKm: minKm, maxDistanceKm: minKm + 5, deliveryFee: 40 });
                setFormData({ ...formData, distancePricing: tiers });
              }}
              className="px-3 py-1.5 rounded-lg bg-primaryPurple/20 border border-primaryPurple/40 text-purpleLight text-xs font-semibold hover:bg-primaryPurple/30 transition-all"
            >
              + Add Tier
            </button>
          </div>

          {(formData.distancePricing || []).length === 0 ? (
            <div className="py-6 text-center text-xs text-textMuted border border-dashed border-white/10 rounded-xl">
              No distance tiers configured. Standard delivery fee (₹{formData.deliveryFee}) applies.
            </div>
          ) : (
            <div className="space-y-2.5">
              {(formData.distancePricing || []).map((tier, tIdx) => (
                <div key={tIdx} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <div className="flex-1 grid grid-cols-3 gap-3">
                    <div>
                      <span className="block text-[10px] text-textMuted mb-1">From (km)</span>
                      <input
                        type="number"
                        min="0"
                        value={tier.minDistanceKm}
                        onChange={(e) => {
                          const updated = [...formData.distancePricing];
                          updated[tIdx].minDistanceKm = Number(e.target.value);
                          setFormData({ ...formData, distancePricing: updated });
                        }}
                        className="w-full p-2 text-xs rounded-lg bg-white/[0.04] border border-white/10 text-textPrimary"
                      />
                    </div>
                    <div>
                      <span className="block text-[10px] text-textMuted mb-1">To (km)</span>
                      <input
                        type="number"
                        min="1"
                        value={tier.maxDistanceKm}
                        onChange={(e) => {
                          const updated = [...formData.distancePricing];
                          updated[tIdx].maxDistanceKm = Number(e.target.value);
                          setFormData({ ...formData, distancePricing: updated });
                        }}
                        className="w-full p-2 text-xs rounded-lg bg-white/[0.04] border border-white/10 text-textPrimary"
                      />
                    </div>
                    <div>
                      <span className="block text-[10px] text-textMuted mb-1">Delivery Charge (₹)</span>
                      <input
                        type="number"
                        min="0"
                        value={tier.deliveryFee}
                        onChange={(e) => {
                          const updated = [...formData.distancePricing];
                          updated[tIdx].deliveryFee = Number(e.target.value);
                          setFormData({ ...formData, distancePricing: updated });
                        }}
                        className="w-full p-2 text-xs rounded-lg bg-white/[0.04] border border-white/10 text-textPrimary"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const updated = formData.distancePricing.filter((_, idx) => idx !== tIdx);
                      setFormData({ ...formData, distancePricing: updated });
                    }}
                    className="p-2 text-statusDanger hover:bg-statusDanger/10 rounded-lg transition-colors mt-3"
                    title="Remove Tier"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit Bottom Bar */}
        <div className="flex items-center justify-end pt-2">
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="btn-primary px-6 py-2.5 text-xs font-semibold gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{updateMutation.isPending ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminProfile;
