import { motion, AnimatePresence } from 'framer-motion';
import { Waves, Zap, ChevronLeft } from 'lucide-react';
import { useUIStore } from '../../store/uiStore';

/**
 * SidebarHeader — LaundryFlow branding and collapse toggle.
 */
export const SidebarHeader = () => {
  const { sidebarCollapsed, toggleSidebar } = useUIStore();

  return (
    <div className="flex items-center justify-between px-4 py-5 border-b border-borderSubtle">
      <div className="flex items-center gap-3 min-w-0">
        {/* Logo Icon */}
        <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-primaryPurple to-brandIndigo flex items-center justify-center shadow-glowPurple">
          <Waves className="w-5 h-5 text-white" strokeWidth={2.5} />
        </div>

        {/* Brand Text */}
        <AnimatePresence initial={false}>
          {!sidebarCollapsed && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <p className="text-sm font-bold text-textPrimary leading-none whitespace-nowrap">
                LaundryFlow
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <Zap className="w-2.5 h-2.5 text-primaryPurple" />
                <span className="text-[10px] font-semibold text-primaryPurple uppercase tracking-widest whitespace-nowrap">
                  Super Admin
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Collapse toggle — only on desktop */}
      {!sidebarCollapsed && (
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label="Collapse sidebar"
          className="hidden lg:flex flex-shrink-0 w-7 h-7 items-center justify-center rounded-lg text-textMuted hover:text-textPrimary hover:bg-cardHover transition-all duration-200 outline-none focus-visible:ring-1 focus-visible:ring-primaryPurple"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default SidebarHeader;
