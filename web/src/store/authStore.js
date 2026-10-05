import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * LaundryFlow Super Admin Auth Store.
 *
 * Persists: token, user (role comes from user.role, also mirrored to role field).
 * Does NOT persist: password.
 *
 * Backend contract (from AUTH_CONTRACT.md):
 *   - role value: "superadmin" (lowercase)
 *   - token field: data.accessToken
 *   - user fields: _id, name, email, phone, role, laundryId
 */
export const useAuthStore = create(
  persist(
    (set) => ({
      // ── State ─────────────────────────────────────────────────────────────
      user: null,
      token: null,
      role: null,
      isAuthenticated: false,
      isInitializing: true, // starts true — waits for session restoration

      // ── Actions ───────────────────────────────────────────────────────────

      /**
       * setAuth — called after successful login or session restoration.
       * @param {{ user: object, token: string }} payload
       */
      setAuth: ({ user, token }) =>
        set({
          user,
          token,
          role: user?.role ?? null,
          isAuthenticated: Boolean(user && token),
        }),

      /**
       * clearAuth — called on logout or 401 failure.
       * Clears all authentication state.
       */
      clearAuth: () =>
        set({
          user: null,
          token: null,
          role: null,
          isAuthenticated: false,
        }),

      /**
       * setInitializing — set during session restoration bootstrap.
       */
      setInitializing: (value) => set({ isInitializing: value }),
    }),
    {
      name: 'lf_auth', // localStorage key
      partialize: (state) => ({
        // Only persist what is necessary — never persist password
        user: state.user,
        token: state.token,
        role: state.role,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAuthStore;
