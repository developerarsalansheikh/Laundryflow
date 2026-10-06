import api from './axios';

/**
 * Super Admin Platform-Wide Services Catalog API Service
 * GET /api/super-admin/services
 */
export const getSuperAdminServicesApi = async (params = {}) => {
  const response = await api.get('/api/super-admin/services', { params });
  return response.data;
};

export default {
  getSuperAdminServicesApi,
};
