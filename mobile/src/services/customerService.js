import apiClient from '../api/client';
import { API_ENDPOINTS } from '../api/endpoints';

/**
 * Customer Service
 * Handles marketplace discovery, laundry details, time slots, address book, and order lifecycle.
 */
export const customerService = {
  /**
   * Fetch all laundries with optional query params (city, lat, lng, page, limit)
   */
  getLaundries: async (params = {}) => {
    const response = await apiClient.get(API_ENDPOINTS.LAUNDRIES.BASE, { params });
    return response.data;
  },

  /**
   * Fetch single laundry details and its available services
   */
  getLaundryById: async (id) => {
    const response = await apiClient.get(API_ENDPOINTS.LAUNDRIES.BY_ID(id));
    return response.data;
  },

  /**
   * Fetch public time slots for a laundry on a given date
   */
  getTimeSlots: async (laundryId, date) => {
    const params = date ? { date } : {};
    const response = await apiClient.get(API_ENDPOINTS.LAUNDRIES.TIME_SLOTS(laundryId), { params });
    return response.data;
  },

  /**
   * Fetch customer's saved addresses
   */
  getAddresses: async () => {
    const response = await apiClient.get(API_ENDPOINTS.ADDRESSES.BASE);
    return response.data;
  },

  /**
   * Add new customer address
   * payload: { label, fullAddress, city, state, pincode, landmark, isDefault }
   */
  addAddress: async (payload) => {
    const response = await apiClient.post(API_ENDPOINTS.ADDRESSES.BASE, payload);
    return response.data;
  },

  /**
   * Update existing customer address
   */
  updateAddress: async (id, payload) => {
    const response = await apiClient.put(API_ENDPOINTS.ADDRESSES.BY_ID(id), payload);
    return response.data;
  },

  /**
   * Delete address
   */
  deleteAddress: async (id) => {
    const response = await apiClient.delete(API_ENDPOINTS.ADDRESSES.BY_ID(id));
    return response.data;
  },

  /**
   * Set address as default
   */
  setDefaultAddress: async (id) => {
    const response = await apiClient.put(API_ENDPOINTS.ADDRESSES.SET_DEFAULT(id));
    return response.data;
  },

  /**
   * Place an order
   * payload: { services, laundryId, pickupAddressId, deliveryAddressId, pickupDate, timeSlotId, paymentMethod, specialInstructions }
   */
  placeOrder: async (payload) => {
    const response = await apiClient.post(API_ENDPOINTS.ORDERS.CREATE, payload);
    return response.data;
  },

  /**
   * Fetch user's order history
   */
  getMyOrders: async (params = {}) => {
    const response = await apiClient.get(API_ENDPOINTS.ORDERS.MY_ORDERS, { params });
    return response.data;
  },

  /**
   * Fetch single order details by ID
   */
  getOrderById: async (id) => {
    const response = await apiClient.get(API_ENDPOINTS.ORDERS.BY_ID(id));
    return response.data;
  },

  /**
   * Cancel an order (allowed when status is 'pending')
   */
  cancelOrder: async (id, reason = '') => {
    const response = await apiClient.put(API_ENDPOINTS.ORDERS.CANCEL(id), { reason });
    return response.data;
  },

  /**
   * Change address for an existing order (before pickup)
   */
  changeOrderAddress: async (orderId, addressData) => {
    const response = await apiClient.put(`/orders/${orderId}/address`, addressData);
    return response.data;
  },

  /**
   * Confirm delivery receipt by customer
   */
  confirmDelivery: async (id) => {
    const response = await apiClient.put(API_ENDPOINTS.ORDERS.CONFIRM_DELIVERY(id));
    return response.data;
  },

  /**
   * Report customer unavailable / reschedule delivery for next day
   */
  reportUnavailable: async (id, reason = '') => {
    const response = await apiClient.put(API_ENDPOINTS.ORDERS.UNAVAILABLE(id), { reason });
    return response.data;
  },

  /**
   * Create Razorpay payment order for an existing order
   */
  createPaymentOrder: async (orderId) => {
    const response = await apiClient.post(API_ENDPOINTS.PAYMENTS.CREATE_ORDER, { orderId });
    return response.data;
  },

  /**
   * Verify Razorpay payment signature and mark order paid
   * payload: { razorpayOrderId, razorpayPaymentId, razorpaySignature, orderId }
   */
  verifyPayment: async (payload) => {
    const response = await apiClient.post(API_ENDPOINTS.PAYMENTS.VERIFY, payload);
    return response.data;
  },

  /**
   * Fetch payment details by order ID
   */
  getPaymentByOrderId: async (orderId) => {
    const response = await apiClient.get(API_ENDPOINTS.PAYMENTS.BY_ORDER(orderId));
    return response.data;
  },

  /**
   * Check delivery zone availability & fee for customer address
   * payload: { laundryId, addressId, pincode, city, coordinates, orderSubtotal }
   */
  checkDeliveryZone: async (payload) => {
    const response = await apiClient.post(API_ENDPOINTS.DELIVERY_ZONES.CHECK, payload);
    return response.data;
  },

  /**
   * Feature A: Fetch user's favorite laundries
   */
  getFavorites: async () => {
    const response = await apiClient.get(API_ENDPOINTS.FAVORITES.BASE);
    return response.data;
  },

  /**
   * Feature A: Add laundry to favorites
   */
  addFavorite: async (laundryId) => {
    const response = await apiClient.post(API_ENDPOINTS.FAVORITES.BY_ID(laundryId));
    return response.data;
  },

  /**
   * Feature A: Remove laundry from favorites
   */
  removeFavorite: async (laundryId) => {
    const response = await apiClient.delete(API_ENDPOINTS.FAVORITES.BY_ID(laundryId));
    return response.data;
  },

  /**
   * Feature A: Sync local guest favorites with server on login
   */
  syncFavorites: async (laundryIds) => {
    const response = await apiClient.post(API_ENDPOINTS.FAVORITES.SYNC, { laundryIds });
    return response.data;
  },
};

export default customerService;
