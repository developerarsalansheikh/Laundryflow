import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ROUTES } from './routeConstants';
import { useAuthStore } from '../store/authStore';

// Layouts
import PublicLayout from '../layouts/PublicLayout';
import AuthLayout from '../layouts/AuthLayout';
import SuperAdminLayout from '../layouts/SuperAdminLayout';
import AdminLayout from '../layouts/AdminLayout';

// Guards
import ProtectedRoute from './ProtectedRoute';
import RoleRoute from './RoleRoute';
import ScrollToTop from '../components/common/ScrollToTop';
import { AuthLoadingScreen } from '../components/common/AuthLoadingScreen';

// Auth & Fallback Pages
import Login from '../pages/auth/Login';
import NotFound from '../pages/NotFound';
import Unauthorized from '../pages/Unauthorized';

// Lazy-loaded Public Showcase Pages
const PublicHome = lazy(() => import('../pages/public/Home'));
const PublicAbout = lazy(() => import('../pages/public/About'));
const PublicHowItWorks = lazy(() => import('../pages/public/HowItWorks'));
const PublicFeatures = lazy(() => import('../pages/public/Features'));
const PublicDownload = lazy(() => import('../pages/public/Download'));

// Lazy-loaded Super Admin Pages
const SuperDashboard = lazy(() => import('../pages/superadmin/Dashboard'));
const Laundries = lazy(() => import('../pages/superadmin/Laundries'));
const Orders = lazy(() => import('../pages/superadmin/Orders'));
const Users = lazy(() => import('../pages/superadmin/Users'));
const Employees = lazy(() => import('../pages/superadmin/Employees'));
const Subscriptions = lazy(() => import('../pages/superadmin/Subscriptions'));
const Payments = lazy(() => import('../pages/superadmin/Payments'));
const Analytics = lazy(() => import('../pages/superadmin/Analytics'));
const Reports = lazy(() => import('../pages/superadmin/Reports'));
const Services = lazy(() => import('../pages/superadmin/Services'));
const Payouts = lazy(() => import('../pages/superadmin/Payouts'));
const Support = lazy(() => import('../pages/superadmin/Support'));
const Settings = lazy(() => import('../pages/superadmin/Settings'));

// Lazy-loaded Laundry Admin Pages
const AdminDashboard = lazy(() => import('../pages/admin/AdminDashboard'));
const AdminOrders = lazy(() => import('../pages/admin/AdminOrders'));
const AdminOrderDetail = lazy(() => import('../pages/admin/AdminOrderDetail'));
const AdminServices = lazy(() => import('../pages/admin/AdminServices'));
const AdminAddEditService = lazy(() => import('../pages/admin/AdminAddEditService'));
const AdminDelivery = lazy(() => import('../pages/admin/AdminDelivery'));
const AdminCustomers = lazy(() => import('../pages/admin/AdminCustomers'));
const AdminTimeSlots = lazy(() => import('../pages/admin/AdminTimeSlots'));
const AdminNotifications = lazy(() => import('../pages/admin/AdminNotifications'));
const AdminProfile = lazy(() => import('../pages/admin/AdminProfile'));

/**
 * PageLoadingFallback — render clean spinner while route chunk loads.
 */
const PageLoadingFallback = () => (
  <div className="flex flex-col items-center justify-center py-32 gap-3">
    <div className="w-8 h-8 rounded-full border-2 border-slate-300 dark:border-white/10 border-t-indigo-600 animate-spin" />
    <span className="text-xs text-slate-500 font-medium">Loading page...</span>
  </div>
);

/**
 * HomeRedirectGuard — Role-aware routing for / (Part 4)
 * - Visitor without a valid session: renders public homepage (<PublicHome />).
 * - Authenticated Laundry Admin: redirects to /admin/dashboard.
 * - Authenticated Super Admin: redirects to /superadmin/dashboard.
 * - While session initializing: renders fallback without flashing wrong page.
 */
const HomeRedirectGuard = () => {
  const { isAuthenticated, role, isInitializing } = useAuthStore();

  if (isInitializing) {
    return <PageLoadingFallback />;
  }

  if (isAuthenticated) {
    const normalizedRole = String(role || '').trim().toLowerCase();
    if (normalizedRole === 'admin') {
      return <Navigate to={ROUTES.ADMIN.DASHBOARD} replace />;
    }
    if (normalizedRole === 'superadmin') {
      return <Navigate to={ROUTES.SUPERADMIN.DASHBOARD} replace />;
    }
  }

  return (
    <Suspense fallback={<PageLoadingFallback />}>
      <PublicHome />
    </Suspense>
  );
};

