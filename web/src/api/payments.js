import api from './axios';

/**
 * Super Admin Payments API Service.
 * Connects to GET /api/super-admin/payments and GET /api/super-admin/payments/:id
 */

/**
 * Fetch platform payment transactions list.
 * GET /api/super-admin/payments
 * Query params: status, method, laundryId, search, startDate, endDate, page, limit
 */
export const getSuperAdminPaymentsApi = async (params = {}) => {
  const response = await api.get('/api/super-admin/payments', { params });
  return response.data;
};

/**
 * Fetch payment transaction details by ID.
 * GET /api/super-admin/payments/:id
 */
export const getSuperAdminPaymentByIdApi = async (id) => {
  const response = await api.get(`/api/super-admin/payments/${id}`);
  return response.data;
};

export const paymentsApi = {
  getSuperAdminPaymentsApi,
  getSuperAdminPaymentByIdApi,
};

export default paymentsApi;
