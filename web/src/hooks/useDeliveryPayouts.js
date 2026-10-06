import { useQuery } from '@tanstack/react-query';
import { getDeliveryPayoutsApi } from '../api/deliveryPayouts';

/**
 * Hook to query delivery partner commissions and payouts.
 */
export const useDeliveryPayouts = (params = {}) => {
  return useQuery({
    queryKey: ['superadmin', 'delivery-payouts', params],
    queryFn: () => getDeliveryPayoutsApi(params),
    staleTime: 1000 * 60 * 2,
    keepPreviousData: true,
  });
};

export default useDeliveryPayouts;
