import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AppBackground } from '../components/common/AppBackground';
import { Sidebar } from '../components/layout/Sidebar';
import { MobileSidebar } from '../components/layout/MobileSidebar';
import { TopNavbar } from '../components/layout/TopNavbar';
import { CommandPalette } from '../components/common/CommandPalette';
import { PageContainer } from '../components/common/PageContainer';
import { useUIStore } from '../store/uiStore';

const SIDEBAR_WIDTH = 260;
const SIDEBAR_COLLAPSED_WIDTH = 76;

/**
 * SuperAdminLayout — primary shell for all authenticated Super Admin routes.
 * Integrates the background, sidebar, top navbar, mobile drawer, command palette, and page container.
 */
export const SuperAdminLayout = () => {
  const { sidebarCollapsed } = useUIStore();
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024;
    }
    return true;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const media = window.matchMedia('(min-width: 1024px)');
    const update = (e) => setIsDesktop(e.matches);
    setIsDesktop(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  const contentLeft = isDesktop ? (sidebarCollapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH) : 0;

  return (
    <AppBackground>
      {/* Desktop Sidebar (hidden on < 1024px) */}
      <Sidebar />

      {/* Mobile Sidebar Drawer */}
      <MobileSidebar />

      {/* Top Navbar */}
      <TopNavbar />

      {/* Command Palette (global) */}
      <CommandPalette />

      {/* Main content area */}
      <motion.main
        animate={{ paddingLeft: contentLeft }}
        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
        className="relative z-10 flex flex-col min-h-screen pt-16 w-full max-w-full overflow-x-hidden min-w-0"
      >
        <div className="hidden lg:block" />
        <PageContainer className="w-full max-w-full overflow-x-hidden">
          <Outlet />
        </PageContainer>
      </motion.main>
    </AppBackground>
  );
};

export default SuperAdminLayout;
