import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import { useUIStore } from '../../store/uiStore';

/**
 * SidebarHeader — LaundryFlow branding and collapse toggle.
 */
export const SidebarHeader = () => {
  const { sidebarCollapsed, toggleSidebar } = useUIStore();

  return (
    <div className="flex items-center justify-between px-4 py-4 border-b border-white/[0.08]">
      <div className="flex items-center gap-3 min-w-0">
        {/* Logo Icon */}
        <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center shadow-xs overflow-hidden">
          <img
            src="/logo.png"
            alt="Dhoyoo Laundry"
            className="w-7 h-7 object-contain"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.parentElement.innerText = 'DL';
            }}
          />
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
              <p className="text-sm font-bold text-white leading-tight whitespace-nowrap tracking-tight">
                Dhoyoo Laundry
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] font-semibold text-slate-400 tracking-wide uppercase whitespace-nowrap">
                  Store Operations
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
          className="hidden lg:flex flex-shrink-0 w-7 h-7 items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-all duration-200 outline-none cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default SidebarHeader;
