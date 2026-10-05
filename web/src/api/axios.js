import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { parseApiError } from '../utils/errorHandler';

/**
 * LaundryFlow Super Admin — Axios Instance.
 *
 * baseURL: VITE_API_URL (http://localhost:8080 in development)
 * credentials: true — required for HttpOnly refresh token cookie.
 *
 * Interceptors:
 *  - Request: attach Authorization: Bearer <accessToken>
 *  - Response: on 401 → attempt token refresh → retry → logout if refresh fails
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // Required for HttpOnly refreshToken cookie
});

// ── Request Interceptor — attach Bearer token ──────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response Interceptor — 401 handling with token refresh ─────────────────
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only attempt refresh on 401 — and not on auth endpoints (avoid infinite loop)
    const isAuthEndpoint =
      originalRequest.url?.includes('/api/auth/login') ||
      originalRequest.url?.includes('/api/auth/refresh-token') ||
      originalRequest.url?.includes('/api/auth/logout');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        // Queue additional requests while refresh is in-progress
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Attempt refresh — uses HttpOnly cookie automatically
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/auth/refresh-token`,
          {},
          { withCredentials: true }
        );

        const newToken = data.data.accessToken;

        // Update store with new token (keep existing user)
        const currentUser = useAuthStore.getState().user;
        useAuthStore.getState().setAuth({ user: currentUser, token: newToken });

        processQueue(null, newToken);

        originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        // Refresh failed — clear auth and redirect to login
        useAuthStore.getState().clearAuth();
        window.location.replace('/login');
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(parseApiError(error));
  }
);

export default api;
