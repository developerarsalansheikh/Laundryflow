import { useQuery } from '@tanstack/react-query';
import { getSuperAdminServicesApi } from '../api/superAdminServices';

/**
 * Hook to query platform services catalog with filters.
 */
export const useSuperAdminServices = (params = {}) => {
  return useQuery({
    queryKey: ['superadmin', 'services', params],
    queryFn: () => getSuperAdminServicesApi(params),
    staleTime: 1000 * 60 * 2,
    keepPreviousData: true,
  });
};

export default useSuperAdminServices;
