import axios from 'axios';
import { API_BASE_URL, API_TIMEOUT_MS, HTTP_STATUS } from '../constants/api';
import { useAuthStore } from '../store/authStore';
import { useNetworkStore } from '../store/networkStore';
import { mmkvStateStorage } from '../store/mmkvStorage';
import { STORAGE_KEYS } from '../constants/app';
import { parseApiError } from '../utils/errorHandler';

/**
 * Centralized Axios instance for LaundryFlow mobile app
 * Configured with cold-start tolerance, bounded refresh, and connection awareness.
 */
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT_MS,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

/**
 * Synchronous token resolver: checks in-memory Zustand store first,
 * and falls back directly to MMKV storage if state hydration has not yet completed.
 */
const getActiveAuthToken = () => {
  const authState = useAuthStore.getState();
  let token = authState.accessToken || authState.token;
  if (!token) {
    try {
      const raw = mmkvStateStorage.getItem(STORAGE_KEYS.AUTH);
      if (raw) {
        const parsed = JSON.parse(raw);
        token = parsed?.state?.accessToken || parsed?.state?.token || null;
      }
    } catch {}
  }
  return token;
};

/**
 * Request Interceptor: Attach Bearer token to all outgoing requests
 */
apiClient.interceptors.request.use(
  (config) => {
    const fullUrl = `${config.baseURL || ''}${config.url || ''}`;
    console.log(`[HTTP Request] ${config.method?.toUpperCase()} ${fullUrl}`);

    const token = getActiveAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      delete config.headers.Authorization;
      if (apiClient.defaults?.headers?.common?.Authorization) {
        delete apiClient.defaults.headers.common.Authorization;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(parseApiError(error));
  }
);

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

/**
 * Response Interceptor: Centralized 401 handling, auto-refresh, and error normalization.
 * IMPORTANT: Network glitches, timeouts, or Render 502/503 cold-starts during token refresh
 * NEVER wipe user credentials or force unwanted logouts.
 */
apiClient.interceptors.response.use(
  (response) => {
    const fullUrl = `${response.config?.baseURL || ''}${response.config?.url || ''}`;
    console.log(`[HTTP Response] ${response.status} from ${fullUrl}`);

    // Mark network connection and server as healthy
    useNetworkStore.getState().reportRequestSuccess();
    return response;
  },
  async (error) => {
    const status = error.response?.status;
    const originalRequest = error.config;
    const fullUrl = `${originalRequest?.baseURL || ''}${originalRequest?.url || ''}`;
    console.warn(`[HTTP Error] ${originalRequest?.method?.toUpperCase()} ${fullUrl} -> Status: ${status ?? 'Network/Timeout'} | ${error.message}`);

    // Handle 401 Unauthorized with token refresh
    if (status === HTTP_STATUS.UNAUTHORIZED && originalRequest && !originalRequest._retry) {
      const url = originalRequest.url || '';
      const isAuthUrl = url.includes('/auth/login') || url.includes('/auth/refresh-token') || url.includes('/auth/logout');

      if (!isAuthUrl) {
        const { refreshToken, logout, setAccessToken } = useAuthStore.getState();

        if (refreshToken) {
          if (isRefreshing) {
            return new Promise((resolve, reject) => {
              failedQueue.push({ resolve, reject });
            })
              .then((token) => {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                return apiClient(originalRequest);
              })
              .catch((err) => Promise.reject(parseApiError(err)));
          }

          originalRequest._retry = true;
          isRefreshing = true;

          try {
            const refreshRes = await axios.post(
              `${API_BASE_URL}/auth/refresh-token`,
              { refreshToken },
              {
                headers: {
                  'Content-Type': 'application/json',
                  'x-refresh-token': refreshToken,
                },
                timeout: API_TIMEOUT_MS,
              }
            );

            const { accessToken: newAccessToken, refreshToken: newRefreshToken } = refreshRes.data?.data || {};

            if (newAccessToken) {
              setAccessToken(newAccessToken, newRefreshToken || refreshToken);
              apiClient.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
              originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
              processQueue(null, newAccessToken);
              useNetworkStore.getState().reportRequestSuccess();
              return apiClient(originalRequest);
            }
          } catch (refreshErr) {
            processQueue(refreshErr, null);
            const refreshStatus = refreshErr.response?.status;

            // STRICT SAFETY: Only log out if the backend explicitly rejected credentials with 401 or 403.
            // Network failures, cold starts, and 502/503 Render gateways MUST preserve the session!
            if (refreshStatus === 401 || refreshStatus === 403) {
              console.warn('[apiClient] Refresh token explicitly rejected. Logging out session.');
              logout();
            } else {
              console.warn('[apiClient] Refresh token request failed due to network/cold-start. Preserving session.');
            }
            return Promise.reject(parseApiError(refreshErr));
          } finally {
            isRefreshing = false;
          }
        } else {
          console.warn('[apiClient] No refresh token available on 401.');
        }
      }
    }

    const appError = parseApiError(error);
    useNetworkStore.getState().reportRequestError(appError);
    return Promise.reject(appError);
  }
);

export default apiClient;
