import { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';
import {
  useDashboardStats,
  useTopLaundries,
  useSuperAdminPayments,
} from '../../hooks/useDashboardData';

import { DashboardHeader } from '../../components/superadmin/DashboardHeader';
import { StatsGrid } from '../../components/superadmin/StatsGrid';
import { RevenueOverview } from '../../components/superadmin/RevenueOverview';
import { PendingStoreApprovals } from '../../components/superadmin/PendingStoreApprovals';
import { PlatformOperationsDistribution } from '../../components/superadmin/PlatformOperationsDistribution';
import { TopLaundries } from '../../components/superadmin/TopLaundries';
import { RecentOrders } from '../../components/superadmin/RecentOrders';
import { PaymentsOverview } from '../../components/superadmin/PaymentsOverview';
import { DashboardSkeleton } from '../../components/superadmin/DashboardSkeleton';
import { DashboardError } from '../../components/superadmin/DashboardError';

/**
 * SuperAdmin Dashboard Page — Phase 6.
 *
 * Data contracts (all from real backend endpoints):
 *   GET /api/super-admin/dashboard → stats + recentLaundries
 *   GET /api/super-admin/laundries?limit=5 → top laundries
 *   GET /api/super-admin/payments?limit=10 → recent transactions + payment method breakdown
 *
 * No fabricated data. Empty states shown when backend data is absent.
 */
export const Dashboard = () => {
  const [timeframe, setTimeframe] = useState('all'); // 'all' | 'today'

  // ── Primary dashboard stats ──────────────────────────────────────────────────
  const {
    data: dashData,
    isLoading: dashLoading,
    isError: dashError,
    error: dashErr,
    refetch: dashRefetch,
  } = useDashboardStats();

  // ── Top laundries (ranked by totalRevenue from laundry model) ────────────────
  const {
    data: laundriesData,
    isLoading: laundriesLoading,
  } = useTopLaundries();

  // ── Platform payments (RecentOrders + PaymentsOverview share this) ───────────
  const {
    data: paymentsData,
    isLoading: paymentsLoading,
  } = useSuperAdminPayments({ limit: 10 });

  // ── Global loading: wait for primary stats ───────────────────────────────────
  if (dashLoading) {
    return <DashboardSkeleton />;
  }

  // ── Error state ──────────────────────────────────────────────────────────────
  if (dashError) {
    return (
      <DashboardError
        message={
          dashErr?.response?.data?.message ||
          dashErr?.message ||
          'Unable to connect to LaundryFlow backend server.'
        }
        onRetry={dashRefetch}
      />
    );
  }

  // ── Extract real backend data ────────────────────────────────────────────────
  const stats = dashData?.stats || {};
  const topLaundries = laundriesData?.data || [];
  const payments = paymentsData?.data || [];
  const totalCommission = stats.totalCommission || 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
      className="space-y-6 pb-14 font-sans"
    >
      {/* ── 1. Page Header ──────────────────────────────────────────────────── */}
      {/* Dynamic time-based greeting + authenticated user name + Add Laundry CTA */}
      <DashboardHeader />

      {/* ── Timeframe Mode Quick Selector ─────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl glass-card border border-white/8">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${timeframe === 'today' ? 'bg-emerald-400 animate-pulse' : 'bg-purple-400'}`} />
          <span className="text-xs font-semibold text-textPrimary">
            {timeframe === 'today' ? "Today's Operational Highlights (IST)" : "Platform Cumulative Overview"}
          </span>
          <span className="hidden md:inline text-xs text-textMuted">
            {timeframe === 'today'
              ? '— Focusing on transactions, deliveries, and orders placed today'
              : '— All-time platform aggregates across all laundry stores'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/5 border border-white/10 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setTimeframe('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              timeframe === 'all'
                ? 'bg-purple-600 text-white shadow-[0_0_12px_rgba(168,85,247,0.4)]'
                : 'text-textMuted hover:text-textPrimary'
            }`}
          >
            All Time
          </button>
          <button
            type="button"
            onClick={() => setTimeframe('today')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              timeframe === 'today'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-[0_0_12px_rgba(16,185,129,0.35)]'
                : 'text-textMuted hover:text-textPrimary'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Today
          </button>
        </div>
      </div>

      {/* ── 2. Stats Grid ───────────────────────────────────────────────────── */}
      {/* Revenue · Orders · Customers · Laundries — with timeframe toggle support */}
      <StatsGrid stats={stats} timeframe={timeframe} />

      {/* ── 3. Middle Row ───────────────────────────────────────────────────── */}
      {/* Revenue (6 cols) | Pending Store Approvals (3 cols) | Store Health Distribution (3 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Revenue Overview — 6/12 cols */}
        <div className="lg:col-span-6">
          <RevenueOverview
            totalRevenue={stats.totalRevenue || 0}
            totalCommission={totalCommission}
            historyData={[]}
          />
        </div>

        {/* Pending Approvals Queue — 3/12 cols */}
        <div className="lg:col-span-3">
          <PendingStoreApprovals
            recentLaundries={dashData?.recentLaundries || []}
            pendingCount={stats.pendingLaundries || 0}
          />
        </div>

        {/* Store Network Health & Workforce — 3/12 cols */}
        <div className="lg:col-span-3">
          <PlatformOperationsDistribution stats={stats} />
        </div>
      </div>

      {/* ── 4. Lower Row ────────────────────────────────────────────────────── */}
      {/* Recent Orders (5 cols) | Top Laundries (4 cols) | Payments (3 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Recent Orders — 5/12 cols
            Backed by /api/super-admin/payments (no dedicated recent-orders
            endpoint for super admin). Shows payment records as transaction feed. */}
        <div className="lg:col-span-5">
          <RecentOrders
            payments={payments}
            isLoading={paymentsLoading}
          />
        </div>

        {/* Top Laundries — 4/12 cols
            Backed by /api/super-admin/laundries.
            Uses real Laundry model fields: totalRevenue, totalOrders, status, city. */}
        <div className="lg:col-span-4">
          <TopLaundries
            laundries={topLaundries}
            isLoading={laundriesLoading}
          />
        </div>

        {/* Payments Overview — 3/12 cols
            Same payments data from /api/super-admin/payments.
            Donut chart only renders when real payment method breakdown exists.
            Empty state always shows totalCommission value. */}
        <div className="lg:col-span-3">
          <PaymentsOverview
            payments={payments}
            totalCommission={totalCommission}
            isLoading={paymentsLoading}
          />
        </div>
      </div>

      {/* ── 5. Footer ───────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="flex flex-col sm:flex-row items-center justify-between pt-6 border-t border-white/8 text-xs text-textMuted gap-2"
      >
        <p>&copy; {new Date().getFullYear()} LaundryFlow Platform Inc. All rights reserved.</p>
        <p className="flex items-center gap-1.5">
          <span>Super Admin Portal</span>
          <span className="w-1 h-1 rounded-full bg-white/20" aria-hidden="true" />
          <span className="text-purple-400 font-semibold">v1.0 · Production</span>
        </p>
      </motion.div>
    </motion.div>
  );
};

export default Dashboard;
