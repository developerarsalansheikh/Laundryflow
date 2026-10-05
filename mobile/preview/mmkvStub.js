/**
 * Development-only Web MMKV Stub
 * Maps react-native-mmkv operations to browser localStorage for Zustand persistence.
 */

export class MMKV {
  constructor(config = {}) {
    this.id = config.id || 'default';
  }

  set(key, value) {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(`${this.id}:${key}`, String(value));
    }
    return true;
  }

  getString(key) {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(`${this.id}:${key}`);
    }
    return null;
  }

  getNumber(key) {
    const val = this.getString(key);
    return val !== null ? Number(val) : 0;
  }

  getBoolean(key) {
    const val = this.getString(key);
    return val === 'true';
  }

  delete(key) {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(`${this.id}:${key}`);
    }
    return true;
  }

  clearAll() {
    if (typeof window !== 'undefined' && window.localStorage) {
      const prefix = `${this.id}:`;
      Object.keys(window.localStorage).forEach((k) => {
        if (k.startsWith(prefix)) {
          window.localStorage.removeItem(k);
        }
      });
    }
  }
}

export default { MMKV };
