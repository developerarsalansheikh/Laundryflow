import { useQuery } from '@tanstack/react-query';
import {
  getSuperAdminOrdersApi,
  getSuperAdminOrderStatsApi,
  getSuperAdminOrderByIdApi,
} from '../api/orders';

/**
 * Fetch platform orders with pagination, search, status, and laundry filters.
 * Backed by: GET /api/super-admin/orders
 */
export const useOrders = (params = {}) => {
  return useQuery({
    queryKey: ['superadmin', 'orders', params],
    queryFn: () => getSuperAdminOrdersApi(params),
    staleTime: 1000 * 60 * 2,
    keepPreviousData: true,
  });
};

/**
 * Fetch platform order aggregate statistics from dashboard endpoint.
 * Backed by: GET /api/super-admin/dashboard
 */
export const useOrderStats = () => {
  return useQuery({
    queryKey: ['superadmin', 'dashboard'],
    queryFn: getSuperAdminOrderStatsApi,
    staleTime: 1000 * 60 * 2,
  });
};

/**
 * Fetch single order details by ID for SuperAdmin.
 * Backed by: GET /api/super-admin/orders/:id
 */
export const useOrderDetails = (id) => {
  return useQuery({
    queryKey: ['superadmin', 'order', id],
    queryFn: () => getSuperAdminOrderByIdApi(id),
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 5,
  });
};
