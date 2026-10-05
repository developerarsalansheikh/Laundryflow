import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CreditCard,
  Package,
  Clock,
  AlertTriangle,
  Plus,
  Calendar,
  Truck,
  Settings,
  ArrowRight,
  CheckCircle2,
  RefreshCw,
  ShoppingBag,
  ArrowUpRight,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { adminApi } from '../../api/adminApi';
import { ROUTES } from '../../routes/routeConstants';

export const AdminDashboard = () => {
  const navigate = useNavigate();

  // 1. Dashboard metrics
  const {
    data: stats,
    refetch: refetchStats,
  } = useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: adminApi.getDashboard,
    refetchInterval: 1000 * 45,
  });

  // 2. Recent orders
  const {
    data: ordersData,
    isLoading: ordersLoading,
    refetch: refetchOrders,
  } = useQuery({
    queryKey: ['admin-recent-orders'],
    queryFn: () => adminApi.getOrders({ limit: 5 }),
    refetchInterval: 1000 * 45,
  });

  const orders = ordersData?.orders || ordersData?.data || [];
  const metrics = stats?.stats || stats || {};

  const totalRevenue = metrics.totalRevenue || 0;
  const totalOrders = metrics.totalOrders || 0;
  const activeOrders = metrics.activeOrders || 0;
  const pendingOrders = metrics.pendingOrders || 0;

  // Chart data
  const chartData = stats?.revenueByDay || [
    { day: 'Mon', revenue: Math.round(totalRevenue * 0.12) },
    { day: 'Tue', revenue: Math.round(totalRevenue * 0.15) },
    { day: 'Wed', revenue: Math.round(totalRevenue * 0.1) },
    { day: 'Thu', revenue: Math.round(totalRevenue * 0.18) },
    { day: 'Fri', revenue: Math.round(totalRevenue * 0.22) },
    { day: 'Sat', revenue: Math.round(totalRevenue * 0.13) },
    { day: 'Sun', revenue: Math.round(totalRevenue * 0.1) },
  ];

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            PENDING
          </span>
        );
      case 'picked_up':
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/15 text-blue-300 border border-blue-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            {status.replace(/_/g, ' ').toUpperCase()}
          </span>
        );
      case 'ready':
      case 'out_for_delivery':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
            {status.replace(/_/g, ' ').toUpperCase()}
          </span>
        );
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            DELIVERED
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-red-500/15 text-red-300 border border-red-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
            CANCELLED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/10 text-textSecondary border border-white/10">
            {status?.toUpperCase() || 'UNKNOWN'}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Top Header & Actions ─────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-textPrimary">
              Store Operations
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live & Open
            </span>
          </div>
          <p className="text-xs text-textMuted mt-1">
            Real-time analytics, order dispatch and catalog management
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              refetchStats();
              refetchOrders();
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-white/[0.04] text-textSecondary hover:text-textPrimary hover:bg-white/[0.08] border border-white/[0.08] transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync</span>
          </button>

          <button
            onClick={() => navigate(ROUTES.ADMIN.SERVICES_NEW)}
            className="btn-primary px-4 py-2 text-xs font-semibold gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Service</span>
          </button>
        </div>
      </div>

      {/* ── Attention Banner (Pending Orders) ────────────────────── */}
      {pendingOrders > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 backdrop-blur-md"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex-shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-textPrimary">
                {pendingOrders} {pendingOrders === 1 ? 'Order' : 'Orders'} Awaiting Pickup Confirmation
              </p>
              <p className="text-xs text-textSecondary mt-0.5">
                New customer orders require verification or delivery boy dispatch.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate(`${ROUTES.ADMIN.ORDERS}?status=pending`)}
            className="px-3.5 py-1.5 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl transition-colors shadow-sm self-start sm:self-auto"
          >
            Review Orders
          </button>
        </motion.div>
      )}

      {/* ── 4 Primary Metric Stat Cards (Super Admin Style) ─────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="glass-card p-5 relative overflow-hidden group hover:border-emerald-500/40 transition-colors duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-textSecondary">Total Sales Revenue</span>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-textPrimary tracking-tight">
              ₹{Number(totalRevenue).toLocaleString('en-IN')}
            </div>
            <p className="text-[11px] text-textMuted mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Fulfilled orders value</span>
            </p>
          </div>
        </div>

        {/* Total Orders */}
        <div className="glass-card p-5 relative overflow-hidden group hover:border-primaryPurple/40 transition-colors duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-textSecondary">Total Store Orders</span>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-primaryPurple/15 border border-primaryPurple/30 text-primaryPurple">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-textPrimary tracking-tight">
              {totalOrders}
            </div>
            <p className="text-[11px] text-textMuted mt-1">
              Lifetime customer orders
            </p>
          </div>
        </div>

        {/* Active Processing */}
        <div className="glass-card p-5 relative overflow-hidden group hover:border-blue-500/40 transition-colors duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-textSecondary">Active Processing</span>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-blue-500/15 border border-blue-500/30 text-blue-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-textPrimary tracking-tight">
              {activeOrders}
            </div>
            <p className="text-[11px] text-textMuted mt-1">
              In pickup, wash, dry, or delivery
            </p>
          </div>
        </div>

        {/* Pending Action */}
        <div className="glass-card p-5 relative overflow-hidden group hover:border-amber-500/40 transition-colors duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-textSecondary">Pending Review</span>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-amber-500/15 border border-amber-500/30 text-amber-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-textPrimary tracking-tight">
              {pendingOrders}
            </div>
            <p className="text-[11px] text-textMuted mt-1">
              Needs pickup verification
            </p>
          </div>
        </div>
      </div>

      {/* ── Revenue Chart & Store Operations Grid ───────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Weekly Revenue Trend (7 cols) */}
        <div className="lg:col-span-7 glass-card p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-textPrimary">
                Revenue & Operations Velocity
              </h2>
              <p className="text-xs text-textMuted mt-0.5">
                Weekly fulfillment distribution
              </p>
            </div>
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-white/[0.04] text-textSecondary border border-white/[0.08]">
              Current Week
            </span>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="day" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#080C1D',
                    borderColor: 'rgba(255,255,255,0.12)',
                    borderRadius: '12px',
                    color: '#F8FAFC',
                    fontSize: '12px',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.7)',
                  }}
                  formatter={(val) => [`₹${val}`, 'Revenue']}
                />
                <Bar dataKey="revenue" fill="#7C3AED" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Operations Shortcuts (5 cols) */}
        <div className="lg:col-span-5 glass-card p-6 flex flex-col justify-between space-y-4">
          <div>
            <h2 className="text-sm font-bold text-textPrimary">
              Store Control Center
            </h2>
            <p className="text-xs text-textMuted mt-0.5 mb-4">
              Direct access to facility operations
            </p>

            <div className="space-y-2.5">
              <button
                onClick={() => navigate(ROUTES.ADMIN.SERVICES)}
                className="w-full flex items-center justify-between p-3.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.06] hover:border-primaryPurple/30 transition-all text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-primaryPurple/15 text-purpleLight border border-primaryPurple/25">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-textPrimary group-hover:text-purpleLight transition-colors">
                      Catalog & Pricing
                    </p>
                    <p className="text-[11px] text-textMuted">Configure laundry services</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-textMuted group-hover:translate-x-1 group-hover:text-textPrimary transition-all" />
              </button>

              <button
                onClick={() => navigate(ROUTES.ADMIN.DELIVERY)}
                className="w-full flex items-center justify-between p-3.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.06] hover:border-blue-500/30 transition-all text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/25">
                    <Truck className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-textPrimary group-hover:text-blue-400 transition-colors">
                      Delivery & Dispatch
                    </p>
                    <p className="text-[11px] text-textMuted">Assign driver fleet</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-textMuted group-hover:translate-x-1 group-hover:text-textPrimary transition-all" />
              </button>

              <button
                onClick={() => navigate(ROUTES.ADMIN.TIME_SLOTS)}
                className="w-full flex items-center justify-between p-3.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.06] hover:border-cyan-500/30 transition-all text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/25">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-textPrimary group-hover:text-cyan-400 transition-colors">
                      Pickup Schedule
                    </p>
                    <p className="text-[11px] text-textMuted">Weekly operating slots</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-textMuted group-hover:translate-x-1 group-hover:text-textPrimary transition-all" />
              </button>

              <button
                onClick={() => navigate(ROUTES.ADMIN.PROFILE)}
                className="w-full flex items-center justify-between p-3.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.06] hover:border-emerald-500/30 transition-all text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                    <Settings className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-textPrimary group-hover:text-emerald-400 transition-colors">
                      Store Profile
                    </p>
                    <p className="text-[11px] text-textMuted">Address, radius & fees</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-textMuted group-hover:translate-x-1 group-hover:text-textPrimary transition-all" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Recent Orders Table in Glass Surface ────────────────── */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-textPrimary">Recent Orders</h2>
            <p className="text-xs text-textMuted mt-0.5">
              Latest activity submitted to your laundry facility
            </p>
          </div>
          <button
            onClick={() => navigate(ROUTES.ADMIN.ORDERS)}
            className="flex items-center gap-1 text-xs font-semibold text-purpleLight hover:underline"
          >
            <span>View all orders</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {ordersLoading ? (
          <div className="py-12 text-center text-xs text-textMuted">Loading recent orders...</div>
        ) : orders.length === 0 ? (
          <div className="py-12 text-center">
            <Package className="w-8 h-8 text-textMuted/40 mx-auto mb-2" />
            <p className="text-xs text-textMuted">No customer orders recorded yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-white/[0.07] text-[11px] font-semibold text-textMuted uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-3">Order ID</th>
                  <th className="py-3 px-3">Customer</th>
                  <th className="py-3 px-3">Items</th>
                  <th className="py-3 px-3">Amount</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04] text-textSecondary">
                {orders.map((order) => {
                  const idShort = order._id ? `#${order._id.slice(-6).toUpperCase()}` : '#ORDER';
                  const custName = order.user?.name || order.customerId?.name || 'Customer';
                  const total = order.totalAmount || order.pricing?.total || 0;
                  const itemsCount = order.items?.length || 0;

                  return (
                    <tr
                      key={order._id}
                      className="hover:bg-white/[0.03] transition-colors"
                    >
                      <td className="py-3.5 px-3 font-mono font-bold text-textPrimary">
                        {idShort}
                      </td>
                      <td className="py-3.5 px-3 font-medium text-textPrimary">
                        {custName}
                      </td>
                      <td className="py-3.5 px-3 text-textMuted">
                        {itemsCount} {itemsCount === 1 ? 'service' : 'services'}
                      </td>
                      <td className="py-3.5 px-3 font-bold text-textPrimary">
                        ₹{Number(total).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-3">{getStatusBadge(order.status)}</td>
                      <td className="py-3.5 px-3 text-right">
                        <button
                          onClick={() => navigate(`${ROUTES.ADMIN.ORDERS}/${order._id}`)}
                          className="px-3 py-1.5 text-xs font-semibold text-purpleLight hover:bg-primaryPurple/20 rounded-lg transition-colors border border-primaryPurple/30"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
