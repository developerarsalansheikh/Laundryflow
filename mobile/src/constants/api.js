let Config = {};
try {
  const rnc = require('react-native-config');
  Config = rnc.default || rnc.Config || rnc || {};
} catch (e) {
  console.warn('[Config] Native RNCConfigModule unavailable:', e?.message);
}

// Render production backend — https://laundryflow-657q.onrender.com
const PROD_HOST = 'https://laundryflow-657q.onrender.com';

// LAN host for physical device local development (never 10.0.2.2)
const DEV_LAN_HOST = 'http://192.168.1.122:8080';

// Preserve separate production configuration path
const isProduction = Config?.APP_ENV === 'production';
const fallbackHost = isProduction ? PROD_HOST : DEV_LAN_HOST;

export const API_BASE_URL = Config?.API_BASE_URL || `${fallbackHost}/api`;
export const SOCKET_URL = Config?.SOCKET_URL || fallbackHost;
export const API_TIMEOUT_MS = Number(Config?.API_TIMEOUT_MS) || 15000;
export const APP_ENV = Config?.APP_ENV || (isProduction ? 'production' : 'development');

console.log(
  `[API Config] Initialized | BaseURL: ${API_BASE_URL} | Source: ${
    Config?.API_BASE_URL ? 'react-native-config' : 'environment fallback'
  }`
);

export const HTTP_STATUS = Object.freeze({
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  RATE_LIMITED: 429,
  SERVER_ERROR: 500,
});
