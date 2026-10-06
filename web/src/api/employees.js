import api from './axios';

/**
 * LaundryFlow Super Admin Employees API Service.
 *
 * Employees in the backend correspond to platform workforce accounts:
 * - Delivery Partners (role: "delivery")
 * - Laundry Admins (role: "admin")
 *
 * Uses:
 * - GET /api/super-admin/users
 * - GET /api/super-admin/users/:id
 * - PUT /api/super-admin/users/:id/toggle-status
 */

/**
 * Fetch employee accounts list for SuperAdmin.
 * GET /api/super-admin/users
 * Query: role (delivery|admin), status, search, page, limit
 */
export const getSuperAdminEmployeesApi = async (params = {}) => {
  const response = await api.get('/api/super-admin/users', { params });
  return response.data;
};

/**
 * Fetch single employee details by ID for SuperAdmin.
 * GET /api/super-admin/users/:id
 */
export const getEmployeeByIdApi = async (id) => {
  const response = await api.get(`/api/super-admin/users/${id}`);
  return response.data.data;
};

/**
 * Activate or deactivate an employee account.
 * PUT /api/super-admin/users/:id/toggle-status
 */
export const toggleEmployeeStatusApi = async ({ id, isActive }) => {
  const payload = isActive !== undefined ? { isActive } : {};
  const response = await api.put(`/api/super-admin/users/${id}/toggle-status`, payload);
  return response.data;
};

/**
 * Create a new Delivery Agent account (SuperAdmin only).
 * POST /api/laundry/admin/delivery-partner
 */
export const createDeliveryPartnerApi = async (payload) => {
  const response = await api.post('/api/laundry/admin/delivery-partner', payload);
  return response.data;
};

/**
 * Edit an existing Delivery Agent account (SuperAdmin only).
 * PUT /api/laundry/admin/delivery-partner/:id
 */
export const updateDeliveryPartnerApi = async ({ id, ...payload }) => {
  const response = await api.put(`/api/laundry/admin/delivery-partner/${id}`, payload);
  return response.data;
};

/**
 * Fetch all platform delivery partners with assigned laundries.
 * GET /api/laundry/admin/delivery-partners
 */
export const getDeliveryPartnersApi = async (params = {}) => {
  const response = await api.get('/api/laundry/admin/delivery-partners', { params });
  return response.data;
};

/**
 * Toggle active/inactive status of a delivery partner.
 * PUT /api/laundry/admin/delivery-partner/:id/toggle
 */
export const toggleDeliveryPartnerApi = async ({ id, isActive }) => {
  const payload = isActive !== undefined ? { isActive } : {};
  const response = await api.put(`/api/laundry/admin/delivery-partner/${id}/toggle`, payload);
  return response.data;
};

export const employeesApi = {
  getSuperAdminEmployeesApi,
  getEmployeeByIdApi,
  toggleEmployeeStatusApi,
  createDeliveryPartnerApi,
  updateDeliveryPartnerApi,
  getDeliveryPartnersApi,
  toggleDeliveryPartnerApi,
};

export default employeesApi;
