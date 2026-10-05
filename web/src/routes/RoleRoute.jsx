import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { ROUTES } from './routeConstants';

/**
 * RoleRoute — Authorization guard.
 *
 * Backend role value for Super Admin is exactly: "superadmin" (lowercase)
 * Source: userModels.js enum + authMiddleware restrictTo("superadmin")
 *
 * Only users with role === "superadmin" can access these routes.
 * Any other role (admin, delivery, user) is redirected to /unauthorized.
 */

/** The exact Super Admin role string from the backend. */
const SUPER_ADMIN_ROLE = 'superadmin';

export const RoleRoute = ({ allowedRoles = [SUPER_ADMIN_ROLE] }) => {
  const { role } = useAuthStore();

  // Normalize: trim and lowercase for safe comparison
  const normalizedRole = String(role || '').trim().toLowerCase();
  const isAuthorized = allowedRoles.some(
    (allowed) => String(allowed).trim().toLowerCase() === normalizedRole
  );

  if (!isAuthorized) {
    return <Navigate to={ROUTES.FALLBACK.UNAUTHORIZED} replace />;
  }

  return <Outlet />;
};

export default RoleRoute;
