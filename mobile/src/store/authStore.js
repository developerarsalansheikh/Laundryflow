import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStateStorage } from './mmkvStorage';
import { STORAGE_KEYS } from '../constants/app';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      accessToken: null,
      token: null, // alias for backwards compatibility
      refreshToken: null,
      user: null,
      role: null,
      laundryId: null,
      isAuthenticated: false,
      isHydrated: false,
      pendingIntent: null, // { action: 'checkout', returnTo: 'Checkout', payload?: any }

      /**
       * Set authentication state upon successful login or OTP verification
       */
      setAuth: ({ token, accessToken, refreshToken, user }) => {
        const activeToken = accessToken || token || null;
        const role = user?.role || null;
        const laundryId = user?.laundryId || null;
        set({
          accessToken: activeToken,
          token: activeToken,
          refreshToken: refreshToken || null,
          user: user ? { ...user } : null,
          role,
          laundryId,
          isAuthenticated: Boolean(activeToken),
        });
      },

      /**
       * Update user profile data without clearing token
       */
      setUser: (user) => {
        const role = user?.role || get().role;
        const laundryId = user?.laundryId !== undefined ? user.laundryId : get().laundryId;
        set({
          user: user ? { ...get().user, ...user } : null,
          role,
          laundryId,
        });
      },

      /**
       * Set or refresh access token and refresh token
       */
      setAccessToken: (accessToken, refreshToken = null) => {
        set({
          accessToken: accessToken ?? null,
          token: accessToken ?? null,
          ...(refreshToken ? { refreshToken } : {}),
          isAuthenticated: Boolean(accessToken),
        });
      },

      /**
       * Set pending user intent (e.g. checkout, book pickup) for restoration post-auth
       */
      setPendingIntent: (intent) => {
        set({ pendingIntent: intent });
      },

      /**
       * Clear pending user intent
       */
      clearPendingIntent: () => {
        set({ pendingIntent: null });
      },

      /**
       * Consume pending intent (retrieves and clears in one atomic step)
       */
      consumePendingIntent: () => {
        const intent = get().pendingIntent;
        set({ pendingIntent: null });
        return intent;
      },

      /**
       * Clear auth session and reset all authentication state
       */
      logout: () => {
        set({
          accessToken: null,
          token: null,
          refreshToken: null,
          user: null,
          role: null,
          laundryId: null,
          isAuthenticated: false,
          pendingIntent: null,
        });
      },

      /**
       * Track hydration status from MMKV
       */
      setHydrated: (status) => {
        set({ isHydrated: status });
      },
    }),
    {
      name: STORAGE_KEYS.AUTH,
      storage: createJSONStorage(() => mmkvStateStorage),
      partialize: (state) => ({
        accessToken: state.accessToken,
        token: state.accessToken || state.token,
        refreshToken: state.refreshToken,
        user: state.user,
        role: state.role,
        laundryId: state.laundryId,
        isAuthenticated: state.isAuthenticated,
        pendingIntent: state.pendingIntent,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    }
  )
);
