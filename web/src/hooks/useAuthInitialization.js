import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { refreshTokenApi } from '../api/auth';

/**
 * useAuthInitialization — Session restoration hook.
 *
 * Run once on app boot:
 * 1. Read persisted auth state (handled by Zustand persist).
 * 2. If a token exists in localStorage — attempt refresh-token validation.
 * 3. Backend has no /me endpoint — we validate via refresh-token endpoint.
 * 4. If refresh succeeds → update access token → continue.
 * 5. If refresh fails → clear stale auth state → user lands on login.
 * 6. Always set isInitializing = false when done.
 *
 * This hook must be called ONCE in App.jsx only.
 */
export const useAuthInitialization = () => {
  const { token, setAuth, clearAuth, setInitializing, user } = useAuthStore();

  useEffect(() => {
    const initializeAuth = async () => {
      // If no persisted token — skip validation, not authenticated
      if (!token || !user) {
        setInitializing(false);
        return;
      }

      try {
        // Validate session by attempting a refresh (uses HttpOnly cookie)
        const newAccessToken = await refreshTokenApi();
        // Session still valid — update token in store
        setAuth({ user, token: newAccessToken });
      } catch {
        // Refresh failed (cookie expired or revoked) — clear stale auth
        clearAuth();
      } finally {
        setInitializing(false);
      }
    };

    initializeAuth();
    // Run only on mount — dependencies intentionally empty
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};

export default useAuthInitialization;
