import apiClient from '../api/client';
import { API_ENDPOINTS } from '../api/endpoints';
import { useAuthStore } from '../store/authStore';
import { useFavoriteStore } from '../store/favoriteStore';
import { useCartStore } from '../store/cartStore';
import { useTrackingStore } from '../store/trackingStore';
import { queryClient } from '../api/queryClient';
import { OfflineCache } from '../utils/offlineCache';
import { socketService } from './socketService';
import { mobileNotificationService } from './mobileNotificationService';
import { normalizePhoneNumber } from '../utils/phone';

/**
 * Completely wipe all query caches, persisted cart, favorites, and tracking
 * to ensure strict tenant and user isolation across account switches.
 */
export const clearUserSessionCaches = () => {
  try {
    delete apiClient.defaults.headers.common.Authorization;
  } catch {}
  try {
    queryClient.clear();
  } catch {}
  try {
    OfflineCache.clearAll();
  } catch {}
  try {
    useCartStore.getState().clearCart();
  } catch {}
  try {
    useFavoriteStore.getState().clearFavorites();
  } catch {}
  try {
    useTrackingStore.getState().resetTracking();
  } catch {}
};

/**
 * LaundryFlow Authentication Service
 * Strictly integrated with Backend/server/controllers/authController.js
 */
export const authService = {
  /**
   * Customer Login Step 1: Send OTP to customer phone
   * POST /api/auth/login with { phone }
   */
  loginCustomerWithPhone: async (phone) => {
    const normalizedPhone = normalizePhoneNumber(phone);
    const response = await apiClient.post(API_ENDPOINTS.AUTH.LOGIN, { phone: normalizedPhone });
    return response.data;
  },

  /**
   * Customer Login Step 2: Verify Phone OTP
   * POST /api/auth/login-verify with { phone, otp }
   */
  verifyCustomerLoginOTP: async ({ phone, otp }) => {
    const normalizedPhone = normalizePhoneNumber(phone);
    const response = await apiClient.post(API_ENDPOINTS.AUTH.LOGIN_VERIFY, {
      phone: normalizedPhone,
      otp: String(otp).trim(),
    });
    const { accessToken, refreshToken, user } = response.data?.data || {};

    if (accessToken && user) {
      clearUserSessionCaches();
      useAuthStore.getState().setAuth({ accessToken, token: accessToken, refreshToken, user });
      // Register FCM token non-blocking after successful login
      mobileNotificationService.registerFcmToken().catch(() => {});
      // Sync guest favorites with server
      useFavoriteStore.getState().syncWithServer().catch(() => {});
    }

    return response.data;
  },

  /**
   * Email/Password Login (Admin, Delivery, or Customer)
   * POST /api/auth/login with { email, password }
   */
  loginWithEmailPassword: async ({ email, password }) => {
    const response = await apiClient.post(API_ENDPOINTS.AUTH.LOGIN, { email, password });
    const { accessToken, refreshToken, user } = response.data?.data || {};

    if (accessToken && user) {
      clearUserSessionCaches();
      useAuthStore.getState().setAuth({ accessToken, token: accessToken, refreshToken, user });
      // Register FCM token non-blocking after successful login
      mobileNotificationService.registerFcmToken().catch(() => {});
      // Sync guest favorites with server
      useFavoriteStore.getState().syncWithServer().catch(() => {});
    }

    return response.data;
  },

  /**
   * Unified login caller that delegates by credential shape
   */
  login: async (credentials) => {
    if (credentials.phone && !credentials.password) {
      return authService.loginCustomerWithPhone(credentials.phone);
    }
    return authService.loginWithEmailPassword(credentials);
  },

  /**
   * Customer Registration Step 1: Submit details and receive OTP
   * POST /api/auth/register with { name, email, phone, password }
   */
  register: async ({ name, email, phone, password }) => {
    const normalizedPhone = normalizePhoneNumber(phone);
    const response = await apiClient.post(API_ENDPOINTS.AUTH.REGISTER, {
      name: name?.trim(),
      email: email?.trim(),
      phone: normalizedPhone,
      password,
    });
    return response.data;
  },

  /**
   * Customer Registration Step 2: Verify Registration OTP
   * POST /api/auth/verify-otp with { phone, otp }
   */
  verifyRegisterOTP: async ({ phone, otp }) => {
    const normalizedPhone = normalizePhoneNumber(phone);
    const response = await apiClient.post(API_ENDPOINTS.AUTH.VERIFY_OTP, {
      phone: normalizedPhone,
      otp: String(otp).trim(),
    });
    const { accessToken, refreshToken, user } = response.data?.data || {};

    if (accessToken && user) {
      clearUserSessionCaches();
      useAuthStore.getState().setAuth({ accessToken, token: accessToken, refreshToken, user });
      // Register FCM token non-blocking after successful registration
      mobileNotificationService.registerFcmToken().catch(() => {});
    }

    return response.data;
  },

  /**
   * Resend OTP for Phone Verification
   * POST /api/auth/resend-otp with { phone }
   */
  resendOTP: async (phone) => {
    const normalizedPhone = normalizePhoneNumber(phone);
    const response = await apiClient.post(API_ENDPOINTS.AUTH.RESEND_OTP, { phone: normalizedPhone });
    return response.data;
  },

  /**
   * Refresh Session Access Token
   * POST /api/auth/refresh-token
   */
  refreshToken: async () => {
    const currentRefreshToken = useAuthStore.getState().refreshToken;
    try {
      const response = await apiClient.post(
        API_ENDPOINTS.AUTH.REFRESH_TOKEN,
        { refreshToken: currentRefreshToken },
        {
          headers: currentRefreshToken ? { 'x-refresh-token': currentRefreshToken } : {},
        }
      );
      const { accessToken, refreshToken: newRefreshToken } = response.data?.data || {};

      if (accessToken) {
        useAuthStore.getState().setAccessToken(accessToken, newRefreshToken || currentRefreshToken);
      }

      return response.data;
    } catch (error) {
      // If refresh explicitly rejected by server (401 or 403), invalidate session
      if (error?.status === 401 || error?.status === 403) {
        useAuthStore.getState().logout();
      }
      throw error;
    }
  },

  /**
   * Request Password Reset Link
   * POST /api/auth/forgot-password with { email }
   */
  forgotPassword: async (email) => {
    const response = await apiClient.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, { email });
    return response.data;
  },

  /**
   * Reset Password with Token
   * POST /api/auth/reset-password/:token with { newPassword }
   */
  resetPassword: async ({ token, newPassword }) => {
    const endpoint = typeof API_ENDPOINTS.AUTH.RESET_PASSWORD === 'function'
      ? API_ENDPOINTS.AUTH.RESET_PASSWORD(token)
      : `/auth/reset-password/${token}`;
    const response = await apiClient.post(endpoint, { newPassword });
    return response.data;
  },

  /**
   * Change Password (Protected)
   * PUT /api/auth/change-password with { oldPassword, newPassword }
   */
  changePassword: async ({ oldPassword, newPassword }) => {
    const response = await apiClient.put(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, {
      oldPassword,
      newPassword,
    });
    return response.data;
  },

  /**
   * Log out session
   * POST /api/auth/logout
   */
  logout: async () => {
    try {
      // Unregister FCM token BEFORE clearing session (token still needed for API call)
      await mobileNotificationService.unregisterFcmToken();
    } catch {
      // Non-blocking — don't let FCM failure prevent logout
    }
    try {
      const currentRefreshToken = useAuthStore.getState().refreshToken;
      await apiClient.post(
        API_ENDPOINTS.AUTH.LOGOUT,
        { refreshToken: currentRefreshToken },
        {
          headers: currentRefreshToken ? { 'x-refresh-token': currentRefreshToken } : {},
        }
      );
    } catch {
      // Ignore server-side logout failures and clear client state
    } finally {
      useAuthStore.getState().logout();
      clearUserSessionCaches();
      try {
        socketService.disconnect();
      } catch {}
    }
  },

  /**
   * Update Profile Details (Name, Phone, Email)
   * PUT /api/users/profile
   */
  updateProfile: async (profileData) => {
    const response = await apiClient.put(API_ENDPOINTS.USERS.PROFILE, profileData);
    if (response.data?.data) {
      useAuthStore.getState().setUser(response.data.data);
    }
    return response.data;
  },

  /**
   * Update Profile Photo
   * PUT /api/users/profile-image
   */
  updateProfileImage: async (formData) => {
    const response = await apiClient.put(API_ENDPOINTS.USERS.PROFILE_IMAGE, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    if (response.data?.data?.profileImage) {
      const currentUser = useAuthStore.getState().user;
      useAuthStore.getState().setUser({
        ...currentUser,
        profileImage: response.data.data.profileImage,
      });
    }
    return response.data;
  },

  /**
   * Apply as Laundry Admin (Onboarding)
   * POST /api/laundry/register
   */
  applyLaundryAdmin: async ({
    name,
    ownerName,
    ownerPassword,
    phone,
    email,
    address,
    city,
    state,
    pincode,
  }) => {
    const normalizedPhone = normalizePhoneNumber(phone);
    const response = await apiClient.post(API_ENDPOINTS.LAUNDRIES.REGISTER, {
      name: name?.trim(),
      ownerName: ownerName?.trim(),
      ownerPassword,
      phone: normalizedPhone,
      email: email?.trim()?.toLowerCase(),
      address: address?.trim(),
      city: city?.trim(),
      state: state?.trim(),
      pincode: pincode?.trim(),
    });
    return response.data;
  },
};

export default authService;
