import { motion } from 'framer-motion';
import { useUIStore } from '../../store/uiStore';
import { SidebarHeader } from './SidebarHeader';
import { SidebarNavigation } from './SidebarNavigation';
import { SidebarFooter } from './SidebarFooter';

const SIDEBAR_WIDTH = 260;
const SIDEBAR_COLLAPSED_WIDTH = 76;

/**
 * Desktop Sidebar — fixed, dark navy surface with collapsible behavior.
 */
export const Sidebar = () => {
  const { sidebarCollapsed } = useUIStore();

  return (
    <motion.aside
      animate={{ width: sidebarCollapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      className="hidden lg:flex flex-col fixed top-0 left-0 h-screen z-30 overflow-hidden"
      style={{
        backgroundColor: '#080C1D',
        borderRight: '1px solid rgba(255,255,255,0.07)',
        boxShadow: '4px 0 24px rgba(0,0,0,0.4)',
      }}
      aria-label="Main navigation"
    >
      <SidebarHeader />
      <SidebarNavigation />
      <SidebarFooter />
    </motion.aside>
  );
};

export default Sidebar;