/**
 * LoginRedirectGuard — Role-aware routing for /login (Part 4)
 * - While session initializing: renders AuthLoadingScreen to prevent flashing wrong page.
 * - Visitor without a valid session: renders <Login />.
 * - Authenticated Laundry Admin: redirects to /admin/dashboard (or role-authorized destination).
 * - Authenticated Super Admin: redirects to /superadmin/dashboard (or role-authorized destination).
 */
const LoginRedirectGuard = () => {
  const { isAuthenticated, role, isInitializing } = useAuthStore();
  const location = useLocation();

  if (isInitializing) {
    return <AuthLoadingScreen />;
  }

  if (isAuthenticated) {
    const normalizedRole = String(role || '').trim().toLowerCase();
    const fromPath = typeof location.state?.from === 'string'
      ? location.state.from
      : location.state?.from?.pathname;
    const search = location.state?.from?.search || '';

    if (normalizedRole === 'admin') {
      const isValidAdminPath = typeof fromPath === 'string' &&
        fromPath.startsWith('/admin') &&
        !fromPath.startsWith('//') &&
        !fromPath.includes('://');
      const target = isValidAdminPath ? `${fromPath}${search}` : ROUTES.ADMIN.DASHBOARD;
      return <Navigate to={target} replace />;
    }

    if (normalizedRole === 'superadmin') {
      const isValidSuperAdminPath = typeof fromPath === 'string' &&
        fromPath.startsWith('/superadmin') &&
        !fromPath.startsWith('//') &&
        !fromPath.includes('://');
      const target = isValidSuperAdminPath ? `${fromPath}${search}` : ROUTES.SUPERADMIN.DASHBOARD;
      return <Navigate to={target} replace />;
    }

    return <Navigate to={ROUTES.FALLBACK.UNAUTHORIZED} replace />;
  }

  return <Login />;
};

/**
 * Main Application Route Architecture.
 * Organizes public, protected, and role-guarded routes with central constants.
 */
