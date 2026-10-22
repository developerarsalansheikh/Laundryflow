import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useUIStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import { ROUTES } from '../../routes/routeConstants';

/**
 * SidebarHeader — LaundryWave branding and collapse toggle.
 */
export const SidebarHeader = () => {
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const { user } = useAuthStore();
  const [imgFailed, setImgFailed] = useState(false);
  const isSuperAdmin = user?.role === 'superadmin';
  const brandName = isSuperAdmin ? 'LaundryWave' : (user?.laundryName || user?.storeName || 'Dhoyoo Laundry');
  const roleLabel = isSuperAdmin ? 'SUPER ADMIN OPS' : 'STORE OPERATIONS';

  return (
    <div className="flex items-center justify-between px-4 h-16 border-b border-white/[0.08] flex-shrink-0">
      <Link
        to={ROUTES.PUBLIC.HOME}
        title="Visit LaundryWave Website"
        className="flex items-center gap-3 min-w-0 group focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-400 rounded-lg"
      >
        {/* Logo Icon */}
        <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-[#1C1917] border border-stone-700/50 flex items-center justify-center shadow-xs overflow-hidden group-hover:border-stone-500 transition-colors">
          <img
            src="/logo.svg"
            alt={brandName}
            className="w-7 h-7 object-contain"
            onError={(e) => { e.currentTarget.src = '/logo.png'; }}
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
              className="overflow-hidden min-w-0"
            >
              <p className="text-sm font-bold text-white leading-tight truncate tracking-tight">
                {brandName}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
                <span className="text-[10px] font-semibold text-slate-400 tracking-wide uppercase whitespace-nowrap">
                  {roleLabel}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Link>

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
