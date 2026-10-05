export const APP_CONFIG = Object.freeze({
  APP_NAME: 'LaundryFlow',
  VERSION: '1.0.0',
  DEFAULT_PAGE_SIZE: 15,
  QUERY_STALE_TIME_MS: 5 * 60 * 1000, // 5 minutes
  QUERY_GC_TIME_MS: 10 * 60 * 1000,   // 10 minutes
});

export const STORAGE_KEYS = Object.freeze({
  AUTH: 'laundryflow_auth_store',
  UI: 'laundryflow_ui_store',
  CART: 'laundryflow_cart_store',
  FAVORITES: 'laundryflow_favorites_store',
  LOCATION: 'laundryflow_location_store',
  CACHE_PREFIX: 'laundryflow_cache_',
});

