import api from './axios';

/**
 * Super Admin Support Tickets API Service.
 * Connects to /api/super-admin/support-tickets
 */

/** GET /api/super-admin/support-tickets */
export const getSupportTicketsApi = async (params = {}) => {
  const response = await api.get('/api/super-admin/support-tickets', { params });
  return response.data;
};

/** GET /api/super-admin/support-tickets/:id */
export const getSupportTicketByIdApi = async (id) => {
  const response = await api.get(`/api/super-admin/support-tickets/${id}`);
  return response.data;
};

/** PUT /api/super-admin/support-tickets/:id/status */
export const updateTicketStatusApi = async ({ id, status }) => {
  const response = await api.put(`/api/super-admin/support-tickets/${id}/status`, { status });
  return response.data;
};

/** POST /api/super-admin/support-tickets/:id/reply */
export const replyTicketApi = async ({ id, message }) => {
  const response = await api.post(`/api/super-admin/support-tickets/${id}/reply`, { message });
  return response.data;
};

/** POST /api/super-admin/support-tickets */
export const createSupportTicketApi = async (data) => {
  const response = await api.post('/api/super-admin/support-tickets', data);
  return response.data;
};

export const supportApi = {
  getSupportTicketsApi,
  getSupportTicketByIdApi,
  updateTicketStatusApi,
  replyTicketApi,
  createSupportTicketApi,
};

export default supportApi;
