import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStateStorage } from './mmkvStorage';
import { STORAGE_KEYS } from '../constants/app';

export const useLocationStore = create(
  persist(
    (set, get) => ({
      city: '',
      address: '',
      latitude: null,
      longitude: null,
      isLocationEstablished: false,
      isHydrated: false,

      /**
       * Set established customer location
       */
      setLocation: ({ city, address, latitude, longitude }) => {
        set({
          city: city ? city.trim() : '',
          address: address ? address.trim() : '',
          latitude: typeof latitude === 'number' ? latitude : (latitude ? parseFloat(latitude) : null),
          longitude: typeof longitude === 'number' ? longitude : (longitude ? parseFloat(longitude) : null),
          isLocationEstablished: Boolean(city && city.trim()),
        });
      },

      /**
       * Clear location state
       */
      clearLocation: () => {
        set({
          city: '',
          address: '',
          latitude: null,
          longitude: null,
          isLocationEstablished: false,
        });
      },

      setHydrated: (status) => {
        set({ isHydrated: status });
      },
    }),
    {
      name: STORAGE_KEYS.LOCATION,
      storage: createJSONStorage(() => mmkvStateStorage),
      partialize: (state) => ({
        city: state.city,
        address: state.address,
        latitude: state.latitude,
        longitude: state.longitude,
        isLocationEstablished: state.isLocationEstablished,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    }
  )
);

export default useLocationStore;
