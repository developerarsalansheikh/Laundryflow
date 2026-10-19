import { create } from 'zustand';

/**
 * Centralized Network and Server State Store (LaundryFlow RN-9)
 * Tracks online/offline connectivity, Render server cold-starts, reachability,
 * and enables manual Retry actions across the app.
 */
export const useNetworkStore = create((set, get) => ({
  isConnected: true,
  isInternetReachable: true,
  isServerReachable: true,
  isColdStarting: false,
  lastErrorType: 'none', // 'none' | 'offline' | 'cold_start' | 'timeout' | 'server_error'
  wasOffline: false,
  isRetrying: false,

  setNetworkState: ({ isConnected, isInternetReachable, isServerReachable, isColdStarting, lastErrorType }) => {
    const prevConnected = get().isConnected;
    const nowConnected = isConnected !== undefined ? Boolean(isConnected) : get().isConnected;

    set({
      isConnected: nowConnected,
      isInternetReachable: isInternetReachable !== undefined ? Boolean(isInternetReachable) : get().isInternetReachable,
      isServerReachable: isServerReachable !== undefined ? Boolean(isServerReachable) : get().isServerReachable,
      isColdStarting: isColdStarting !== undefined ? Boolean(isColdStarting) : get().isColdStarting,
      lastErrorType: lastErrorType || get().lastErrorType,
      wasOffline: !prevConnected && nowConnected ? true : get().wasOffline,
    });
  },

  reportRequestSuccess: () => {
    const prevOffline = !get().isConnected || !get().isServerReachable;
    set({
      isConnected: true,
      isInternetReachable: true,
      isServerReachable: true,
      isColdStarting: false,
      lastErrorType: 'none',
      wasOffline: prevOffline ? true : get().wasOffline,
    });
  },

  reportRequestError: (appError) => {
    if (!appError) return;

    if (appError.isNetworkError && !appError.isTimeout) {
      set({
        isConnected: false,
        isServerReachable: false,
        isColdStarting: false,
        lastErrorType: 'offline',
      });
    } else if (appError.isTimeout) {
      set({
        isServerReachable: false,
        isColdStarting: true,
        lastErrorType: 'timeout',
      });
    } else if (appError.isServerError) {
      // 502/503/504 Render gateway while booting
      const status = appError.status;
      const isCold = status === 502 || status === 503 || status === 504;
      set({
        isServerReachable: false,
        isColdStarting: isCold,
        lastErrorType: isCold ? 'cold_start' : 'server_error',
      });
    }
  },

  setRetrying: (status) => {
    set({ isRetrying: status });
  },

  clearWasOffline: () => {
    set({ wasOffline: false });
  },
}));

export const useIsOnline = () => {
  return useNetworkStore((state) => state.isConnected);
};

export default useNetworkStore;
