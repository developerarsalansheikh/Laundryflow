import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { ROUTES } from './routeConstants';
import { AuthLoadingScreen } from '../components/common/AuthLoadingScreen';

/**
 * ProtectedRoute — Authentication guard for all Super Admin routes.
 *
 * Phase 5 behavior:
 * 1. While session is initializing → show AuthLoadingScreen (no flash).
 * 2. If not authenticated → redirect to /login (preserving intended location).
 * 3. If authenticated → render child routes via <Outlet />.
 *
 * Security:
 * - NEVER uses hardcoded bypass or || true
 * - isAuthenticated is computed strictly from real token + user in authStore
 */
export const ProtectedRoute = () => {
  const { isAuthenticated, isInitializing } = useAuthStore();
  const location = useLocation();

  // Show loading screen while session restoration is in progress
  if (isInitializing) {
    return <AuthLoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.AUTH.LOGIN} state={{ from: location }} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