export const AppRoutes = () => {
  return (
    <>
      <ScrollToTop />
      <Routes>
      {/* Public Showcase & Documentation Website */}
      <Route element={<PublicLayout />}>
        <Route
          path={ROUTES.PUBLIC.HOME}
          element={<HomeRedirectGuard />}
        />
        <Route
          path={ROUTES.PUBLIC.ABOUT}
          element={
            <Suspense fallback={<PageLoadingFallback />}>
              <PublicAbout />
            </Suspense>
          }
        />
        <Route
          path={ROUTES.PUBLIC.HOW_IT_WORKS}
          element={
            <Suspense fallback={<PageLoadingFallback />}>
              <PublicHowItWorks />
            </Suspense>
          }
        />
        <Route
          path={ROUTES.PUBLIC.FEATURES}
          element={
            <Suspense fallback={<PageLoadingFallback />}>
              <PublicFeatures />
            </Suspense>
          }
        />
        <Route
          path={ROUTES.PUBLIC.DOWNLOAD}
          element={
            <Suspense fallback={<PageLoadingFallback />}>
              <PublicDownload />
            </Suspense>
          }
        />
      </Route>

      {/* Public Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path={ROUTES.AUTH.LOGIN} element={<LoginRedirectGuard />} />
        <Route path={ROUTES.FALLBACK.UNAUTHORIZED} element={<Unauthorized />} />
        <Route path={ROUTES.FALLBACK.NOT_FOUND} element={<NotFound />} />
      </Route>

      {/* Protected Super Admin Routes (role: superadmin only) */}
      <Route element={<ProtectedRoute />}>
        <Route element={<RoleRoute allowedRoles={['superadmin']} />}>
          <Route element={<SuperAdminLayout />}>
            <Route path={ROUTES.SUPERADMIN.ROOT} element={<Navigate to={ROUTES.SUPERADMIN.DASHBOARD} replace />} />
            <Route
              path={ROUTES.SUPERADMIN.DASHBOARD}
              element={
                <Suspense fallback={<PageLoadingFallback />}>
                  <SuperDashboard />
                </Suspense>
              }
            />
            <Route
              path={ROUTES.SUPERADMIN.LAUNDRIES}
              element={
                <Suspense fallback={<PageLoadingFallback />}>
                  <Laundries />
                </Suspense>
              }
            />
            <Route
              path={ROUTES.SUPERADMIN.ORDERS}
              element={
                <Suspense fallback={<PageLoadingFallback />}>
                  <Orders />
                </Suspense>
              }
            />
            <Route
              path={ROUTES.SUPERADMIN.USERS}
              element={
                <Suspense fallback={<PageLoadingFallback />}>
                  <Users />
                </Suspense>
              }
            />
            <Route
              path={ROUTES.SUPERADMIN.EMPLOYEES}
              element={
                <Suspense fallback={<PageLoadingFallback />}>
                  <Employees />
                </Suspense>
              }
            />
            <Route
              path={ROUTES.SUPERADMIN.SUBSCRIPTIONS}
              element={
                <Suspense fallback={<PageLoadingFallback />}>
                  <Subscriptions />
                </Suspense>
              }
            />
            <Route
              path={ROUTES.SUPERADMIN.PAYMENTS}
              element={
                <Suspense fallback={<PageLoadingFallback />}>
                  <Payments />
                </Suspense>
              }
            />
            <Route
              path={ROUTES.SUPERADMIN.ANALYTICS}
              element={
                <Suspense fallback={<PageLoadingFallback />}>
                  <Analytics />
                </Suspense>
              }
            />
            <Route
              path={ROUTES.SUPERADMIN.REPORTS}
              element={
                <Suspense fallback={<PageLoadingFallback />}>
                  <Reports />
                </Suspense>
              }
            />
            <Route
              path={ROUTES.SUPERADMIN.SERVICES}
              element={
                <Suspense fallback={<PageLoadingFallback />}>
                  <Services />
                </Suspense>
              }
            />
            <Route
              path={ROUTES.SUPERADMIN.PAYOUTS}
              element={
                <Suspense fallback={<PageLoadingFallback />}>
                  <Payouts />
                </Suspense>
              }
            />
            <Route
              path={ROUTES.SUPERADMIN.SUPPORT}
              element={
                <Suspense fallback={<PageLoadingFallback />}>
                  <Support />
                </Suspense>
              }
            />
            <Route
              path={ROUTES.SUPERADMIN.SETTINGS}
              element={
                <Suspense fallback={<PageLoadingFallback />}>
                  <Settings />
                </Suspense>
              }
            />
          </Route>
        </Route>
      </Route>

      {/* Protected Laundry Admin Routes (role: admin only) */}
      <Route element={<ProtectedRoute />}>
        <Route element={<RoleRoute allowedRoles={['admin']} />}>
          <Route element={<AdminLayout />}>
            <Route path={ROUTES.ADMIN.ROOT} element={<Navigate to={ROUTES.ADMIN.DASHBOARD} replace />} />
            <Route
              path={ROUTES.ADMIN.DASHBOARD}
              element={
                <Suspense fallback={<PageLoadingFallback />}>
                  <AdminDashboard />
                </Suspense>
              }
            />
            <Route
              path={ROUTES.ADMIN.ORDERS}
              element={
                <Suspense fallback={<PageLoadingFallback />}>
                  <AdminOrders />
                </Suspense>
              }
            />
            <Route
              path={ROUTES.ADMIN.ORDER_DETAIL_PARAM}
              element={
                <Suspense fallback={<PageLoadingFallback />}>
                  <AdminOrderDetail />
                </Suspense>
              }
            />
            <Route
              path={ROUTES.ADMIN.SERVICES}
              element={
                <Suspense fallback={<PageLoadingFallback />}>
                  <AdminServices />
                </Suspense>
              }
            />
            <Route
              path={ROUTES.ADMIN.SERVICES_NEW}
              element={
                <Suspense fallback={<PageLoadingFallback />}>
                  <AdminAddEditService />
                </Suspense>
              }
            />
            <Route
              path={ROUTES.ADMIN.SERVICES_EDIT}
              element={
                <Suspense fallback={<PageLoadingFallback />}>
                  <AdminAddEditService />
                </Suspense>
              }
            />
            <Route
              path={ROUTES.ADMIN.DELIVERY}
              element={
                <Suspense fallback={<PageLoadingFallback />}>
                  <AdminDelivery />
                </Suspense>
              }
            />
            <Route
              path={ROUTES.ADMIN.CUSTOMERS}
              element={
                <Suspense fallback={<PageLoadingFallback />}>
                  <AdminCustomers />
                </Suspense>
              }
            />
            <Route
              path={ROUTES.ADMIN.TIME_SLOTS}
              element={
                <Suspense fallback={<PageLoadingFallback />}>
                  <AdminTimeSlots />
                </Suspense>
              }
            />
            <Route
              path={ROUTES.ADMIN.NOTIFICATIONS}
              element={
                <Suspense fallback={<PageLoadingFallback />}>
                  <AdminNotifications />
                </Suspense>
              }
            />
            <Route
              path={ROUTES.ADMIN.PROFILE}
              element={
                <Suspense fallback={<PageLoadingFallback />}>
                  <AdminProfile />
                </Suspense>
              }
            />
          </Route>
        </Route>
      </Route>

      {/* Catch-all Wildcard Route */}
      <Route path="*" element={<Navigate to={ROUTES.FALLBACK.NOT_FOUND} replace />} />
    </Routes>
    </>
  );
};

export default AppRoutes;
