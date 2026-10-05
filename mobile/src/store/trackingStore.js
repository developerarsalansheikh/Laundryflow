import { create } from 'zustand';

/**
 * Zustand store for ephemeral real-time delivery tracking state.
 * Prevents full-screen TanStack Query re-renders on high-frequency GPS coordinate updates.
 */
export const useTrackingStore = create((set, get) => ({
  // Map of orderId -> latest driver location payload
  driverLocations: {},
  // Currently viewed/tracked order in customer screen
  activeOrderId: null,
  // Delivery partner location sharing active toggle
  isSharingLocation: false,

  setActiveOrder: (orderId) => set({ activeOrderId: orderId }),

  updateDriverLocation: (orderId, locationData) => {
    if (!orderId || !locationData) return;
    set((state) => ({
      driverLocations: {
        ...state.driverLocations,
        [orderId]: {
          latitude: Number(locationData.latitude ?? locationData.lat),
          longitude: Number(locationData.longitude ?? locationData.lng),
          heading: locationData.heading ?? null,
          accuracy: locationData.accuracy ?? null,
          speed: locationData.speed ?? null,
          timestamp: locationData.timestamp || new Date().toISOString(),
          driverName: locationData.driverName || locationData.deliveryPartner?.name || 'Delivery Partner',
          driverPhone: locationData.driverPhone || locationData.deliveryPartner?.phone || '',
        },
      },
    }));
  },

  clearOrderTracking: (orderId) => {
    set((state) => {
      const updated = { ...state.driverLocations };
      delete updated[orderId];
      return {
        driverLocations: updated,
        activeOrderId: state.activeOrderId === orderId ? null : state.activeOrderId,
      };
    });
  },

  setIsSharingLocation: (isSharing) => set({ isSharingLocation: Boolean(isSharing) }),

  resetTracking: () => set({ driverLocations: {}, activeOrderId: null, isSharingLocation: false }),
}));

export default useTrackingStore;
