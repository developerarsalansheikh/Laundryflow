import { create } from 'zustand';

/**
 * UI Zustand store.
 * Manages application shell UI state: sidebar collapse, mobile drawer, command palette, theme.
 */
export const useUIStore = create((set) => ({
  sidebarCollapsed: false,
  mobileSidebarOpen: false,
  commandPaletteOpen: false,
  theme: 'dark',

  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  setMobileSidebarOpen: (open) => set({ mobileSidebarOpen: open }),
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  setTheme: (theme) => set({ theme }),
}));

export default useUIStore;
