import { motion } from 'framer-motion';
import { RefreshCw, AlertTriangle } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import { useAnalytics } from '../../hooks/useAnalytics';
import { AnalyticsHeader } from '../../components/superadmin/analytics/AnalyticsHeader';
import { AnalyticsSummary } from '../../components/superadmin/analytics/AnalyticsSummary';
import { RevenueAnalytics } from '../../components/superadmin/analytics/RevenueAnalytics';
import { OrdersAnalytics } from '../../components/superadmin/analytics/OrdersAnalytics';
import { PaymentAnalytics } from '../../components/superadmin/analytics/PaymentAnalytics';
import { LaundryPerformance } from '../../components/superadmin/analytics/LaundryPerformance';
import { CityDistributionAnalytics } from '../../components/superadmin/analytics/CityDistributionAnalytics';
import { AnalyticsSkeleton } from '../../components/superadmin/analytics/AnalyticsSkeleton';
import { AnalyticsEmptyState } from '../../components/superadmin/analytics/AnalyticsEmptyState';

const pageVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

/**
 * SuperAdmin Analytics Page — /superadmin/analytics
 *
 * Real platform intelligence dashboard using backend aggregates.
 * Data source: GET /api/super-admin/analytics
 */
export const Analytics = () => {
  const queryClient = useQueryClient();

  const { data: analyticsData, isLoading, isError, error, isFetching, refetch } = useAnalytics();

  const data = analyticsData?.data || {};

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['superadmin', 'analytics'] });
    toast.success('Analytics intelligence refreshed.');
  };

  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      className="space-y-5"
    >
      {/* Header */}
      <div className="glass-card rounded-2xl border border-white/8 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <AnalyticsHeader />
        <button
          id="analytics-refresh-btn"
          onClick={handleRefresh}
          disabled={isFetching}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/8 text-xs font-semibold text-textSecondary hover:text-textPrimary transition-all disabled:opacity-50 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Error state */}
      {isError && (
        <div className="glass-card rounded-2xl border border-white/8 flex flex-col items-center justify-center py-16 px-6 text-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-rose-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-textPrimary">Unable to load analytics data</p>
            <p className="text-xs text-textMuted mt-1">
              {error?.response?.status === 403
                ? 'Access denied by backend. SuperAdmin session required.'
                : 'A server error occurred while computing platform analytics.'}
            </p>
          </div>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 text-xs font-semibold text-purple-400 bg-purple-500/10 border border-purple-500/20 rounded-xl hover:bg-purple-500/20 transition-all"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && !isError && <AnalyticsSkeleton />}

      {/* Analytics Content */}
      {!isLoading && !isError && (
        <>
          {/* High level metrics */}
          <AnalyticsSummary analyticsData={analyticsData} isLoading={isLoading} />

          {/* Revenue & Commission Trends Chart (Full Width) */}
          <RevenueAnalytics monthlyTrends={data.monthlyTrends || []} />

          {/* Grid 1: Orders & Payment Method Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <OrdersAnalytics orderStatusBreakdown={data.orderStatusBreakdown || []} />
            <PaymentAnalytics paymentMethodBreakdown={data.paymentMethodBreakdown || []} />
          </div>

          {/* Grid 2: Top Laundries & City Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <LaundryPerformance topLaundries={data.topLaundries || []} />
            <CityDistributionAnalytics cityDistribution={data.cityDistribution || []} />
          </div>
        </>
      )}

      {!isLoading && !isError && Object.keys(data).length === 0 && (
        <AnalyticsEmptyState onRetry={handleRefresh} />
      )}
    </motion.div>
  );
};

export default Analytics;
