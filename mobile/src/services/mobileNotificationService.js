/**
 * mobileNotificationService.js
 * Full FCM integration for LaundryFlow React Native CLI app.
 *
 * Provides:
 *  - requestNotificationPermission()
 *  - getFcmToken()
 *  - registerFcmToken()
 *  - unregisterFcmToken()
 *  - setupForegroundNotificationListener()
 *  - setupTokenRefreshListener()
 *  - handleNotificationDeepLink()
 *  - getStableDeviceId()
 *
 * Rules:
 *  - FCM failures NEVER prevent login or normal app usage
 *  - Tokens are stored stably (not regenerated each launch)
 *  - No Firebase Admin credentials in the client
 *  - Works for Customer, Laundry Admin, and Delivery Partner roles
 */

import { Platform, PermissionsAndroid } from 'react-native';
import apiClient from '../api/client';
import { API_ENDPOINTS } from '../api/endpoints';

// ── Stable Device ID ─────────────────────────────────────────────────────────
// Use MMKV to persist deviceId across launches (not regenerated every session)
let _stableDeviceId = null;

const getStableDeviceId = () => {
  if (_stableDeviceId) return _stableDeviceId;

  try {
    // Lazy import MMKV to avoid circular deps
    const { storage } = require('../store/mmkvStorage');
    const DEVICE_ID_KEY = 'laundryflow_device_id';

    let deviceId = storage.getString(DEVICE_ID_KEY);
    if (!deviceId) {
      // Generate once and persist
      deviceId = `${Platform.OS}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
      storage.set(DEVICE_ID_KEY, deviceId);
    }
    _stableDeviceId = deviceId;
    return deviceId;
  } catch {
    // Fallback if MMKV unavailable
    if (!_stableDeviceId) {
      _stableDeviceId = `${Platform.OS}_${Date.now().toString(36)}`;
    }
    return _stableDeviceId;
  }
};

// ── Messaging Instance Helper ──────────────────────────────────────────────
const getMessagingInstance = () => {
  try {
    const { getMessaging } = require('@react-native-firebase/messaging');
    return getMessaging();
  } catch (err) {
    console.warn('[FCM] getMessaging error:', err?.message);
    return null;
  }
};

// ── Request Notification Permission ──────────────────────────────────────────
/**
 * Request OS-level notification permission.
 * - Android 13+ (API 33): POST_NOTIFICATIONS
 * - iOS: Uses Firebase messaging.requestPermission()
 * Returns: 'granted' | 'denied' | 'unavailable'
 */
const requestNotificationPermission = async () => {
  try {
    if (Platform.OS === 'android') {
      if (Platform.Version >= 33) {
        const result = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
        );
        if (result === PermissionsAndroid.RESULTS.GRANTED) {
          console.log('[FCM] Android POST_NOTIFICATIONS granted');
          return 'granted';
        } else {
          console.warn('[FCM] Android POST_NOTIFICATIONS denied');
          return 'denied';
        }
      }
      // Android < 13: permission not required
      return 'granted';
    }

    if (Platform.OS === 'ios') {
      const { AuthorizationStatus } = require('@react-native-firebase/messaging');
      const messaging = getMessagingInstance();
      if (!messaging) return 'unavailable';

      const authStatus = await messaging.requestPermission();
      if (
        authStatus === AuthorizationStatus.AUTHORIZED ||
        authStatus === AuthorizationStatus.PROVISIONAL
      ) {
        console.log('[FCM] iOS notification permission granted');
        return 'granted';
      }
      console.warn('[FCM] iOS notification permission denied');
      return 'denied';
    }

    return 'unavailable';
  } catch (err) {
    console.warn('[FCM] requestNotificationPermission error:', err?.message);
    return 'unavailable';
  }
};

// ── Get FCM Token ─────────────────────────────────────────────────────────────
/**
 * Get the current FCM registration token.
 * Returns: token string or null on failure.
 */
const getFcmToken = async () => {
  try {
    const messaging = getMessagingInstance();
    if (!messaging) return null;

    const token = await messaging.getToken();
    if (token) {
      console.log('[FCM] Token obtained:', token.slice(0, 8) + '...');
      return token;
    }
    return null;
  } catch (err) {
    console.warn('[FCM] getFcmToken error:', err?.message);
    return null;
  }
};

// ── Register FCM Token with Backend ──────────────────────────────────────────
/**
 * Registers the FCM token with the LaundryFlow backend.
 * Called after login. Never throws — failures are warnings only.
 */
const registerFcmToken = async () => {
  try {
    const permission = await requestNotificationPermission();
    if (permission !== 'granted') {
      console.warn('[FCM] Notification permission not granted — token not registered');
      return;
    }

    const token = await getFcmToken();
    if (!token) {
      console.warn('[FCM] No token available — skipping registration');
      return;
    }

    const deviceId = getStableDeviceId();
    const payload = {
      token,
      deviceId,
      platform: Platform.OS === 'ios' ? 'ios' : 'android',
    };

    await apiClient.post(API_ENDPOINTS.NOTIFICATIONS.REGISTER_TOKEN, payload);
    console.log('[FCM] Token registered with backend');
  } catch (err) {
    // Non-blocking: token registration failure must not affect login
    console.warn('[FCM] registerFcmToken warning:', err?.message);
  }
};

// ── Unregister FCM Token on Logout ────────────────────────────────────────────
/**
 * Removes the current FCM token from the backend.
 * Called before clearing auth session on logout.
 * Never throws — failures are warnings only.
 */
const unregisterFcmToken = async () => {
  try {
    const token = await getFcmToken();
    if (!token) return;

    // Use DELETE /api/notifications/remove-token
    await apiClient.delete(API_ENDPOINTS.NOTIFICATIONS.REMOVE_TOKEN, {
      data: { token },
    });
    console.log('[FCM] Token unregistered from backend');
  } catch (err) {
    console.warn('[FCM] unregisterFcmToken warning:', err?.message);
  }
};

// ── Foreground Notification Listener ─────────────────────────────────────────
/**
 * Listen for messages received while the app is in the foreground.
 * FCM does NOT show a system notification automatically for foreground messages.
 * We log/handle the notification data here.
 *
 * @param {Function} onMessage - Callback: (remoteMessage) => void
 * @returns {Function} unsubscribe function
 */
const setupForegroundNotificationListener = (onMessage) => {
  try {
    const messaging = getMessagingInstance();
    if (!messaging) return () => {};

    const unsubscribe = messaging.onMessage(async (remoteMessage) => {
      console.log('[FCM Foreground] Message received:', remoteMessage?.data?.notificationType);

      if (typeof onMessage === 'function') {
        onMessage(remoteMessage);
      }
    });

    return unsubscribe;
  } catch (err) {
    console.warn('[FCM] setupForegroundNotificationListener error:', err?.message);
    return () => {}; // no-op unsubscribe
  }
};

// ── Token Refresh Listener ────────────────────────────────────────────────────
/**
 * Listen for FCM token refresh events.
 * Automatically re-registers the new token with the backend.
 * @returns {Function} unsubscribe function
 */
const setupTokenRefreshListener = () => {
  try {
    const messaging = getMessagingInstance();
    if (!messaging) return () => {};

    const unsubscribe = messaging.onTokenRefresh(async (newToken) => {
      console.log('[FCM] Token refreshed:', newToken.slice(0, 8) + '...');
      try {
        const { useAuthStore } = require('../store/authStore');
        const isAuthenticated = useAuthStore.getState().isAuthenticated;
        if (!isAuthenticated) return;

        const deviceId = getStableDeviceId();
        await apiClient.post(API_ENDPOINTS.NOTIFICATIONS.REGISTER_TOKEN, {
          token: newToken,
          deviceId,
          platform: Platform.OS === 'ios' ? 'ios' : 'android',
        });
        console.log('[FCM] Refreshed token registered with backend');
      } catch (err) {
        console.warn('[FCM] Token refresh registration warning:', err?.message);
      }
    });

    return unsubscribe;
  } catch (err) {
    console.warn('[FCM] setupTokenRefreshListener error:', err?.message);
    return () => {};
  }
};

// ── Notification Deep Link Navigation ────────────────────────────────────────
/**
 * Resolve a notification payload and navigate to the appropriate screen.
 * Reads notificationType (or legacy type) and orderId from the data payload.
 *
 * Supported screens (existing navigators):
 *  - Customer:  OrderDetail
 *  - Admin:     AdminOrderDetail
 *  - Delivery:  DeliveryOrderDetail
 *
 * @param {Object} navigationRef - React Navigation ref (navigationRef.current)
 * @param {Object} payload - Notification data payload
 * @param {string} userRole - Current user role
 */
const handleNotificationDeepLink = (navigationRef, payload = {}, userRole = 'user') => {
  if (!navigationRef || !payload) return;

  const { notificationType, type, orderId } = payload;
  const resolvedType = notificationType || type || '';

  if (!orderId) {
    console.log('[FCM DeepLink] No orderId in payload — skipping navigation');
    return;
  }

  try {
    const deliveryTypes = ['DELIVERY_ASSIGNED', 'delivery', 'delivery_assignment'];
    const isDeliveryType = deliveryTypes.some(t =>
      resolvedType.toUpperCase().includes(t.toUpperCase())
    );

    if (userRole === 'delivery' || isDeliveryType) {
      navigationRef.navigate('DeliveryOrderDetail', { orderId });
    } else if (userRole === 'admin') {
      navigationRef.navigate('AdminOrderDetail', { orderId });
    } else {
      // Customer or unknown role
      navigationRef.navigate('OrderDetail', { orderId });
    }
  } catch (navErr) {
    console.warn('[FCM DeepLink] Navigation error:', navErr?.message);
  }
};

/**
 * Register notification-open (background tap) and quit-state tap handlers.
 * Call once on app startup with the navigation ref.
 *
 * @param {Object} navigationRef - React Navigation ref
 * @param {string} userRole - Current user role
 */
const setupNotificationOpenHandlers = (navigationRef, userRole = 'user') => {
  try {
    const messaging = getMessagingInstance();
    if (!messaging) return;

    // Background state: User tapped notification when app was in background
    messaging.onNotificationOpenedApp((remoteMessage) => {
      console.log('[FCM] Notification opened from background:', remoteMessage?.data);
      const data = remoteMessage?.data || {};
      handleNotificationDeepLink(navigationRef, data, userRole);
    });

    // Quit state: User tapped notification that launched the app from closed state
    messaging
      .getInitialNotification()
      .then((remoteMessage) => {
        if (remoteMessage) {
          console.log('[FCM] App launched from notification:', remoteMessage?.data);
          // Small delay to let navigation mount
          setTimeout(() => {
            const data = remoteMessage?.data || {};
            handleNotificationDeepLink(navigationRef, data, userRole);
          }, 1000);
        }
      })
      .catch((err) => {
        console.warn('[FCM] getInitialNotification error:', err?.message);
      });
  } catch (err) {
    console.warn('[FCM] setupNotificationOpenHandlers error:', err?.message);
  }
};

// ── Fetch notifications from backend ─────────────────────────────────────────
const getNotifications = async (params = {}) => {
  const response = await apiClient.get(API_ENDPOINTS.NOTIFICATIONS.BASE, { params });
  return response.data;
};

const markAsRead = async (id) => {
  const response = await apiClient.put(API_ENDPOINTS.NOTIFICATIONS.MARK_READ(id));
  return response.data;
};

const markAllAsRead = async () => {
  const response = await apiClient.put(API_ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ);
  return response.data;
};

const getUnreadCount = async () => {
  const response = await apiClient.get(API_ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT);
  return response.data;
};

// ── Legacy API compatibility ──────────────────────────────────────────────────
// Kept for backward compatibility with existing code that uses registerDeviceToken/unregisterDeviceToken
const registerDeviceToken = registerFcmToken;
const unregisterDeviceToken = unregisterFcmToken;

export const mobileNotificationService = {
  // Core FCM
  requestNotificationPermission,
  getFcmToken,
  registerFcmToken,
  unregisterFcmToken,
  setupForegroundNotificationListener,
  setupTokenRefreshListener,
  setupNotificationOpenHandlers,

  // Navigation
  handleNotificationDeepLink,

  // Device ID
  getStableDeviceId,

  // Backend API
  getNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,

  // Legacy aliases
  registerDeviceToken,
  unregisterDeviceToken,
};

export default mobileNotificationService;
