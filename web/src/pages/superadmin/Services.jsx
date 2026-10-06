import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Search,
  Filter,
  Store,
  Tag,
  Clock,
  Layers,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Info,
} from 'lucide-react';
import { useSuperAdminServices } from '../../hooks/useSuperAdminServices';
import { useLaundries } from '../../hooks/useLaundries';

const CATEGORIES = [
  { value: '', label: 'All Categories' },
  { value: 'wash', label: 'Wash' },
  { value: 'dry_clean', label: 'Dry Clean' },
  { value: 'iron', label: 'Iron' },
  { value: 'wash_iron', label: 'Wash & Iron' },
  { value: 'premium', label: 'Premium' },
];

const categoryBadgeStyles = {
  wash: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  dry_clean: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  iron: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  wash_iron: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  premium: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
};

export const Services = () => {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [laundryId, setLaundryId] = useState('');
  const [status, setStatus] = useState('');
  const [today, setToday] = useState(false);

  // Load laundries for filter dropdown
  const { data: laundriesResponse } = useLaundries({ limit: 100 });
  const laundries = laundriesResponse?.data || [];

  const queryParams = useMemo(
    () => ({
      ...(search.trim() ? { search: search.trim() } : {}),
      ...(category ? { category } : {}),
      ...(laundryId ? { laundryId } : {}),
      ...(status ? { status } : {}),
      ...(today ? { today: 'true' } : {}),
      limit: 100,
    }),
    [search, category, laundryId, status, today]
  );

  const { data, isLoading, isError, error, refetch, isFetching } = useSuperAdminServices(queryParams);
  const services = data?.data || [];
  const total = data?.total ?? services.length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
      className="space-y-6 pb-14 font-sans"
    >
      {/* Header */}
      <div className="glass-card rounded-2xl border border-white/8 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-[0_0_20px_rgba(168,85,247,0.25)] text-purple-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-textPrimary tracking-tight">Services & Catalog Oversight</h1>
            <p className="text-xs sm:text-sm text-textSecondary mt-0.5 max-w-xl">
              Platform-wide read-only view of laundry services, garment categories, pricing, and turnaround SLA.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 border border-white/8 text-textMuted hover:text-textPrimary transition-all"
            title="Refresh services"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Info Banner: Read-Only Governance */}
      <div className="p-4 rounded-xl bg-indigo-500/[0.07] border border-indigo-500/20 text-indigo-200/90 flex items-start gap-3 text-xs leading-relaxed">
        <Info className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-indigo-300">Catalog Governance Policy:</span> Pricing and garment customizations are managed autonomously by individual verified laundry stores. Super Admin maintains platform-wide visibility and monitoring for quality and fair pricing compliance.
        </div>
      </div>

      {/* Filter Control Bar */}
      <div className="glass-card rounded-2xl border border-white/8 p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-textMuted pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by service name..."
              className="input-glass pl-9 w-full text-xs"
            />
          </div>

          {/* Laundry Filter */}
          <div className="relative">
            <Store className="absolute left-3 top-2.5 w-4 h-4 text-textMuted pointer-events-none" />
            <select
              value={laundryId}
              onChange={(e) => setLaundryId(e.target.value)}
              className="input-glass pl-9 w-full text-xs appearance-none"
            >
              <option value="" className="bg-slate-900 text-slate-300">All Laundry Stores</option>
              {laundries.map((l) => (
                <option key={l._id} value={l._id} className="bg-slate-900 text-slate-100">
                  {l.name} ({l.city})
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div className="relative">
            <Tag className="absolute left-3 top-2.5 w-4 h-4 text-textMuted pointer-events-none" />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="input-glass pl-9 w-full text-xs appearance-none"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value} className="bg-slate-900 text-slate-100">
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-2.5 w-4 h-4 text-textMuted pointer-events-none" />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="input-glass pl-9 w-full text-xs appearance-none"
            >
              <option value="" className="bg-slate-900 text-slate-300">All Statuses</option>
              <option value="active" className="bg-slate-900 text-slate-100">Active Only</option>
              <option value="inactive" className="bg-slate-900 text-slate-100">Inactive Only</option>
            </select>
          </div>
        </div>

        {/* Quick Filter: Today */}
        <div className="flex items-center gap-2 pt-2 border-t border-white/6">
          <button
            type="button"
            onClick={() => setToday(!today)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
              today
                ? 'bg-purple-600 text-white border-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.4)]'
                : 'bg-white/5 border-white/10 text-textMuted hover:text-textPrimary hover:bg-white/10'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Today&apos;s Catalog Items
          </button>
        </div>
      </div>

      {/* Main Table / Content */}
      <div className="glass-card rounded-2xl border border-white/8 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/6">
          <span className="text-xs font-semibold text-textPrimary">
            Total Services: <span className="text-purple-400">{total}</span>
          </span>
        </div>

        {isLoading ? (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-purple-500/30 border-t-purple-400 animate-spin" />
            <span className="text-xs text-textMuted">Loading services catalog...</span>
          </div>
        ) : isError ? (
          <div className="p-10 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
            <p className="text-xs text-textMuted">
              {error?.response?.data?.message || 'Failed to load services catalog.'}
            </p>
            <button
              onClick={() => refetch()}
              className="px-4 py-1.5 rounded-xl text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20"
            >
              Retry
            </button>
          </div>
        ) : services.length === 0 ? (
          <div className="py-16 px-6 text-center flex flex-col items-center justify-center">
            <img
              src="/images/services_empty.jpg"
              alt="Services empty"
              className="w-44 h-44 object-contain rounded-2xl shadow-xl shadow-purple-500/10 border border-white/10 mb-4"
            />
            <h3 className="text-base font-bold text-textPrimary mb-1">No services found</h3>
            <p className="text-xs text-textMuted max-w-sm">
              No service offerings match your current filter selection. Try changing the store or category.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] border-collapse">
              <thead>
                <tr className="border-b border-white/8">
                  {['Service', 'Store / Laundry', 'Category', 'Price & Unit', 'Turnaround', 'Sub-Items', 'Status'].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-3 text-left text-[10px] font-semibold text-textMuted uppercase tracking-wider whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/4">
                {services.map((item, idx) => {
                  const catKey = item.category?.toLowerCase() || 'wash';
                  const badgeClass = categoryBadgeStyles[catKey] || 'bg-slate-500/10 text-slate-400 border-slate-500/20';
                  const laundryStore = item.laundryId?.name || 'Unassigned';
                  const laundryCity = item.laundryId?.city ? ` (${item.laundryId.city})` : '';
                  const subItemCount = item.items?.length || 0;

                  return (
                    <tr key={item._id || idx} className="hover:bg-white/[0.02] transition-colors">
                      {/* Service Name & Description */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-9 h-9 rounded-lg object-cover border border-white/10 flex-shrink-0"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 flex-shrink-0">
                              <Sparkles className="w-4 h-4" />
                            </div>
                          )}
                          <div>
                            <p className="text-xs font-semibold text-textPrimary leading-tight">{item.name}</p>
                            {item.description && (
                              <p className="text-[11px] text-textMuted truncate max-w-xs mt-0.5">{item.description}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Store */}
                      <td className="px-5 py-3.5">
                        <span className="text-xs text-textSecondary font-medium">
                          {laundryStore}{laundryCity}
                        </span>
                      </td>

                      {/* Category */}
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${badgeClass}`}>
                          {item.category?.replace('_', ' ')}
                        </span>
                      </td>

                      {/* Price & Unit */}
                      <td className="px-5 py-3.5">
                        <div className="text-xs font-bold text-textPrimary">
                          ₹{item.price}{' '}
                          <span className="text-[10px] font-normal text-textMuted">
                            / {item.unit?.replace('_', ' ') || 'piece'}
                          </span>
                        </div>
                      </td>

                      {/* Turnaround */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5 text-xs text-textSecondary">
                          <Clock className="w-3.5 h-3.5 text-textMuted" />
                          <span>{item.estimatedText || `${item.estimatedHours || 24} hrs`}</span>
                        </div>
                      </td>

                      {/* Sub-Items */}
                      <td className="px-5 py-3.5">
                        {subItemCount > 0 ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
                            <Layers className="w-3 h-3" />
                            {subItemCount} garment{subItemCount !== 1 ? 's' : ''}
                          </span>
                        ) : (
                          <span className="text-[11px] text-textMuted">—</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3.5">
                        {item.isActive ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                            <CheckCircle2 className="w-3 h-3" /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-400 bg-slate-500/10 px-2 py-0.5 rounded-full border border-slate-500/20">
                            <XCircle className="w-3 h-3" /> Inactive
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default Services;
