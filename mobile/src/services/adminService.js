import apiClient from '../api/client';
import { API_ENDPOINTS } from '../api/endpoints';

/**
 * LaundryFlow Admin API Service
 * Directly integrated with Backend/server/controllers
 * Shared single source of truth with future Admin Web
 */
export const adminService = {
  /**
   * Get store operational dashboard stats & recent 5 orders
   * GET /api/laundry/admin/dashboard
   */
  getDashboard: async () => {
    const response = await apiClient.get(API_ENDPOINTS.ADMIN.DASHBOARD);
    return response.data?.data || response.data;
  },

  /**
   * Get store profile details
   * GET /api/laundry/admin/my-laundry
   */
  getMyLaundry: async () => {
    const response = await apiClient.get(API_ENDPOINTS.ADMIN.MY_LAUNDRY);
    return response.data?.data || response.data;
  },

  /**
   * Update store profile details
   * PUT /api/laundry/admin/my-laundry
   */
  updateMyLaundry: async (payload) => {
    const isFormData = typeof FormData !== 'undefined' && payload instanceof FormData;
    const config = isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};
    const response = await apiClient.put(API_ENDPOINTS.ADMIN.MY_LAUNDRY, payload, config);
    return response.data?.data || response.data;
  },

  /**
   * Get laundry orders with optional status filter, page, and limit
   * GET /api/orders?status=...&page=...&limit=...
   */
  getOrders: async ({ status, page = 1, limit = 20 } = {}) => {
    const params = { page, limit };
    if (status && status !== 'all') {
      params.status = status;
    }
    const response = await apiClient.get(API_ENDPOINTS.ADMIN.ORDERS, { params });
    return response.data || {};
  },

  /**
   * Get single order details
   * GET /api/orders/:id
   */
  getOrderById: async (orderId) => {
    const response = await apiClient.get(API_ENDPOINTS.ADMIN.ORDER_BY_ID(orderId));
    return response.data?.data || response.data;
  },

  /**
   * Update order status along lifecycle flow
   * PUT /api/orders/:id/status
   */
  updateOrderStatus: async (orderId, { status, message, cancelReason }) => {
    const response = await apiClient.put(API_ENDPOINTS.ADMIN.ORDER_STATUS(orderId), {
      status,
      message,
      cancelReason,
    });
    return response.data?.data || response.data;
  },

  /**
   * Assign or reassign delivery partner to an order
   * PUT /api/orders/:id/assign-delivery
   */
  assignDeliveryPartner: async (orderId, deliveryPartnerId) => {
    const response = await apiClient.put(API_ENDPOINTS.ADMIN.ASSIGN_DELIVERY(orderId), {
      deliveryPartnerId,
    });
    return response.data?.data || response.data;
  },

  /**
   * Get eligible nearby delivery partners for an order
   * GET /api/orders/:id/nearby-drivers
   */
  getNearbyDrivers: async (orderId) => {
    const response = await apiClient.get(API_ENDPOINTS.ADMIN.NEARBY_DRIVERS(orderId));
    return response.data?.data || [];
  },

  /**
   * Get all services of this laundry (supports all=true to see inactive)
   * GET /api/services?laundryId=...&all=true&category=...
   */
  getServices: async (laundryId, { all = true, category } = {}) => {
    const params = {};
    if (laundryId) params.laundryId = laundryId;
    if (all) params.all = 'true';
    if (category && category !== 'all') params.category = category;

    const response = await apiClient.get(API_ENDPOINTS.ADMIN.SERVICES, { params });
    return response.data?.data || [];
  },

  /**
   * Get single service details
   * GET /api/services/:id
   */
  getServiceById: async (serviceId) => {
    const response = await apiClient.get(API_ENDPOINTS.ADMIN.SERVICE_BY_ID(serviceId));
    return response.data?.data || response.data;
  },

  /**
   * Create a new service under admin's laundry
   * POST /api/services
   */
  createService: async (serviceData) => {
    const response = await apiClient.post(API_ENDPOINTS.ADMIN.SERVICES, serviceData);
    return response.data?.data || response.data;
  },

  /**
   * Update existing service
   * PUT /api/services/:id
   */
  updateService: async (serviceId, serviceData) => {
    const response = await apiClient.put(
      API_ENDPOINTS.ADMIN.SERVICE_BY_ID(serviceId),
      serviceData
    );
    return response.data?.data || response.data;
  },

  /**
   * Delete a service
   * DELETE /api/services/:id
   */
  deleteService: async (serviceId) => {
    const response = await apiClient.delete(API_ENDPOINTS.ADMIN.SERVICE_BY_ID(serviceId));
    return response.data;
  },

  /**
   * Toggle active/inactive status of a service
   * PUT /api/services/:id/toggle
   */
  toggleService: async (serviceId) => {
    const response = await apiClient.put(API_ENDPOINTS.ADMIN.SERVICE_TOGGLE(serviceId));
    return response.data?.data || response.data;
  },

  /**
   * Get store time slots across all days
   * GET /api/laundry/admin/time-slots
   */
  getTimeSlots: async () => {
    const response = await apiClient.get(API_ENDPOINTS.ADMIN.TIME_SLOTS);
    return response.data?.data || [];
  },

  /**
   * Save or update time slots for a day
   * POST /api/laundry/admin/time-slots
   */
  saveTimeSlots: async ({ day, slots }) => {
    const response = await apiClient.post(API_ENDPOINTS.ADMIN.TIME_SLOTS, {
      day,
      slots,
    });
    return response.data?.data || response.data;
  },

  /**
   * Get delivery partners for this laundry
   * GET /api/laundry/admin/delivery-partners
   */
  getDeliveryPartners: async () => {
    const response = await apiClient.get(API_ENDPOINTS.ADMIN.DELIVERY_PARTNERS);
    return response.data?.data || [];
  },

  /**
   * Add a new delivery partner
   * POST /api/laundry/admin/delivery-partner
   */
  addDeliveryPartner: async (partnerData) => {
    const response = await apiClient.post(
      API_ENDPOINTS.ADMIN.ADD_DELIVERY_PARTNER,
      partnerData
    );
    return response.data?.data || response.data;
  },

  /**
   * Toggle active/inactive status of a delivery partner
   * PUT /api/laundry/admin/delivery-partner/:id/toggle
   */
  toggleDeliveryPartner: async (partnerId) => {
    const response = await apiClient.put(
      API_ENDPOINTS.ADMIN.TOGGLE_DELIVERY_PARTNER(partnerId)
    );
    return response.data?.data || response.data;
  },

  /**
   * Get customers of this laundry aggregated from past orders
   * GET /api/laundry/admin/customers
   */
  getCustomers: async ({ search, page = 1, limit = 20 } = {}) => {
    const params = { page, limit };
    if (search && search.trim()) {
      params.search = search.trim();
    }
    const response = await apiClient.get(API_ENDPOINTS.ADMIN.CUSTOMERS, { params });
    return response.data?.data || [];
  },

  /**
   * Get notifications for admin
   * GET /api/notifications
   */
  getNotifications: async () => {
    const response = await apiClient.get(API_ENDPOINTS.NOTIFICATIONS.BASE);
    return response.data?.data || [];
  },

  /**
   * Get unread notification count
   * GET /api/notifications/unread-count
   */
  getUnreadNotificationsCount: async () => {
    const response = await apiClient.get(API_ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT);
    return response.data?.unreadCount || 0;
  },

  /**
   * Mark single notification as read
   * PUT /api/notifications/:id/read
   */
  markNotificationRead: async (id) => {
    const response = await apiClient.put(API_ENDPOINTS.NOTIFICATIONS.MARK_READ(id));
    return response.data;
  },

  /**
   * Mark all notifications as read
   * PUT /api/notifications/read-all
   */
  markAllNotificationsRead: async () => {
    const response = await apiClient.put(API_ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ);
    return response.data;
  },

  // ── Delivery Zones Management (Feature Phase A) ──

  /**
   * Get all delivery zones for this laundry
   * GET /api/delivery-zones
   */
  getDeliveryZones: async () => {
    const response = await apiClient.get(API_ENDPOINTS.DELIVERY_ZONES.BASE);
    return response.data?.data || response.data || [];
  },

  /**
   * Create new delivery zone
   * POST /api/delivery-zones
   */
  createDeliveryZone: async (payload) => {
    const response = await apiClient.post(API_ENDPOINTS.DELIVERY_ZONES.BASE, payload);
    return response.data?.data || response.data;
  },

  /**
   * Update delivery zone
   * PUT /api/delivery-zones/:id
   */
  updateDeliveryZone: async (id, payload) => {
    const response = await apiClient.put(API_ENDPOINTS.DELIVERY_ZONES.BY_ID(id), payload);
    return response.data?.data || response.data;
  },

  /**
   * Toggle delivery zone active status
   * PATCH /api/delivery-zones/:id/toggle
   */
  toggleDeliveryZone: async (id) => {
    const response = await apiClient.patch(API_ENDPOINTS.DELIVERY_ZONES.TOGGLE(id));
    return response.data?.data || response.data;
  },

  /**
   * Delete delivery zone
   * DELETE /api/delivery-zones/:id
   */
  deleteDeliveryZone: async (id) => {
    const response = await apiClient.delete(API_ENDPOINTS.DELIVERY_ZONES.BY_ID(id));
    return response.data;
  },

  // ── Driver Assignment (Feature Phase A) ──

  /**
   * Update laundry driver assignment mode (manual / automatic)
   * PUT /api/laundry/admin/assignment-mode
   */
  updateAssignmentMode: async ({ mode, autoAssignRadiusKm }) => {
    const response = await apiClient.put(API_ENDPOINTS.ADMIN.ASSIGNMENT_MODE, {
      mode,
      autoAssignRadiusKm,
    });
    return response.data?.data || response.data;
  },

  /**
   * Trigger automatic assignment on a single order
   * POST /api/orders/:id/auto-assign
   */
  autoAssignOrder: async (orderId) => {
    const response = await apiClient.post(API_ENDPOINTS.ADMIN.AUTO_ASSIGN_ORDER(orderId));
    return response.data?.data || response.data;
  },
};

export default adminService;
