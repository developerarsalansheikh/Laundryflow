import api from './axios';

/**
 * LaundryFlow Super Admin Laundries API Service.
 * Real backend endpoints discovered in superAdminRoutes.js & laundryRoutes.js.
 */

/**
 * Fetch laundries list with optional status, city, page, limit filters.
 * GET /api/super-admin/laundries
 */
export const getSuperAdminLaundriesApi = async (params = {}) => {
  const response = await api.get('/api/super-admin/laundries', { params });
  return response.data;
};

/**
 * Fetch platform stats including laundries counts.
 * GET /api/super-admin/dashboard
 */
export const getDashboardStatsApi = async () => {
  const response = await api.get('/api/super-admin/dashboard');
  return response.data.data;
};

/**
 * Fetch single laundry details by ID.
 * GET /api/laundry/:id
 */
export const getLaundryByIdApi = async (id) => {
  const response = await api.get(`/api/laundry/${id}`);
  return response.data.data;
};

/**
 * Approve pending laundry.
 * PUT /api/super-admin/laundries/:id/approve
 */
export const approveLaundryApi = async (id) => {
  const response = await api.put(`/api/super-admin/laundries/${id}/approve`);
  return response.data;
};

/**
 * Reject pending laundry.
 * PUT /api/super-admin/laundries/:id/reject
 */
export const rejectLaundryApi = async (id, reason) => {
  const response = await api.put(`/api/super-admin/laundries/${id}/reject`, { reason });
  return response.data;
};

/**
 * Suspend active laundry.
 * PUT /api/super-admin/laundries/:id/suspend
 */
export const suspendLaundryApi = async (id) => {
  const response = await api.put(`/api/super-admin/laundries/${id}/suspend`);
  return response.data;
};

/**
 * Update commission percentage for a laundry.
 * PUT /api/super-admin/laundries/:id/commission
 */
export const updateLaundryCommissionApi = async (id, commissionPercent) => {
  const response = await api.put(`/api/super-admin/laundries/${id}/commission`, {
    commissionPercent: Number(commissionPercent),
  });
  return response.data;
};

/**
 * Register a new laundry & owner account.
 * POST /api/laundry/register
 */
export const createLaundryApi = async (payload) => {
  const response = await api.post('/api/laundry/register', payload);
  return response.data;
};

export const laundriesApi = {
  getSuperAdminLaundriesApi,
  getDashboardStatsApi,
  getLaundryByIdApi,
  approveLaundryApi,
  rejectLaundryApi,
  suspendLaundryApi,
  updateLaundryCommissionApi,
  createLaundryApi,
};

export default laundriesApi;
