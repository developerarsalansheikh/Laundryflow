import api from './axios';

/**
 * Super Admin Delivery Commissions & Driver Payouts API
 * GET /api/super-admin/delivery-payouts
 */
export const getDeliveryPayoutsApi = async (params = {}) => {
  const response = await api.get('/api/super-admin/delivery-payouts', { params });
  return response.data;
};

export default {
  getDeliveryPayoutsApi,
};
