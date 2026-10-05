import axios from 'axios';
import { API_BASE_URL, API_TIMEOUT_MS, HTTP_STATUS } from '../constants/api';
import { useAuthStore } from '../store/authStore';
import { parseApiError } from '../utils/errorHandler';

/**
 * Centralized Axios instance for LaundryFlow mobile app
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
 * Request Interceptor: Attach Bearer token to all outgoing requests
 */
apiClient.interceptors.request.use(
  (config) => {
    const fullUrl = `${config.baseURL || ''}${config.url || ''}`;
    console.log(`[HTTP Request] ${config.method?.toUpperCase()} ${fullUrl}`);


    const authState = useAuthStore.getState();
    const token = authState.accessToken || authState.token;
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
 * Response Interceptor: Centralized 401 handling, auto-refresh, and error normalization
 */
apiClient.interceptors.response.use(
  (response) => {
    const fullUrl = `${response.config?.baseURL || ''}${response.config?.url || ''}`;
    console.log(`[HTTP Response] ${response.status} from ${fullUrl}`);
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
              return apiClient(originalRequest);
            }
          } catch (refreshErr) {
            processQueue(refreshErr, null);
            console.warn('[apiClient] Refresh token failed. Logging out session.');
            logout();
            return Promise.reject(parseApiError(refreshErr));
          } finally {
            isRefreshing = false;
          }
        } else {
          console.warn('[apiClient] No refresh token available. Logging out session.');
          logout();
        }
      }
    }

    const appError = parseApiError(error);
    return Promise.reject(appError);
  }
);

export default apiClient;
