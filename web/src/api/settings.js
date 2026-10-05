import api from './axios';

/**
 * Super Admin Settings API Service.
 * Connects to /api/super-admin/settings
 */

/** GET /api/super-admin/settings */
export const getPlatformSettingsApi = async () => {
  const response = await api.get('/api/super-admin/settings');
  return response.data;
};

/** PUT /api/super-admin/settings */
export const updatePlatformSettingsApi = async (data) => {
  const response = await api.put('/api/super-admin/settings', data);
  return response.data;
};

export const settingsApi = {
  getPlatformSettingsApi,
  updatePlatformSettingsApi,
};

export default settingsApi;
