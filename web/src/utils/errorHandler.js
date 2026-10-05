/**
 * Centralized API Error Normalization for Web Admin (RN-9)
 */

export class AppError extends Error {
  constructor({
    message,
    status = null,
    code = 'UNKNOWN_ERROR',
    details = null,
    isNetworkError = false,
    isTimeout = false,
    isUnauthorized = false,
    isServerError = false,
  }) {
    super(message);
    this.name = 'AppError';
    this.success = false;
    this.status = status;
    this.code = code;
    this.details = details;
    this.isNetworkError = isNetworkError;
    this.isTimeout = isTimeout;
    this.isUnauthorized = isUnauthorized;
    this.isServerError = isServerError;
    this.response = details ? { status, data: details } : null;
  }

  toJSON() {
    return {
      success: false,
      status: this.status,
      code: this.code,
      message: this.message,
      isNetworkError: this.isNetworkError,
      isTimeout: this.isTimeout,
      isUnauthorized: this.isUnauthorized,
      isServerError: this.isServerError,
    };
  }
}

export const parseApiError = (error) => {
  if (error instanceof AppError) {
    return error;
  }

  const isTimeout =
    error.code === 'ECONNABORTED' ||
    error.code === 'ETIMEDOUT' ||
    error.message?.toLowerCase().includes('timeout');

  if (isTimeout) {
    return new AppError({
      message: 'Request timed out. Please check your network and try again.',
      status: 408,
      code: 'TIMEOUT',
      isTimeout: true,
      isNetworkError: true,
    });
  }

  const isNetwork =
    error.message === 'Network Error' ||
    error.code === 'ERR_NETWORK' ||
    !error.response;

  if (isNetwork) {
    return new AppError({
      message: 'Unable to connect to the server. Please check your internet connection.',
      status: null,
      code: 'NETWORK_ERROR',
      isNetworkError: true,
    });
  }

  const status = error.response?.status ?? null;
  const data = error.response?.data;

  let message = data?.message || data?.error;
  let code = data?.code || `HTTP_${status}`;

  const isUnauthorized = status === 401;
  const isServerError = status ? status >= 500 && status <= 599 : false;

  if (!message) {
    switch (status) {
      case 400:
        message = 'Invalid request parameters.';
        code = 'BAD_REQUEST';
        break;
      case 401:
        message = 'Session expired. Please log in again.';
        code = 'UNAUTHORIZED';
        break;
      case 403:
        message = 'Access denied. You do not have permission to view this resource.';
        code = 'FORBIDDEN';
        break;
      case 404:
        message = 'Resource not found.';
        code = 'NOT_FOUND';
        break;
      case 429:
        message = 'Too many requests. Please slow down and try again.';
        code = 'RATE_LIMITED';
        break;
      case 500:
      case 502:
      case 503:
        message = 'Server encountered a temporary issue. Please try again shortly.';
        code = 'SERVER_ERROR';
        break;
      default:
        message = 'An unexpected error occurred.';
        code = 'UNKNOWN_ERROR';
    }
  }

  return new AppError({
    message,
    status,
    code,
    details: data,
    isNetworkError: false,
    isTimeout: false,
    isUnauthorized,
    isServerError,
  });
};

export default parseApiError;
