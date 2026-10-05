import api from './axios';

/**
 * LaundryFlow Super Admin Users API Service.
 *
 * Backend endpoints:
 * - GET /api/super-admin/users (role, status, search, page, limit)
 * - GET /api/super-admin/users/:id (single user details)
 * - PUT /api/super-admin/users/:id/toggle-status (activate/deactivate user)
 */

/**
 * Fetch platform-wide users list for SuperAdmin.
 * GET /api/super-admin/users
 * Params: role, status, search, page, limit
 * Response: { success, count, total, pages, currentPage, data: User[] }
 */
export const getSuperAdminUsersApi = async (params = {}) => {
  const response = await api.get('/api/super-admin/users', { params });
  return response.data;
};

/**
 * Fetch single user details by ID for SuperAdmin.
 * GET /api/super-admin/users/:id
 * Response: { success, data: User }
 */
export const getSuperAdminUserByIdApi = async (id) => {
  const response = await api.get(`/api/super-admin/users/${id}`);
  return response.data.data;
};

/**
 * Activate/Deactivate a user account.
 * PUT /api/super-admin/users/:id/toggle-status
 * Body: { isActive?: boolean }
 * Response: { success, message, data: { _id, name, email, role, isActive } }
 */
export const toggleSuperAdminUserStatusApi = async ({ id, isActive }) => {
  const payload = isActive !== undefined ? { isActive } : {};
  const response = await api.put(`/api/super-admin/users/${id}/toggle-status`, payload);
  return response.data;
};

export const usersApi = {
  getSuperAdminUsersApi,
  getSuperAdminUserByIdApi,
  toggleSuperAdminUserStatusApi,
};

export default usersApi;
