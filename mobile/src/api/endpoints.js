/**
 * LaundryFlow API Endpoints
 * Aligned with Backend/server/routes
 */
export const API_ENDPOINTS = Object.freeze({
  // Auth (aligned with Backend/server/routes/authRoutes.js)
  AUTH: {
    LOGIN: '/auth/login',
    LOGIN_VERIFY: '/auth/login-verify',
    REGISTER: '/auth/register',
    VERIFY_OTP: '/auth/verify-otp',
    RESEND_OTP: '/auth/resend-otp',
    REFRESH_TOKEN: '/auth/refresh-token',
    LOGOUT: '/auth/logout',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: (token) => `/auth/reset-password/${token}`,
    CHANGE_PASSWORD: '/auth/change-password',
    ME: '/auth/me',
  },

  // Customer / Orders
  ORDERS: {
    BASE: '/orders',
    MY_ORDERS: '/users/my-orders',
    BY_ID: (id) => `/orders/${id}`,
    CREATE: '/orders',
    CANCEL: (id) => `/orders/${id}/cancel`,
    CONFIRM_DELIVERY: (id) => `/orders/${id}/confirm-delivery`,
    UNAVAILABLE: (id) => `/orders/${id}/unavailable`,
    TRACK: (id) => `/orders/${id}/track`,
  },

  // Services
  SERVICES: {
    BASE: '/services',
    BY_ID: (id) => `/services/${id}`,
  },

  // Laundry / Stores (Backend mount is /api/laundry)
  LAUNDRIES: {
    BASE: '/laundry/all',
    NEARBY: '/laundry/all',
    BY_ID: (id) => `/laundry/${id}`,
    TIME_SLOTS: (id) => `/laundry/${id}/time-slots`,
    REGISTER: '/laundry/register',
  },

  // Address (Backend mount is /api/users/address)
  ADDRESSES: {
    BASE: '/users/address',
    BY_ID: (id) => `/users/address/${id}`,
    SET_DEFAULT: (id) => `/users/address/${id}/set-default`,
  },

  // Favorites (Feature A)
  FAVORITES: {
    BASE: '/users/favorites',
    BY_ID: (id) => `/users/favorites/${id}`,
    SYNC: '/users/favorites/sync',
  },

  // Admin / Store Management (aligned with Backend controllers)
  ADMIN: {
    DASHBOARD: '/laundry/admin/dashboard',
    MY_LAUNDRY: '/laundry/admin/my-laundry',
    TIME_SLOTS: '/laundry/admin/time-slots',
    DELIVERY_PARTNERS: '/laundry/admin/delivery-partners',
    ADD_DELIVERY_PARTNER: '/laundry/admin/delivery-partner',
    TOGGLE_DELIVERY_PARTNER: (id) => `/laundry/admin/delivery-partner/${id}/toggle`,
    CUSTOMERS: '/laundry/admin/customers',
    ORDERS: '/orders',
    ORDER_BY_ID: (id) => `/orders/${id}`,
    ORDER_STATUS: (id) => `/orders/${id}/status`,
    ASSIGN_DELIVERY: (id) => `/orders/${id}/assign-delivery`,
    AUTO_ASSIGN_ORDER: (id) => `/orders/${id}/auto-assign`,
    ASSIGNMENT_MODE: '/laundry/admin/assignment-mode',
    NEARBY_DRIVERS: (id) => `/orders/${id}/nearby-drivers`,
    SERVICES: '/services',
    SERVICE_BY_ID: (id) => `/services/${id}`,
    SERVICE_TOGGLE: (id) => `/services/${id}/toggle`,
  },

  // Delivery (aligned with Backend/server/routes/deliveryRoutes.js)
  DELIVERY: {
    ORDERS: '/delivery/my-active-orders',
    MY_ACTIVE_ORDERS: '/delivery/my-active-orders',
    MY_COMPLETED_ORDERS: '/delivery/my-completed-orders',
    ORDER_BY_ID: (id) => `/orders/${id}`,
    UPDATE_STATUS: (id) => `/delivery/orders/${id}/status`,
    GENERATE_OTP: (id) => `/delivery/orders/${id}/generate-otp`,
    VERIFY_OTP: (id) => `/delivery/orders/${id}/verify-otp`,
    STATS: '/delivery/stats',
    UPDATE_LOCATION: '/delivery/update-location',
    AVAILABILITY: '/delivery/availability',
    NEW_PICKUP: '/delivery/new-pickup',
    PICKUP_PHOTO: (id) => `/delivery/orders/${id}/pickup-photo`,
    NEARBY_ORDERS: '/delivery/nearby-orders',
    SELF_ASSIGN: (id) => `/delivery/self-assign/${id}`,
  },

  // Payments (aligned with Backend/server/routes/paymentRoutes.js)
  PAYMENTS: {
    CREATE_ORDER: '/payments/create-order',
    VERIFY: '/payments/verify',
    BY_ORDER: (orderId) => `/payments/${orderId}`,
    CONFIRM_COD: (orderId) => `/payments/confirm-cod/${orderId}`,
  },

  // Delivery Zones (aligned with Backend/server/routes/deliveryZoneRoutes.js)
  DELIVERY_ZONES: {
    BASE: '/delivery-zones',
    BY_ID: (id) => `/delivery-zones/${id}`,
    TOGGLE: (id) => `/delivery-zones/${id}/toggle`,
    CHECK: '/delivery-zones/check-availability',
  },

  // Notifications
  NOTIFICATIONS: {
    BASE: '/notifications',
    UNREAD_COUNT: '/notifications/unread-count',
    MARK_READ: (id) => `/notifications/${id}/read`,
    MARK_ALL_READ: '/notifications/read-all',
    REGISTER_TOKEN: '/notifications/register-token',
    UNREGISTER_TOKEN: '/notifications/unregister-token',
    REMOVE_TOKEN: '/notifications/remove-token',
  },
});

