import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Sparkles,
  Plus,
  Search,
  Edit2,
  Trash2,
  Clock,
  Tag,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { adminApi } from '../../api/adminApi';
import { ROUTES } from '../../routes/routeConstants';

const CATEGORIES = [
  { key: 'all', label: 'All Services' },
  { key: 'Wash & Fold', label: 'Wash & Fold' },
  { key: 'Dry Cleaning', label: 'Dry Cleaning' },
  { key: 'Ironing', label: 'Ironing' },
  { key: 'Shoe Cleaning', label: 'Shoe Care' },
  { key: 'Premium', label: 'Premium' },
];

export const AdminServices = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Fetch Services (including inactive ones)
  const { data: services = [], isLoading } = useQuery({
    queryKey: ['admin-services', selectedCategory],
    queryFn: () => adminApi.getServices({ category: selectedCategory, all: true }),
  });

  // Mutation: Toggle Active status
  const toggleMutation = useMutation({
    mutationFn: (id) => adminApi.toggleService(id),
    onSuccess: (updated) => {
      toast.success(
        `Service "${updated.name}" is now ${updated.isActive ? 'Active' : 'Inactive'}`
      );
      queryClient.invalidateQueries({ queryKey: ['admin-services'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to toggle service status');
    },
  });

  // Mutation: Delete service
  const deleteMutation = useMutation({
    mutationFn: (id) => adminApi.deleteService(id),
    onSuccess: () => {
      toast.success('Service successfully removed');
      queryClient.invalidateQueries({ queryKey: ['admin-services'] });
      setDeleteTarget(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to delete service');
    },
  });

  const filteredServices = services.filter((svc) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      svc.name?.toLowerCase().includes(q) ||
      svc.category?.toLowerCase().includes(q) ||
      svc.description?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header & New Service CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-textPrimary">
            Catalog & Pricing
          </h1>
          <p className="text-xs text-textMuted mt-1">
            Configure offered laundry items, turnaround SLA, and customer rate cards
          </p>
        </div>

        <button
          onClick={() => navigate(ROUTES.ADMIN.SERVICES_NEW)}
          className="btn-primary px-4 py-2 text-xs font-semibold gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Service</span>
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
                className={`px-3.5 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-primaryPurple to-brandIndigo text-white shadow-glowPurple'
                    : 'bg-white/[0.03] hover:bg-white/[0.06] text-textSecondary hover:text-textPrimary border border-white/[0.07]'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-textMuted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search service item..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-white/[0.04] border border-white/10 text-textPrimary placeholder-textMuted focus:outline-none focus:border-primaryPurple focus:ring-1 focus:ring-primaryPurple transition-all"
          />
        </div>
      </div>

      {/* Services Grid */}
      {isLoading ? (
        <div className="py-20 text-center text-xs text-textMuted">Loading catalog...</div>
      ) : filteredServices.length === 0 ? (
        <div className="glass-card p-12 text-center space-y-3">
          <Sparkles className="w-10 h-10 text-textMuted/40 mx-auto" />
          <h3 className="text-sm font-bold text-textPrimary">No Services Found</h3>
          <p className="text-xs text-textMuted">
            {searchQuery
              ? 'No service matches your search keyword.'
              : 'Add your first laundry service to publish it to customer marketplace.'}
          </p>
          <button
            onClick={() => navigate(ROUTES.ADMIN.SERVICES_NEW)}
            className="btn-primary px-4 py-2 text-xs font-semibold mt-2"
          >
            Create Service
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredServices.map((svc) => (
            <div
              key={svc._id}
              className={`glass-card p-6 flex flex-col justify-between group transition-all duration-300 ${
                svc.isActive !== false
                  ? 'hover:border-primaryPurple/40'
                  : 'opacity-70 border-dashed'
              }`}
            >
              <div>
                {/* Card Header: Category & Active Toggle */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-white/[0.04] text-textSecondary border border-white/[0.07]">
                    <Tag className="w-3 h-3 text-purpleLight" />
                    <span>{svc.category || 'Standard'}</span>
                  </span>

                  {/* Active Toggle Switch */}
                  <button
                    onClick={() => toggleMutation.mutate(svc._id)}
                    disabled={toggleMutation.isPending}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all border ${
                      svc.isActive !== false
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.15)]'
                        : 'bg-white/[0.04] text-textMuted border-white/[0.08]'
                    }`}
                  >
                    {svc.isActive !== false ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>Active</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3 text-textMuted" />
                        <span>Inactive</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Name & Description */}
                <h3 className="text-sm font-bold text-textPrimary leading-snug group-hover:text-purpleLight transition-colors">
                  {svc.name}
                </h3>
                <p className="text-xs text-textMuted line-clamp-2 mt-1.5 leading-relaxed">
                  {svc.description || 'No description provided.'}
                </p>
              </div>

              {/* Price & Turnaround Info */}
              <div className="pt-4 mt-4 border-t border-white/[0.07] flex items-end justify-between">
                <div>
                  <div className="text-lg font-bold text-textPrimary">
                    ₹{svc.price}
                    <span className="text-xs font-normal text-textMuted ml-1">
                      / {svc.unit || 'piece'}
                    </span>
                  </div>
                  <div className="text-[11px] text-textMuted flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3 text-textMuted" />
                    <span>{svc.turnaroundHours || 24} hrs turnaround</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => navigate(`/admin/services/${svc._id}/edit`)}
                    className="p-2 text-textMuted hover:text-textPrimary hover:bg-white/[0.06] rounded-xl transition-colors"
                    title="Edit Service"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(svc)}
                    className="p-2 text-textMuted hover:text-statusDanger hover:bg-statusDanger/10 rounded-xl transition-colors"
                    title="Delete Service"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="w-full max-w-sm p-6 rounded-2xl glass-card space-y-4 border border-white/10 shadow-2xl">
            <div className="flex items-center gap-3 text-statusDanger">
              <AlertCircle className="w-6 h-6" />
              <h3 className="text-base font-bold text-textPrimary">
                Delete Service?
              </h3>
            </div>
            <p className="text-xs text-textSecondary leading-relaxed">
              Are you sure you want to remove <span className="font-bold text-textPrimary">&quot;{deleteTarget.name}&quot;</span>?
              Existing orders will retain records, but customers will no longer be able to select it.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-white/[0.04] text-textSecondary hover:text-textPrimary hover:bg-white/[0.08]"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate(deleteTarget._id)}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-statusDanger hover:bg-red-600 text-white disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminServices;
