import api from './axios';

/**
 * Fetch platform analytics data.
 * GET /api/super-admin/analytics
 */
export const getSuperAdminAnalyticsApi = async () => {
  const response = await api.get('/api/super-admin/analytics');
  return response.data;
};

export const analyticsApi = {
  getSuperAdminAnalyticsApi,
};

export default analyticsApi;
