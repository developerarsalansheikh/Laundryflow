import api from './axios';

/**
 * LaundryFlow Super Admin Dashboard API Service.
 * Connects directly to existing backend endpoints defined in superAdminRoutes.js.
 * DO NOT invent endpoints or fake request payloads.
 */

/**
 * Fetch platform stats & recent laundries overview.
 * Endpoint: GET /api/super-admin/dashboard
 *
 * Backend response shape:
 * {
 *   success: true,
 *   data: {
 *     stats: { totalLaundries, activeLaundries, pendingLaundries, totalUsers, totalOrders, totalRevenue, totalCommission },
 *     recentLaundries: [ ... ]
 *   }
 * }
 */
export const getDashboardStatsApi = async () => {
  const response = await api.get('/api/super-admin/dashboard');
  return response.data.data;
};

/**
 * Fetch all laundries for super admin list.
 * Endpoint: GET /api/super-admin/laundries
 */
export const getSuperAdminLaundriesApi = async (params = {}) => {
  const response = await api.get('/api/super-admin/laundries', { params });
  return response.data;
};

/**
 * Fetch all users for super admin list.
 * Endpoint: GET /api/super-admin/users
 */
export const getSuperAdminUsersApi = async (params = {}) => {
  const response = await api.get('/api/super-admin/users', { params });
  return response.data;
};

/**
 * Fetch all platform payments for super admin overview.
 * Endpoint: GET /api/super-admin/payments
 */
export const getSuperAdminPaymentsApi = async (params = {}) => {
  const response = await api.get('/api/super-admin/payments', { params });
  return response.data;
};
