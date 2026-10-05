/**
 * Development-only Web Config Stub for react-native-config
 * Provides environment variables for React Native Web / Vite preview
 */
export const Config = {
  API_BASE_URL: '/api',
  SOCKET_URL: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5174',
  API_TIMEOUT_MS: '15000',
  APP_ENV: 'development',
};

export default Config;
