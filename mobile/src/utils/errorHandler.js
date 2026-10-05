/**
 * Centralized API Error Handling Utility for LaundryFlow (RN-9)
 * Normalizes all HTTP, network, and timeout errors into a consistent structure.
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

    // Backward-compat compatibility with existing checks like error.response?.data
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

/**
 * Parses any raw error into a normalized, user-friendly AppError object
 */
export const parseApiError = (error) => {
  // Already parsed
  if (error instanceof AppError) {
    return error;
  }

  // 1. Timeout Errors (Axios timeout or ECONNABORTED)
  const isTimeout =
    error.code === 'ECONNABORTED' ||
    error.code === 'ETIMEDOUT' ||
    error.message?.toLowerCase().includes('timeout');

  if (isTimeout) {
    return new AppError({
      message: 'Request timed out. Please check your connection and try again.',
      status: 408,
      code: 'TIMEOUT',
      isTimeout: true,
      isNetworkError: true,
    });
  }

  // 2. Network Errors (No internet or unreachable host)
  const isNetwork =
    error.message === 'Network Error' ||
    error.code === 'ERR_NETWORK' ||
    error.code === 'ENOTFOUND' ||
    !error.response;

  if (isNetwork) {
    return new AppError({
      message: 'Unable to connect to the server. Please check your internet connection.',
      status: null,
      code: 'NETWORK_ERROR',
      isNetworkError: true,
    });
  }

  // 3. HTTP Server & Client Responses
  const status = error.response?.status ?? null;
  const data = error.response?.data;

  // Extract server error message or provide friendly fallback
  let message = data?.message || data?.error;
  let code = data?.code || `HTTP_${status}`;

  const isUnauthorized = status === 401;
  const isServerError = status ? status >= 500 && status <= 599 : false;

  if (!message) {
    switch (status) {
      case 400:
        message = 'Invalid request. Please check the entered data.';
        code = 'BAD_REQUEST';
        break;
      case 401:
        message = 'Your session has expired. Please log in again.';
        code = 'UNAUTHORIZED';
        break;
      case 403:
        message = 'You do not have permission to perform this action.';
        code = 'FORBIDDEN';
        break;
      case 404:
        message = 'The requested service or record was not found.';
        code = 'NOT_FOUND';
        break;
      case 409:
        message = 'A conflict occurred. This action may have already been processed.';
        code = 'CONFLICT';
        break;
      case 422:
        message = 'Unable to process the entered data. Please check all fields.';
        code = 'UNPROCESSABLE_ENTITY';
        break;
      case 429:
        message = 'Too many requests. Please wait a moment and try again.';
        code = 'RATE_LIMITED';
        break;
      case 500:
      case 502:
      case 503:
      case 504:
        message = 'Our servers are experiencing a temporary issue. Please try again shortly.';
        code = 'SERVER_ERROR';
        break;
      default:
        message = 'An unexpected error occurred. Please try again.';
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
