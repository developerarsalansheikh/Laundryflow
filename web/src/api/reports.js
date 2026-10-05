import api from './axios';

/**
 * Super Admin Reports API Service.
 * Connects to GET /api/super-admin/reports
 */

/**
 * Fetch report summary data.
 * GET /api/super-admin/reports
 * Query params: startDate, endDate
 */
export const getReportsApi = async (params = {}) => {
  const response = await api.get('/api/super-admin/reports', { params });
  return response.data;
};

export const reportsApi = {
  getReportsApi,
};

export default reportsApi;
