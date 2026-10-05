import apiClient from '../api/client';
import { API_ENDPOINTS } from '../api/endpoints';

/**
 * LaundryFlow Delivery Partner API Service
 * Strictly integrated with Backend/server/controllers/deliveryController.js
 */
export const deliveryService = {
  /**
   * Get delivery partner dashboard stats & KPI metrics
   * GET /api/delivery/stats
   */
  getStats: async () => {
    const response = await apiClient.get(API_ENDPOINTS.DELIVERY.STATS);
    return response.data?.data || response.data;
  },

  /**
   * Get active assigned orders for the logged-in delivery partner
   * GET /api/delivery/my-active-orders?type=all|pickup|delivery
   */
  getActiveOrders: async ({ type, status } = {}) => {
    const params = {};
    if (type) params.type = type;
    if (status) params.status = status;
    const response = await apiClient.get(API_ENDPOINTS.DELIVERY.MY_ACTIVE_ORDERS, { params });
    return response.data?.data || response.data || [];
  },

  /**
   * Get completed delivered orders history with pagination
   * GET /api/delivery/my-completed-orders?page=1&limit=20
   */
  getCompletedOrders: async ({ page = 1, limit = 20 } = {}) => {
    const response = await apiClient.get(API_ENDPOINTS.DELIVERY.MY_COMPLETED_ORDERS, {
      params: { page, limit },
    });
    return response.data?.data || response.data || { orders: [], pagination: {} };
  },

  /**
   * Get full single order detail
   * GET /api/orders/:id
   */
  getOrderById: async (orderId) => {
    const response = await apiClient.get(API_ENDPOINTS.DELIVERY.ORDER_BY_ID(orderId));
    return response.data?.data || response.data;
  },

  /**
   * Update order lifecycle status (picked_up, out_for_delivery, delivered)
   * PUT /api/delivery/orders/:id/status
   */
  updateStatus: async (orderId, { status, message, otp }) => {
    const payload = { status };
    if (message) payload.message = message;
    if (otp) payload.otp = otp;
    const response = await apiClient.put(API_ENDPOINTS.DELIVERY.UPDATE_STATUS(orderId), payload);
    return response.data?.data || response.data;
  },

  /**
   * Generate delivery OTP to verify customer receipt
   * POST /api/delivery/orders/:id/generate-otp
   */
  generateOTP: async (orderId) => {
    const response = await apiClient.post(API_ENDPOINTS.DELIVERY.GENERATE_OTP(orderId));
    return response.data;
  },

  /**
   * Verify delivery OTP to complete order
   * POST /api/delivery/orders/:id/verify-otp
   */
  verifyOTP: async (orderId, { otp, message }) => {
    const response = await apiClient.post(API_ENDPOINTS.DELIVERY.VERIFY_OTP(orderId), {
      otp,
      message,
    });
    return response.data?.data || response.data;
  },

  /**
   * Update delivery partner availability (available, busy, offline)
   * PUT /api/delivery/availability
   */
  updateAvailability: async (availabilityStatus) => {
    const response = await apiClient.put(API_ENDPOINTS.DELIVERY.AVAILABILITY, {
      availabilityStatus,
      status: availabilityStatus,
    });
    return response.data?.data || response.data;
  },

  /**
   * Update delivery partner GPS location
   * POST /api/delivery/update-location
   */
  updateLocation: async ({ latitude, longitude, lat, lng }) => {
    const response = await apiClient.post(API_ENDPOINTS.DELIVERY.UPDATE_LOCATION, {
      lat: lat !== undefined ? lat : latitude,
      lng: lng !== undefined ? lng : longitude,
      latitude: lat !== undefined ? lat : latitude,
      longitude: lng !== undefined ? lng : longitude,
    });
    return response.data?.data || response.data;
  },

  /**
   * Fetch active laundry services for creating new pickups
   * GET /api/services?laundryId=xxx
   */
  getLaundryServices: async (laundryId) => {
    const response = await apiClient.get(API_ENDPOINTS.SERVICES.BASE, {
      params: { laundryId, all: 'false' },
    });
    return response.data?.data || response.data || [];
  },

  /**
   * ⭐ RN-6 CORE: Create completely new pickup order from customer context
   * POST /api/delivery/new-pickup
   */
  createDeliveryPickupOrder: async ({
    previousOrderId,
    services,
    specialInstructions,
    pickupAddressId,
  }) => {
    const response = await apiClient.post(API_ENDPOINTS.DELIVERY.NEW_PICKUP, {
      previousOrderId,
      services,
      specialInstructions,
      pickupAddressId,
    });
    return response.data?.data || response.data;
  },

  /**
   * Upload Pickup Photo for physical bag identification
   * POST /api/orders/:orderId/pickup-photo
   */
  uploadPickupPhoto: async (orderId, photoAsset) => {
    const formData = new FormData();
    const uri = photoAsset.uri || photoAsset;
    const cleanUri = uri.startsWith('file://') ? uri : uri;
    formData.append('photo', {
      uri: cleanUri,
      type: photoAsset.type || 'image/jpeg',
      name: photoAsset.fileName || `pickup_${orderId}_${Date.now()}.jpg`,
    });

    const response = await apiClient.post(API_ENDPOINTS.DELIVERY.PICKUP_PHOTO(orderId), formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data?.data || response.data;
  },

  /**
   * Get all unassigned pending orders within radiusKm of agent location
   * GET /api/delivery/nearby-orders?lat=xx&lng=xx&radiusKm=10
   */
  getNearbyOrders: async ({ lat, lng, radiusKm = 10 } = {}) => {
    const params = { radiusKm };
    if (lat !== undefined) params.lat = lat;
    if (lng !== undefined) params.lng = lng;
    const response = await apiClient.get(API_ENDPOINTS.DELIVERY.NEARBY_ORDERS, { params });
    return response.data?.data || [];
  },

  /**
   * Delivery agent self-assigns an unassigned pending order (no admin needed)
   * POST /api/delivery/self-assign/:orderId
   */
  selfAssignOrder: async (orderId) => {
    const response = await apiClient.post(API_ENDPOINTS.DELIVERY.SELF_ASSIGN(orderId));
    return response.data?.data || response.data;
  },

  /**
   * Fetch notifications
   * GET /api/notifications
   */
  getNotifications: async () => {
    const response = await apiClient.get(API_ENDPOINTS.NOTIFICATIONS.BASE);
    return response.data?.data || response.data || [];
  },
};

export default deliveryService;
