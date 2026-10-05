import { create } from 'zustand';

/**
 * Centralized Network State Store (RN-9)
 * Tracks online/offline connectivity, network reachability, and reconnection events.
 */
export const useNetworkStore = create((set, get) => ({
  isConnected: true,
  isInternetReachable: true,
  wasOffline: false,
  connectionType: 'wifi',

  setNetworkState: ({ isConnected, isInternetReachable, type }) => {
    const prevConnected = get().isConnected;
    const nowConnected = Boolean(isConnected);

    set({
      isConnected: nowConnected,
      isInternetReachable: isInternetReachable !== undefined ? Boolean(isInternetReachable) : nowConnected,
      connectionType: type || get().connectionType,
      wasOffline: !prevConnected && nowConnected ? true : get().wasOffline,
    });
  },

  clearWasOffline: () => {
    set({ wasOffline: false });
  },
}));

/**
 * Hook providing direct boolean online status
 */
export const useIsOnline = () => {
  return useNetworkStore((state) => state.isConnected);
};

export default useNetworkStore;
