import api from './axios';

/**
 * LaundryFlow Authentication API Abstraction.
 *
 * All endpoints sourced from AUTH_CONTRACT.md — discovered from real backend.
 * DO NOT add endpoints that don't exist in the backend.
 */

/**
 * login — POST /api/auth/login
 * Super Admin uses email + password (not OTP).
 *
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{ accessToken: string, user: object }>}
 */
export const loginApi = async (email, password) => {
  const response = await api.post('/api/auth/login', { email, password });
  // Backend response shape: { success, message, data: { accessToken, user } }
  return response.data.data;
};

/**
 * refreshTokenApi — POST /api/auth/refresh-token
 * Uses HttpOnly refreshToken cookie (sent automatically by browser via withCredentials).
 *
 * @returns {Promise<string>} new accessToken
 */
export const refreshTokenApi = async () => {
  const response = await api.post('/api/auth/refresh-token');
  return response.data.data.accessToken;
};

/**
 * logoutApi — POST /api/auth/logout
 * Clears refreshToken cookie server-side.
 * Does not require Authorization header (uses cookie directly).
 */
export const logoutApi = async () => {
  await api.post('/api/auth/logout');
};
