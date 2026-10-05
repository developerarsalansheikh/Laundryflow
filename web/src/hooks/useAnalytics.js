import { useQuery } from '@tanstack/react-query';
import { getSuperAdminAnalyticsApi } from '../api/analytics';

/**
 * Fetch platform intelligence & analytics aggregates.
 */
export const useAnalytics = () => {
  return useQuery({
    queryKey: ['superadmin', 'analytics'],
    queryFn: getSuperAdminAnalyticsApi,
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });
};
