import api from './axios';

/**
 * LaundryFlow Super Admin Orders API Service.
 *
 * Backend endpoints:
 * - GET /api/super-admin/orders (Platform-wide orders list with filtering & pagination)
 * - GET /api/super-admin/orders/:id (Platform-wide single order detail)
 * - GET /api/super-admin/dashboard (Platform aggregate stats)
 */

/**
 * Fetch platform-wide orders list for SuperAdmin.
 * GET /api/super-admin/orders
 * Params: status, laundryId, paymentStatus, search, startDate, endDate, page, limit
 * Response: { success, count, total, pages, currentPage, data: Order[] }
 */
export const getSuperAdminOrdersApi = async (params = {}) => {
  const response = await api.get('/api/super-admin/orders', { params });
  return response.data;
};

/**
 * Fetch platform aggregate stats.
 * GET /api/super-admin/dashboard
 * Response: { success, data: { stats: { totalOrders, totalRevenue, totalCommission, ... }, recentLaundries } }
 */
export const getSuperAdminOrderStatsApi = async () => {
  const response = await api.get('/api/super-admin/dashboard');
  return response.data.data;
};

/**
 * Fetch single order by ID for SuperAdmin.
 * GET /api/super-admin/orders/:id
 * Response: { success, data: Order }
 */
export const getSuperAdminOrderByIdApi = async (id) => {
  const response = await api.get(`/api/super-admin/orders/${id}`);
  return response.data.data;
};

export const ordersApi = {
  getSuperAdminOrdersApi,
  getSuperAdminOrderStatsApi,
  getSuperAdminOrderByIdApi,
};

export default ordersApi;
