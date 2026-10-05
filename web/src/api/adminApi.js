import api from './axios';

/**
 * LaundryFlow Laundry Admin Web API Client
 * Connects to the real backend controllers
 * Shared single source of truth with RN-5A Laundry Admin Mobile
 */
export const adminApi = {
  /**
   * GET /api/laundry/admin/dashboard
   */
  getDashboard: async () => {
    const response = await api.get('/api/laundry/admin/dashboard');
    return response.data?.data || response.data;
  },

  /**
   * GET /api/laundry/admin/my-laundry
   */
  getMyLaundry: async () => {
    const response = await api.get('/api/laundry/admin/my-laundry');
    return response.data?.data || response.data;
  },

  /**
   * PUT /api/laundry/admin/my-laundry
   */
  updateMyLaundry: async (data) => {
    const response = await api.put('/api/laundry/admin/my-laundry', data);
    return response.data?.data || response.data;
  },

  /**
   * GET /api/orders?status=&page=&limit=
   */
  getOrders: async ({ status, page = 1, limit = 20 } = {}) => {
    const params = { page, limit };
    if (status && status !== 'all') {
      params.status = status;
    }
    const response = await api.get('/api/orders', { params });
    return response.data || {};
  },

  /**
   * GET /api/orders/:id
   */
  getOrderById: async (id) => {
    const response = await api.get(`/api/orders/${id}`);
    return response.data?.data || response.data;
  },

  /**
   * PUT /api/orders/:id/status
   */
  updateOrderStatus: async (id, { status, message }) => {
    const response = await api.put(`/api/orders/${id}/status`, { status, message });
    return response.data?.data || response.data;
  },

  /**
   * PUT /api/orders/:id/assign-delivery
   */
  assignDeliveryPartner: async (id, deliveryPartnerId) => {
    const response = await api.put(`/api/orders/${id}/assign-delivery`, { deliveryPartnerId });
    return response.data?.data || response.data;
  },

  /**
   * GET /api/orders/:id/nearby-drivers
   */
  getNearbyDrivers: async (id) => {
    const response = await api.get(`/api/orders/${id}/nearby-drivers`);
    return response.data?.data || [];
  },

  /**
   * GET /api/services?laundryId=&all=true&category=
   */
  getServices: async ({ laundryId, all = true, category } = {}) => {
    const params = {};
    if (laundryId) params.laundryId = laundryId;
    if (all) params.all = 'true';
    if (category && category !== 'all') params.category = category;

    const response = await api.get('/api/services', { params });
    return response.data?.data || [];
  },

  /**
   * GET /api/services/:id
   */
  getServiceById: async (id) => {
    const response = await api.get(`/api/services/${id}`);
    return response.data?.data || response.data;
  },

  /**
   * POST /api/services
   */
  createService: async (data) => {
    const response = await api.post('/api/services', data);
    return response.data?.data || response.data;
  },

  /**
   * PUT /api/services/:id
   */
  updateService: async (id, data) => {
    const response = await api.put(`/api/services/${id}`, data);
    return response.data?.data || response.data;
  },

  /**
   * DELETE /api/services/:id
   */
  deleteService: async (id) => {
    const response = await api.delete(`/api/services/${id}`);
    return response.data;
  },

  /**
   * PUT /api/services/:id/toggle
   */
  toggleService: async (id) => {
    const response = await api.put(`/api/services/${id}/toggle`);
    return response.data?.data || response.data;
  },

  /**
   * GET /api/laundry/admin/time-slots
   */
  getTimeSlots: async () => {
    const response = await api.get('/api/laundry/admin/time-slots');
    return response.data?.data || [];
  },

  /**
   * POST /api/laundry/admin/time-slots
   */
  saveTimeSlots: async ({ day, slots }) => {
    const response = await api.post('/api/laundry/admin/time-slots', { day, slots });
    return response.data?.data || response.data;
  },

  /**
   * GET /api/laundry/admin/delivery-partners
   */
  getDeliveryPartners: async () => {
    const response = await api.get('/api/laundry/admin/delivery-partners');
    return response.data?.data || [];
  },

  /**
   * POST /api/laundry/admin/delivery-partner
   */
  addDeliveryPartner: async (data) => {
    const response = await api.post('/api/laundry/admin/delivery-partner', data);
    return response.data?.data || response.data;
  },

  /**
   * PUT /api/laundry/admin/delivery-partner/:id/toggle
   */
  toggleDeliveryPartner: async (id) => {
    const response = await api.put(`/api/laundry/admin/delivery-partner/${id}/toggle`);
    return response.data?.data || response.data;
  },

  /**
   * GET /api/laundry/admin/customers
   */
  getCustomers: async ({ search, page = 1, limit = 20 } = {}) => {
    const params = { page, limit };
    if (search && search.trim()) {
      params.search = search.trim();
    }
    const response = await api.get('/api/laundry/admin/customers', { params });
    return response.data?.data || [];
  },

  /**
   * GET /api/notifications
   */
  getNotifications: async () => {
    const response = await api.get('/api/notifications');
    return response.data?.data || [];
  },

  /**
   * GET /api/notifications/unread-count
   */
  getUnreadCount: async () => {
    const response = await api.get('/api/notifications/unread-count');
    return response.data?.unreadCount || 0;
  },

  /**
   * PUT /api/notifications/:id/read
   */
  markNotificationRead: async (id) => {
    const response = await api.put(`/api/notifications/${id}/read`);
    return response.data;
  },

  /**
   * PUT /api/payments/confirm-cod/:orderId
   */
  confirmCODPayment: async (orderId) => {
    const response = await api.put(`/api/payments/confirm-cod/${orderId}`);
    return response.data?.data || response.data;
  },

  // ── Delivery Zones (Feature Phase A) ──
  getDeliveryZones: async () => {
    const response = await api.get('/api/delivery-zones');
    return response.data?.data || response.data || [];
  },

  createDeliveryZone: async (payload) => {
    const response = await api.post('/api/delivery-zones', payload);
    return response.data?.data || response.data;
  },

  updateDeliveryZone: async (id, payload) => {
    const response = await api.put(`/api/delivery-zones/${id}`, payload);
    return response.data?.data || response.data;
  },

  toggleDeliveryZone: async (id) => {
    const response = await api.patch(`/api/delivery-zones/${id}/toggle`);
    return response.data?.data || response.data;
  },

  deleteDeliveryZone: async (id) => {
    const response = await api.delete(`/api/delivery-zones/${id}`);
    return response.data;
  },

  // ── Driver Assignment (Feature Phase A) ──
  updateAssignmentMode: async ({ mode, autoAssignRadiusKm }) => {
    const response = await api.put('/api/laundry/admin/assignment-mode', {
      mode,
      autoAssignRadiusKm,
    });
    return response.data?.data || response.data;
  },

  autoAssignOrder: async (orderId) => {
    const response = await api.post(`/api/orders/${orderId}/auto-assign`);
    return response.data?.data || response.data;
  },
};

export default adminApi;
