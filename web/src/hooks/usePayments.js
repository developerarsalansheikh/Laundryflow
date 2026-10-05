import { useQuery } from '@tanstack/react-query';
import {
  getSuperAdminPaymentsApi,
  getSuperAdminPaymentByIdApi,
} from '../api/payments';

/**
 * Fetch platform payments with server-side filtering, search, and pagination.
 */
export const usePayments = (params = {}) => {
  return useQuery({
    queryKey: ['superadmin', 'payments', params],
    queryFn: () => getSuperAdminPaymentsApi(params),
    staleTime: 1000 * 60 * 2,
    keepPreviousData: true,
  });
};

/**
 * Fetch detailed single payment record safely.
 */
export const usePaymentDetails = (id) => {
  return useQuery({
    queryKey: ['superadmin', 'payments', id],
    queryFn: () => getSuperAdminPaymentByIdApi(id),
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 2,
  });
};
