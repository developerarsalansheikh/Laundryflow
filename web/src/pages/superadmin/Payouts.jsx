import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Coins,
  Truck,
  Store,
  CheckCircle2,
  Clock,
  Filter,
  AlertCircle,
  RefreshCw,
  Info,
} from 'lucide-react';
import { useDeliveryPayouts } from '../../hooks/useDeliveryPayouts';
import { useDeliveryPartners } from '../../hooks/useEmployees';
import { useLaundries } from '../../hooks/useLaundries';

export const Payouts = () => {
  const [driverId, setDriverId] = useState('');
  const [laundryId, setLaundryId] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [timeframe, setTimeframe] = useState('all'); // 'all' | 'today'

  // Dropdown lists
  const { data: driversResponse } = useDeliveryPartners();
  const drivers = driversResponse?.data || [];

  const { data: laundriesResponse } = useLaundries({ limit: 100 });
  const laundries = laundriesResponse?.data || [];

  const queryParams = useMemo(
    () => ({
      ...(driverId ? { driverId } : {}),
      ...(laundryId ? { laundryId } : {}),
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(timeframe === 'today' ? { timeframe: 'today', today: 'true' } : {}),
      limit: 100,
    }),
    [driverId, laundryId, statusFilter, timeframe]
  );

  const { data, isLoading, isError, error, refetch, isFetching } = useDeliveryPayouts(queryParams);
  const payouts = useMemo(() => data?.data || [], [data?.data]);
  const total = data?.total ?? payouts.length;
  const todaySummary = data?.todaySummary || {};

  // Calculated summary metrics from actual data
  const totalEarned = useMemo(() => {
    return payouts
      .filter((p) => p.payoutStatus === 'earned')
      .reduce((sum, p) => sum + (p.commissionAmount || 0), 0);
  }, [payouts]);

  const completedCount = useMemo(() => {
    return payouts.filter((p) => p.payoutStatus === 'earned').length;
  }, [payouts]);

  const pendingCount = useMemo(() => {
    return payouts.filter((p) => p.payoutStatus === 'pending').length;
  }, [payouts]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
      className="space-y-6 pb-14 font-sans"
    >
      {/* Page Header */}
      <div className="glass-card rounded-2xl border border-white/8 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-[0_0_20px_rgba(16,185,129,0.25)] text-emerald-400">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-textPrimary tracking-tight">Delivery Agent Payouts & Commission</h1>
            <p className="text-xs sm:text-sm text-textSecondary mt-0.5 max-w-xl">
              Audit driver trip earnings, delivery fees, and per-order payouts calculated via configured store rates.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Timeframe quick toggle */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/10">
            <button
              onClick={() => setTimeframe('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                timeframe === 'all'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-textMuted hover:text-textPrimary'
              }`}
            >
              All Time
            </button>
            <button
              onClick={() => setTimeframe('today')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                timeframe === 'today'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-[0_0_15px_rgba(16,185,129,0.35)]'
                  : 'text-textMuted hover:text-textPrimary'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              Today&apos;s Activity
            </button>
          </div>

          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 border border-white/8 text-textMuted hover:text-textPrimary transition-all"
            title="Refresh payouts"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card rounded-2xl border border-white/8 p-5">
          <p className="text-xs font-medium text-textMuted uppercase tracking-wider">
            {timeframe === 'today' ? "Today's Disbursed Earnings" : 'Total Disbursed Earnings'}
          </p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">
            ₹{(timeframe === 'today' ? (todaySummary.todayEarned ?? totalEarned) : totalEarned).toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-textSecondary mt-1">
            {timeframe === 'today' ? `${todaySummary.todayDeliveredCount ?? completedCount} delivered today` : `${completedCount} delivered orders credited`}
          </p>
        </div>

        <div className="glass-card rounded-2xl border border-white/8 p-5">
          <p className="text-xs font-medium text-textMuted uppercase tracking-wider">Today&apos;s Delivered Orders</p>
          <p className="text-2xl font-bold text-indigo-400 mt-1">{todaySummary.todayDeliveredCount ?? 0}</p>
          <p className="text-[11px] text-textSecondary mt-1">Completed successfully today (IST)</p>
        </div>

        <div className="glass-card rounded-2xl border border-white/8 p-5">
          <p className="text-xs font-medium text-textMuted uppercase tracking-wider">In-Transit / Active Today</p>
          <p className="text-2xl font-bold text-amber-400 mt-1">{todaySummary.todayPendingCount ?? pendingCount}</p>
          <p className="text-[11px] text-textSecondary mt-1">Active deliveries awaiting customer OTP</p>
        </div>

        <div className="glass-card rounded-2xl border border-white/8 p-5">
          <p className="text-xs font-medium text-textMuted uppercase tracking-wider">Active Delivery Workforce</p>
          <p className="text-2xl font-bold text-cyan-400 mt-1">{drivers.length}</p>
          <p className="text-[11px] text-textSecondary mt-1">Registered delivery partners</p>
        </div>
      </div>

      {/* Governance Note */}
      <div className="p-4 rounded-xl bg-emerald-500/[0.07] border border-emerald-500/20 text-emerald-200/90 flex items-start gap-3 text-xs leading-relaxed">
        <Info className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-emerald-300">Driver Pay Architecture:</span> Driver earnings are credited per successfully delivered order based on the store&apos;s configured <code className="font-mono text-emerald-300">deliveryPartnerEarningPerOrder</code> (default ₹50). Earnings are recorded immediately upon customer verification OTP confirmation.
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card rounded-2xl border border-white/8 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Truck className="absolute left-3 top-2.5 w-4 h-4 text-textMuted pointer-events-none" />
            <select
              value={driverId}
              onChange={(e) => setDriverId(e.target.value)}
              className="input-glass pl-9 w-full text-xs appearance-none"
            >
              <option value="" className="bg-slate-900 text-slate-300">All Delivery Agents</option>
              {drivers.map((d) => (
                <option key={d._id} value={d._id} className="bg-slate-900 text-slate-100">
                  {d.name} ({d.phone})
                </option>
              ))}
            </select>
          </div>

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

          <div className="relative">
            <Filter className="absolute left-3 top-2.5 w-4 h-4 text-textMuted pointer-events-none" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-glass pl-9 w-full text-xs appearance-none"
            >
              <option value="" className="bg-slate-900 text-slate-300">All Order Statuses</option>
              <option value="delivered" className="bg-slate-900 text-slate-100">Delivered Only</option>
              <option value="out_for_delivery" className="bg-slate-900 text-slate-100">Out for Delivery</option>
              <option value="picked_up" className="bg-slate-900 text-slate-100">Picked Up</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="glass-card rounded-2xl border border-white/8 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-white/6 flex items-center justify-between">
          <span className="text-xs font-semibold text-textPrimary">
            Payout Records: <span className="text-emerald-400">{total}</span>
          </span>
        </div>

        {isLoading ? (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-emerald-500/30 border-t-emerald-400 animate-spin" />
            <span className="text-xs text-textMuted">Loading commission transactions...</span>
          </div>
        ) : isError ? (
          <div className="p-10 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
            <p className="text-xs text-textMuted">{error?.response?.data?.message || 'Failed to load payouts.'}</p>
          </div>
        ) : payouts.length === 0 ? (
          <div className="py-16 px-6 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3">
              <Coins className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-textPrimary mb-1">No payout transactions recorded</h3>
            <p className="text-xs text-textMuted max-w-sm">
              Deliveries assigned to drivers will populate their commission earnings ledger automatically.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse">
              <thead>
                <tr className="border-b border-white/8">
                  {['Delivery Agent', 'Order ID', 'Store / Laundry', 'Order Total', 'Driver Earning', 'Status', 'Delivered At'].map((h) => (
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
                {payouts.map((item, idx) => {
                  const agent = item.deliveryAgent;
                  const laundry = item.laundry;
                  const isEarned = item.payoutStatus === 'earned';

                  return (
                    <tr key={item._id || idx} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-xs font-bold text-indigo-300">
                            {agent?.name ? agent.name.charAt(0).toUpperCase() : 'D'}
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-textPrimary leading-tight">
                              {agent?.name || 'Unassigned'}
                            </p>
                            <p className="text-[11px] text-textMuted font-mono mt-0.5">
                              {agent?.phone || '—'} {agent?.vehicleType ? `• ${agent.vehicleType}` : ''}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-3.5">
                        <span className="text-xs font-mono text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                          #{String(item.orderId || '').slice(-6).toUpperCase()}
                        </span>
                      </td>

                      <td className="px-5 py-3.5">
                        <span className="text-xs text-textSecondary font-medium">
                          {laundry?.name || '—'} {laundry?.city ? `(${laundry.city})` : ''}
                        </span>
                      </td>

                      <td className="px-5 py-3.5">
                        <span className="text-xs font-semibold text-textPrimary">
                          ₹{item.orderTotal || 0}
                        </span>
                      </td>

                      <td className="px-5 py-3.5">
                        <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          +₹{item.commissionAmount || 50}
                        </span>
                      </td>

                      <td className="px-5 py-3.5">
                        {isEarned ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                            <CheckCircle2 className="w-3 h-3" /> Earned
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                            <Clock className="w-3 h-3" /> In Progress
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-3.5">
                        <span className="text-xs text-textMuted font-mono">
                          {item.deliveredAt
                            ? new Date(item.deliveredAt).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : new Date(item.createdAt).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                              })}
                        </span>
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

export default Payouts;
