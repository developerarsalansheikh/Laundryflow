import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStateStorage } from './mmkvStorage';
import { STORAGE_KEYS } from '../constants/app';

export const useUIStore = create(
  persist(
    (set) => ({
      theme: 'light', // Default app theme is light; theme: 'dark' remains available
      isGlobalLoading: false,
      loadingMessage: '',

      setTheme: (theme) => {
        set({ theme });
      },

      toggleTheme: () => {
        set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' }));
      },

      showGlobalLoading: (message = '') => {
        set({ isGlobalLoading: true, loadingMessage: message });
      },

      hideGlobalLoading: () => {
        set({ isGlobalLoading: false, loadingMessage: '' });
      },
    }),
    {
      name: STORAGE_KEYS.UI,
      storage: createJSONStorage(() => mmkvStateStorage),
      partialize: (state) => ({
        theme: state.theme,
      }),
    }
  )
);
