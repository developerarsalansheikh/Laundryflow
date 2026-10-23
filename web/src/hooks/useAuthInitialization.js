import { useEffect, useRef } from 'react';
import { useAuthStore } from '../store/authStore';
import { verifySessionApi, refreshTokenApi } from '../api/auth';

/**
 * useAuthInitialization — Secure session restoration hook.
 *
 * Requirements (Part 3 & Part 9):
 * 1. Read persisted auth state from Zustand.
 * 2. If token exists, verify validity directly with backend via GET /api/users/profile.
 *    - Never treat persisted Zustand state or isAuthenticated: true as proof of authentication.
 *    - Validates JWT signature, expiry, and active status in DB.
 * 3. If access token expired (401), attempts token refresh via /api/auth/refresh-token.
 * 4. If session valid: updates user profile in store with server-verified data and completes.
 * 5. If session invalid / revoked / deactivated: clears auth state so protected routes require login.
 * 6. Always sets isInitializing = false when done to avoid loading flashes and redirect loops.
 *
 * This hook is called ONCE in App.jsx only.
 */
export const useAuthInitialization = () => {
  const { token, setAuth, clearAuth, setInitializing, user } = useAuthStore();
  const initStarted = useRef(false);

  useEffect(() => {
    if (initStarted.current) return;
    initStarted.current = true;

    const initializeAuth = async () => {
      // If no persisted token or user — skip verification, visitor is unauthenticated
      if (!token || !user) {
        setInitializing(false);
        return;
      }

      try {
        // Step 1: Verify session with the backend using stored access token
        const verifiedUser = await verifySessionApi();

        if (verifiedUser && (verifiedUser.role === 'admin' || verifiedUser.role === 'superadmin')) {
          // Session is verified and fresh — update store with server data
          const currentToken = useAuthStore.getState().token || token;
          setAuth({ user: verifiedUser, token: currentToken });
        } else {
          // Invalid user or unauthorized role
          clearAuth();
        }
      } catch (err) {
        // If 401 Unauthorized, access token may be expired — attempt refresh via HttpOnly cookie
        if (err?.status === 401 || err?.response?.status === 401) {
          try {
            const newAccessToken = await refreshTokenApi();
            if (newAccessToken) {
              // Update token and verify user profile
              useAuthStore.getState().setAuth({ user, token: newAccessToken });
              const freshUser = await verifySessionApi();
              setAuth({ user: freshUser || user, token: newAccessToken });
            } else {
              clearAuth();
            }
          } catch {
            // Refresh failed or cookie invalid/revoked — invalidate session
            clearAuth();
          }
        } else if (err?.status === 403 || err?.response?.status === 403) {
          // Account deactivated or unverified
          clearAuth();
        } else if (err?.isNetworkError || !err?.response) {
          // Genuine network/connectivity issue — server cannot verify session
          // Do not claim verified access while server is unreachable
          console.warn('[AuthInit] Network connectivity issue during session verification.');
        } else {
          // Server error or unexpected error
          clearAuth();
        }
      } finally {
        setInitializing(false);
      }
    };

    initializeAuth();
  }, [token, user, setAuth, clearAuth, setInitializing]);
};

export default useAuthInitialization;
