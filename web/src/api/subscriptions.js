import api from './axios';

/**
 * LaundryFlow Super Admin — Real Subscription API Service.
 *
 * Replaces the temporary laundries/dashboard-based implementation.
 * All endpoints backed by the dedicated subscription system.
 */

// ── Subscription Plans ────────────────────────────────────────────────

/**
 * GET /api/super-admin/subscription-plans
 * @param {Object} params — { isActive, search, page, limit }
 */
export const getSubscriptionPlansApi = async (params = {}) => {
  const response = await api.get('/api/super-admin/subscription-plans', { params });
  return response.data;
};

/**
 * GET /api/super-admin/subscription-plans/:id
 */
export const getSubscriptionPlanByIdApi = async (id) => {
  const response = await api.get(`/api/super-admin/subscription-plans/${id}`);
  return response.data;
};

/**
 * POST /api/super-admin/subscription-plans
 * @param {Object} payload — { name, slug, description, price, currency, billingCycle, features, maxOrders, maxEmployees, isActive, isPopular, sortOrder }
 */
export const createSubscriptionPlanApi = async (payload) => {
  const response = await api.post('/api/super-admin/subscription-plans', payload);
  return response.data;
};

/**
 * PUT /api/super-admin/subscription-plans/:id
 */
export const updateSubscriptionPlanApi = async (id, payload) => {
  const response = await api.put(`/api/super-admin/subscription-plans/${id}`, payload);
  return response.data;
};

/**
 * DELETE /api/super-admin/subscription-plans/:id
 * Returns 409 if active subscriptions are attached.
 */
export const deleteSubscriptionPlanApi = async (id) => {
  const response = await api.delete(`/api/super-admin/subscription-plans/${id}`);
  return response.data;
};

// ── Subscriptions ─────────────────────────────────────────────────────

/**
 * GET /api/super-admin/subscriptions
 * @param {Object} params — { search, status, planId, laundryId, startDate, endDate, page, limit }
 */
export const getSubscriptionsApi = async (params = {}) => {
  const response = await api.get('/api/super-admin/subscriptions', { params });
  return response.data;
};

/**
 * GET /api/super-admin/subscriptions/:id
 */
export const getSubscriptionByIdApi = async (id) => {
  const response = await api.get(`/api/super-admin/subscriptions/${id}`);
  return response.data;
};

/**
 * GET /api/super-admin/subscriptions/stats
 */
export const getSubscriptionStatsApi = async () => {
  const response = await api.get('/api/super-admin/subscriptions/stats');
  return response.data;
};

/**
 * POST /api/super-admin/subscriptions
 * @param {Object} payload — { laundryId, planId, startDate, endDate, status, autoRenew, notes }
 */
export const createSubscriptionApi = async (payload) => {
  const response = await api.post('/api/super-admin/subscriptions', payload);
  return response.data;
};

/**
 * PUT /api/super-admin/subscriptions/:id/activate
 */
export const activateSubscriptionApi = async (id) => {
  const response = await api.put(`/api/super-admin/subscriptions/${id}/activate`);
  return response.data;
};

/**
 * PUT /api/super-admin/subscriptions/:id/cancel
 * @param {string} id
 * @param {Object} payload — { cancelReason }
 */
export const cancelSubscriptionApi = async (id, payload = {}) => {
  const response = await api.put(`/api/super-admin/subscriptions/${id}/cancel`, payload);
  return response.data;
};

/**
 * PUT /api/super-admin/subscriptions/:id/renew
 * @param {string} id
 * @param {Object} payload — { newEndDate } (optional — auto-calculates from billing cycle)
 */
export const renewSubscriptionApi = async (id, payload = {}) => {
  const response = await api.put(`/api/super-admin/subscriptions/${id}/renew`, payload);
  return response.data;
};
