import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStateStorage } from './mmkvStorage';
import { STORAGE_KEYS } from '../constants/app';
import { customerService } from '../services/customerService';
import { useAuthStore } from './authStore';

/**
 * LaundryFlow Favorite Laundries Store (Feature A)
 *
 * Supports:
 * - Local guest persistence via MMKV
 * - Heart toggle (add / remove)
 * - Automatic background sync with backend upon customer authentication
 * - Distance must NEVER hide a favorite laundry
 */
export const useFavoriteStore = create(
  persist(
    (set, get) => ({
      // Array of favorite laundry IDs (strings)
      favoriteIds: [],
      // Map/Dictionary of cached favorite laundry objects by ID
      favoritesMap: {},
      isSyncing: false,

      /**
       * Check if a laundry is marked as favorite
       */
      isFavorite: (laundryId) => {
        if (!laundryId) return false;
        const idStr = String(laundryId._id || laundryId.id || laundryId);
        return get().favoriteIds.includes(idStr);
      },

      /**
       * Toggle favorite status of a laundry
       * Optimistically updates local state; calls backend if user is authenticated.
       */
      toggleFavorite: async (laundry) => {
        if (!laundry) return;
        const laundryId = String(laundry._id || laundry.id || laundry);
        const { favoriteIds, favoritesMap } = get();
        const isFav = favoriteIds.includes(laundryId);

        const isAuthenticated = useAuthStore.getState().isAuthenticated;

        if (isFav) {
          // Remove from favorites
          const newIds = favoriteIds.filter((id) => id !== laundryId);
          const newMap = { ...favoritesMap };
          delete newMap[laundryId];

          set({ favoriteIds: newIds, favoritesMap: newMap });

          if (isAuthenticated) {
            try {
              await customerService.removeFavorite(laundryId);
            } catch (err) {
              console.warn('Failed to remove favorite from server:', err?.message);
            }
          }
        } else {
          // Add to favorites
          const newIds = [...favoriteIds, laundryId];
          const newMap = { ...favoritesMap };
          if (typeof laundry === 'object' && (laundry.name || laundry.title)) {
            newMap[laundryId] = laundry;
          }

          set({ favoriteIds: newIds, favoritesMap: newMap });

          if (isAuthenticated) {
            try {
              await customerService.addFavorite(laundryId);
            } catch (err) {
              console.warn('Failed to add favorite to server:', err?.message);
            }
          }
        }
      },

      /**
       * Synchronize local guest favorites with the backend server upon login
       */
      syncWithServer: async () => {
        const isAuthenticated = useAuthStore.getState().isAuthenticated;
        if (!isAuthenticated) return;

        const { favoriteIds } = get();
        set({ isSyncing: true });

        try {
          // Send local IDs to server sync endpoint
          const res = await customerService.syncFavorites(favoriteIds);
          const serverFavorites = res?.data || [];

          const mergedIds = new Set(favoriteIds);
          const newMap = { ...get().favoritesMap };

          serverFavorites.forEach((item) => {
            const idStr = String(item._id || item.id || item);
            mergedIds.add(idStr);
            if (typeof item === 'object' && item.name) {
              newMap[idStr] = item;
            }
          });

          set({
            favoriteIds: Array.from(mergedIds),
            favoritesMap: newMap,
            isSyncing: false,
          });
        } catch (err) {
          console.warn('Favorite sync error:', err?.message);
          // Fallback: attempt to fetch remote favorites
          try {
            const fetchRes = await customerService.getFavorites();
            const list = fetchRes?.data || [];
            const mergedIds = new Set(get().favoriteIds);
            const newMap = { ...get().favoritesMap };

            list.forEach((item) => {
              const idStr = String(item._id || item.id || item);
              mergedIds.add(idStr);
              if (typeof item === 'object' && item.name) {
                newMap[idStr] = item;
              }
            });

            set({
              favoriteIds: Array.from(mergedIds),
              favoritesMap: newMap,
              isSyncing: false,
            });
          } catch (fetchErr) {
            set({ isSyncing: false });
          }
        }
      },

      /**
       * Direct refresh from backend for authenticated user
       */
      refreshFavorites: async () => {
        const isAuthenticated = useAuthStore.getState().isAuthenticated;
        if (!isAuthenticated) return;

        try {
          const res = await customerService.getFavorites();
          const list = res?.data || [];
          const ids = [];
          const map = { ...get().favoritesMap };

          list.forEach((item) => {
            const idStr = String(item._id || item.id || item);
            ids.push(idStr);
            if (typeof item === 'object' && item.name) {
              map[idStr] = item;
            }
          });

          set({ favoriteIds: ids, favoritesMap: map });
        } catch (err) {
          console.warn('Failed to refresh favorites:', err?.message);
        }
      },

      /**
       * Clear all favorites on logout or account switch
       */
      clearFavorites: () => set({ favoriteIds: [], favoritesMap: {} }),
    }),
    {
      name: STORAGE_KEYS.FAVORITES,
      storage: createJSONStorage(() => mmkvStateStorage),
      partialize: (state) => ({
        favoriteIds: state.favoriteIds,
        favoritesMap: state.favoritesMap,
      }),
    }
  )
);
