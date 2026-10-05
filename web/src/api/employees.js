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

export const employeesApi = {
  getSuperAdminEmployeesApi,
  getEmployeeByIdApi,
  toggleEmployeeStatusApi,
};

export default employeesApi;
