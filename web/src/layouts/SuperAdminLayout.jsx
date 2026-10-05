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
  const contentLeft = sidebarCollapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH;

  return (
    <AppBackground>
      {/* Desktop Sidebar */}
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
        className="flex flex-col min-h-screen pt-16 lg:pl-0"
        style={{ paddingLeft: 0 }}
      >
        <div className="hidden lg:block" />
        <PageContainer>
          <Outlet />
        </PageContainer>
      </motion.main>
    </AppBackground>
  );
};

export default SuperAdminLayout;
