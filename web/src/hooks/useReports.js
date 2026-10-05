import { useQuery } from '@tanstack/react-query';
import { getReportsApi } from '../api/reports';

/**
 * useReports — TanStack Query hook for Super Admin Report data.
 * Data source: GET /api/super-admin/reports
 */
export const useReports = (params = {}) => {
  return useQuery({
    queryKey: ['superadmin', 'reports', params],
    queryFn: () => getReportsApi(params),
    staleTime: 2 * 60 * 1000,       // 2 min — reports don't change second by second
    gcTime: 5 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
  });
};

export default useReports;
