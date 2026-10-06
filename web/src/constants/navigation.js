import { ROUTES } from '../routes/routeConstants';

/**
 * Super Admin Navigation Configuration.
 * Defines labels, paths, icon identifiers, and allowed roles for future sidebar rendering.
 */
export const SUPER_ADMIN_NAV_ITEMS = Object.freeze([
  {
    id: 'dashboard',
    label: 'Dashboard',
    path: ROUTES.SUPERADMIN.DASHBOARD,
    icon: 'LayoutDashboard',
    allowedRoles: ['superadmin', 'SUPER_ADMIN'],
  },
  {
    id: 'laundries',
    label: 'Laundries',
    path: ROUTES.SUPERADMIN.LAUNDRIES,
    icon: 'Store',
    allowedRoles: ['superadmin', 'SUPER_ADMIN'],
  },
  {
    id: 'orders',
    label: 'Orders',
    path: ROUTES.SUPERADMIN.ORDERS,
    icon: 'ShoppingBag',
    allowedRoles: ['superadmin', 'SUPER_ADMIN'],
  },
  {
    id: 'users',
    label: 'Users',
    path: ROUTES.SUPERADMIN.USERS,
    icon: 'Users',
    allowedRoles: ['superadmin', 'SUPER_ADMIN'],
  },
  {
    id: 'employees',
    label: 'Employees',
    path: ROUTES.SUPERADMIN.EMPLOYEES,
    icon: 'UserCheck',
    allowedRoles: ['superadmin', 'SUPER_ADMIN'],
  },
  {
    id: 'subscriptions',
    label: 'Subscriptions',
    path: ROUTES.SUPERADMIN.SUBSCRIPTIONS,
    icon: 'CreditCard',
    allowedRoles: ['superadmin', 'SUPER_ADMIN'],
  },
  {
    id: 'payments',
    label: 'Payments',
    path: ROUTES.SUPERADMIN.PAYMENTS,
    icon: 'DollarSign',
    allowedRoles: ['superadmin', 'SUPER_ADMIN'],
  },
  {
    id: 'analytics',
    label: 'Analytics',
    path: ROUTES.SUPERADMIN.ANALYTICS,
    icon: 'BarChart3',
    allowedRoles: ['superadmin', 'SUPER_ADMIN'],
  },
  {
    id: 'reports',
    label: 'Reports',
    path: ROUTES.SUPERADMIN.REPORTS,
    icon: 'FileText',
    allowedRoles: ['superadmin', 'SUPER_ADMIN'],
  },
  {
    id: 'services',
    label: 'Services Oversight',
    path: ROUTES.SUPERADMIN.SERVICES,
    icon: 'Sparkles',
    allowedRoles: ['superadmin', 'SUPER_ADMIN'],
  },
  {
    id: 'payouts',
    label: 'Driver Payouts',
    path: ROUTES.SUPERADMIN.PAYOUTS,
    icon: 'Coins',
    allowedRoles: ['superadmin', 'SUPER_ADMIN'],
  },
  {
    id: 'support',
    label: 'Support',
    path: ROUTES.SUPERADMIN.SUPPORT,
    icon: 'HelpCircle',
    allowedRoles: ['superadmin', 'SUPER_ADMIN'],
  },
  {
    id: 'settings',
    label: 'Settings',
    path: ROUTES.SUPERADMIN.SETTINGS,
    icon: 'Settings',
    allowedRoles: ['superadmin', 'SUPER_ADMIN'],
  },
]);

export default SUPER_ADMIN_NAV_ITEMS;
