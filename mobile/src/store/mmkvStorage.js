import { MMKV } from 'react-native-mmkv';

/**
 * Single MMKV instance for LaundryFlow mobile app
 */
export const storage = new MMKV({
  id: 'laundryflow-app-storage',
});

/**
 * Zustand StateStorage adapter for MMKV
 */
export const mmkvStateStorage = {
  setItem: (name, value) => {
    return storage.set(name, value);
  },
  getItem: (name) => {
    const value = storage.getString(name);
    return value ?? null;
  },
  removeItem: (name) => {
    return storage.delete(name);
  },
};
