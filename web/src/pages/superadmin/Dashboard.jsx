import { motion } from 'framer-motion';
import {
  useDashboardStats,
  useTopLaundries,
  useSuperAdminPayments,
} from '../../hooks/useDashboardData';

import { DashboardHeader } from '../../components/superadmin/DashboardHeader';
import { StatsGrid } from '../../components/superadmin/StatsGrid';
import { RevenueOverview } from '../../components/superadmin/RevenueOverview';
import { BusinessInsights } from '../../components/superadmin/BusinessInsights';
import { TopLaundries } from '../../components/superadmin/TopLaundries';
import { RecentOrders } from '../../components/superadmin/RecentOrders';
import { PaymentsOverview } from '../../components/superadmin/PaymentsOverview';
import { LiveActivity } from '../../components/superadmin/LiveActivity';
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

      {/* ── 2. Stats Grid ───────────────────────────────────────────────────── */}
      {/* Revenue · Orders · Customers · Laundries — from /api/super-admin/dashboard */}
      <StatsGrid stats={stats} />

      {/* ── 3. Middle Row ───────────────────────────────────────────────────── */}
      {/* Revenue (7 cols) | AI Insights (2 cols) | Live Activity (3 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Revenue Overview — 7/12 cols
            totalRevenue and totalCommission from /api/super-admin/dashboard stats.
            historyData empty: backend does not expose time-series revenue history.
            Renders polished empty state inside the chart area. */}
        <div className="lg:col-span-7">
          <RevenueOverview
            totalRevenue={stats.totalRevenue || 0}
            totalCommission={totalCommission}
            historyData={[]}
          />
        </div>

        {/* AI Business Insights — 2/12 cols
            Backend has no AI insights endpoint.
            Clearly-labeled coming-soon placeholder — no fabricated insights. */}
        <div className="lg:col-span-2">
          <BusinessInsights insights={[]} />
        </div>

        {/* Live Activity — 3/12 cols
            Backend has no audit/activity events endpoint.
            Socket.IO integration point — future phase.
            Empty state with "Socket.IO integration ready" indicator. */}
        <div className="lg:col-span-3">
          <LiveActivity activities={[]} />
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
