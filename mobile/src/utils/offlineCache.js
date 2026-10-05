import { storage } from '../store/mmkvStorage';

const CACHE_PREFIX = 'lf_offline_cache_';
const DEFAULT_TTL_MS = 1000 * 60 * 60 * 24; // 24 hours

/**
 * Offline Cache Utility for MMKV (RN-9)
 * Persists and retrieves safe, cacheable data (marketplace, services, orders)
 * Strictly does NOT store sensitive secrets, passwords, OTPs, or payment credentials.
 */
export const OfflineCache = {
  /**
   * Save serializable data with timestamp
   */
  set: (key, data) => {
    try {
      if (data === undefined || data === null) return;
      const payload = {
        data,
        cachedAt: Date.now(),
      };
      storage.set(`${CACHE_PREFIX}${key}`, JSON.stringify(payload));
    } catch (err) {
      if (__DEV__) {
        console.warn(`[OfflineCache] Error writing cache for ${key}:`, err.message);
      }
    }
  },

  /**
   * Retrieve cached data if valid and within maxAgeMs
   */
  get: (key, maxAgeMs = DEFAULT_TTL_MS) => {
    try {
      const raw = storage.getString(`${CACHE_PREFIX}${key}`);
      if (!raw) return null;

      const parsed = JSON.parse(raw);
      if (!parsed || !parsed.cachedAt) return null;

      const isExpired = Date.now() - parsed.cachedAt > maxAgeMs;
      if (isExpired) {
        storage.delete(`${CACHE_PREFIX}${key}`);
        return null;
      }

      return parsed.data;
    } catch (err) {
      if (__DEV__) {
        console.warn(`[OfflineCache] Error reading cache for ${key}:`, err.message);
      }
      return null;
    }
  },

  /**
   * Remove a specific cached key
   */
  remove: (key) => {
    try {
      storage.delete(`${CACHE_PREFIX}${key}`);
    } catch (err) {
      if (__DEV__) {
        console.warn(`[OfflineCache] Error deleting cache for ${key}:`, err.message);
      }
    }
  },

  /**
   * Clear all offline cached query items
   */
  clearAll: () => {
    try {
      const allKeys = storage.getAllKeys();
      allKeys.forEach((k) => {
        if (k.startsWith(CACHE_PREFIX)) {
          storage.delete(k);
        }
      });
    } catch (err) {
      if (__DEV__) {
        console.warn('[OfflineCache] Error clearing cache:', err.message);
      }
    }
  },
};

export default OfflineCache;
