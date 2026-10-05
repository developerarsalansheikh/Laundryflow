import { storage } from '../store/mmkvStorage';

/**
 * MMKV utility functions for typed and safe storage operations
 */
export const StorageUtil = {
  getString: (key, defaultValue = null) => {
    try {
      const val = storage.getString(key);
      return val !== undefined ? val : defaultValue;
    } catch {
      return defaultValue;
    }
  },

  setString: (key, value) => {
    try {
      storage.set(key, value);
    } catch (e) {
      console.warn(`[StorageUtil] Error setting string for key "${key}":`, e);
    }
  },

  getObject: (key, defaultValue = null) => {
    try {
      const raw = storage.getString(key);
      if (!raw) return defaultValue;
      return JSON.parse(raw);
    } catch {
      return defaultValue;
    }
  },

  setObject: (key, value) => {
    try {
      storage.set(key, JSON.stringify(value));
    } catch (e) {
      console.warn(`[StorageUtil] Error setting object for key "${key}":`, e);
    }
  },

  getBoolean: (key, defaultValue = false) => {
    try {
      const val = storage.getBoolean(key);
      return val !== undefined ? val : defaultValue;
    } catch {
      return defaultValue;
    }
  },

  setBoolean: (key, value) => {
    try {
      storage.set(key, Boolean(value));
    } catch (e) {
      console.warn(`[StorageUtil] Error setting boolean for key "${key}":`, e);
    }
  },

  remove: (key) => {
    try {
      storage.delete(key);
    } catch (e) {
      console.warn(`[StorageUtil] Error deleting key "${key}":`, e);
    }
  },

  clearAll: () => {
    try {
      storage.clearAll();
    } catch (e) {
      console.warn('[StorageUtil] Error clearing storage:', e);
    }
  },
};
