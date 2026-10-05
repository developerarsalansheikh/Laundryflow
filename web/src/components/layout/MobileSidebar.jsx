import { useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useUIStore } from '../../store/uiStore';
import { SidebarHeader } from './SidebarHeader';
import { SidebarNavigation } from './SidebarNavigation';
import { SidebarFooter } from './SidebarFooter';

/**
 * MobileSidebar — slide-over drawer for tablet and mobile viewports.
 * Closes on: backdrop click, route navigation, and Escape key.
 */
export const MobileSidebar = () => {
  const { mobileSidebarOpen, setMobileSidebarOpen } = useUIStore();

  const close = useCallback(() => setMobileSidebarOpen(false), [setMobileSidebarOpen]);

  // Close on Escape key
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    if (mobileSidebarOpen) {
      document.addEventListener('keydown', onKey);
    }
    return () => document.removeEventListener('keydown', onKey);
  }, [mobileSidebarOpen, close]);

  return (
    <AnimatePresence>
      {mobileSidebarOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={close}
            aria-hidden="true"
          />

          {/* Drawer panel */}
          <motion.aside
            key="drawer"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 38 }}
            className="fixed top-0 left-0 h-screen w-[260px] z-50 flex flex-col lg:hidden"
            style={{
              backgroundColor: '#080C1D',
              borderRight: '1px solid rgba(255,255,255,0.07)',
            }}
            role="dialog"
            aria-modal="true"
            aria-label="Mobile navigation"
          >
            {/* Close button */}
            <button
              type="button"
              onClick={close}
              aria-label="Close navigation"
              className="absolute top-4 right-4 z-10 flex items-center justify-center w-7 h-7 rounded-lg text-textMuted hover:text-textPrimary hover:bg-cardHover transition-all duration-200 outline-none focus-visible:ring-1 focus-visible:ring-primaryPurple cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <SidebarHeader />
            <SidebarNavigation onNavigate={close} />
            <SidebarFooter />
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

export default MobileSidebar;
