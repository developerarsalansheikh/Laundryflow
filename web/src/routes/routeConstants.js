/**
 * Centralized route paths for LaundryFlow Super Admin Web Application.
 * Prevents route string duplication across components.
 */
export const ROUTES = Object.freeze({
  AUTH: {
    LOGIN: '/login',
  },
  SUPERADMIN: {
    ROOT: '/superadmin',
    DASHBOARD: '/superadmin/dashboard',
    LAUNDRIES: '/superadmin/laundries',
    ORDERS: '/superadmin/orders',
    USERS: '/superadmin/users',
    EMPLOYEES: '/superadmin/employees',
    SUBSCRIPTIONS: '/superadmin/subscriptions',
    PAYMENTS: '/superadmin/payments',
    ANALYTICS: '/superadmin/analytics',
    REPORTS: '/superadmin/reports',
    SUPPORT: '/superadmin/support',
    SETTINGS: '/superadmin/settings',
  },
  ADMIN: {
    ROOT: '/admin',
    DASHBOARD: '/admin/dashboard',
    ORDERS: '/admin/orders',
    ORDER_DETAIL: (id) => `/admin/orders/${id}`,
    ORDER_DETAIL_PARAM: '/admin/orders/:id',
    SERVICES: '/admin/services',
    SERVICE_NEW: '/admin/services/new',
    SERVICES_NEW: '/admin/services/new',
    SERVICE_EDIT: (id) => `/admin/services/${id}/edit`,
    SERVICE_EDIT_PARAM: '/admin/services/:id/edit',
    SERVICES_EDIT: '/admin/services/:id/edit',
    DELIVERY: '/admin/delivery',
    CUSTOMERS: '/admin/customers',
    TIME_SLOTS: '/admin/time-slots',
    NOTIFICATIONS: '/admin/notifications',
    PROFILE: '/admin/profile',
  },
  FALLBACK: {
    NOT_FOUND: '/404',
    UNAUTHORIZED: '/unauthorized',
  },
});


export default ROUTES;
