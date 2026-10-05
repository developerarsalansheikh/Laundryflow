/**
 * User roles aligned with Backend/server/models/userModels.js
 */
export const USER_ROLES = Object.freeze({
  SUPERADMIN: 'superadmin',
  ADMIN: 'admin',
  DELIVERY: 'delivery',
  USER: 'user', // Customer
});

export const ROLE_LABELS = Object.freeze({
  [USER_ROLES.SUPERADMIN]: 'Super Admin',
  [USER_ROLES.ADMIN]: 'Laundry Owner',
  [USER_ROLES.DELIVERY]: 'Delivery Partner',
  [USER_ROLES.USER]: 'Customer',
});

export const isCustomer = (role) => role === USER_ROLES.USER;
export const isAdmin = (role) => role === USER_ROLES.ADMIN;
export const isDelivery = (role) => role === USER_ROLES.DELIVERY;
export const isSuperAdmin = (role) => role === USER_ROLES.SUPERADMIN;
