import { useQuery } from '@tanstack/react-query';
import {
  getDashboardStatsApi,
  getSuperAdminLaundriesApi,
  getSuperAdminPaymentsApi,
} from '../api/dashboard';

/**
 * Custom hook for fetching super admin dashboard statistics & recent laundries.
 * Uses TanStack React Query for caching, automatic revalidation, and loading state.
 */
export const useDashboardStats = () => {
  return useQuery({
    queryKey: ['superadmin', 'dashboard'],
    queryFn: getDashboardStatsApi,
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchOnWindowFocus: true,
  });
};

/**
 * Custom hook for fetching top laundries ranked by total revenue.
 * Used by TopLaundries component on the dashboard.
 */
export const useTopLaundries = () => {
  return useQuery({
    queryKey: ['superadmin', 'laundries', 'top5'],
    queryFn: () => getSuperAdminLaundriesApi({ limit: 5, sort: '-totalRevenue' }),
    staleTime: 1000 * 60 * 5, // 5 minutes — changes less frequently
  });
};

/**
 * Custom hook for fetching all laundries (with pagination params).
 */
export const useSuperAdminLaundries = (params = { limit: 5 }) => {
  return useQuery({
    queryKey: ['superadmin', 'laundries', params],
    queryFn: () => getSuperAdminLaundriesApi(params),
    staleTime: 1000 * 60 * 2,
  });
};

/**
 * Custom hook for fetching platform payments overview.
 * Used by both PaymentsOverview (breakdown) and RecentTransactions.
 */
export const useSuperAdminPayments = (params = { limit: 10 }) => {
  return useQuery({
    queryKey: ['superadmin', 'payments', params],
    queryFn: () => getSuperAdminPaymentsApi(params),
    staleTime: 1000 * 60 * 2,
  });
};
