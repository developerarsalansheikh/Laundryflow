import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Store, ShoppingBag, Users, UserCheck,
  CreditCard, DollarSign, BarChart3, FileText, HelpCircle, Settings,
  Sparkles, Coins,
} from 'lucide-react';
import { SUPER_ADMIN_NAV_ITEMS } from '../../constants/navigation';
import { useUIStore } from '../../store/uiStore';

/**
 * Icon map resolving navigation.js icon string identifiers to Lucide components.
 */
const ICON_MAP = {
  LayoutDashboard,
  Store,
  ShoppingBag,
  Users,
  UserCheck,
  CreditCard,
  DollarSign,
  BarChart3,
  FileText,
  Sparkles,
  Coins,
  HelpCircle,
  Settings,
};

/**
 * SidebarNavigation — renders the main Super Admin nav links.
 */
export const SidebarNavigation = ({ onNavigate }) => {
  const { sidebarCollapsed } = useUIStore();
  const location = useLocation();

  return (
    <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-3 space-y-1 scrollbar-thin">
      {SUPER_ADMIN_NAV_ITEMS.map((item) => {
        const Icon = ICON_MAP[item.icon] || LayoutDashboard;
        const isActive = location.pathname === item.path ||
          location.pathname.startsWith(item.path + '/');

        return (
          <div key={item.id} className="relative group">
            <NavLink
              to={item.path}
              onClick={onNavigate}
              aria-label={item.label}
              className={() =>
                `flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 outline-none ${
                  isActive
                    ? 'bg-blue-600 text-white font-semibold shadow-sm shadow-blue-600/30 border border-blue-500/50'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.06] border border-transparent'
                }`
              }
            >
              <div className="flex items-center gap-3 min-w-0">
                {/* Icon */}
                <span className={`flex-shrink-0 transition-colors duration-200 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>
                  <Icon className="w-[18px] h-[18px]" strokeWidth={isActive ? 2.2 : 1.8} />
                </span>

                {/* Label */}
                <AnimatePresence initial={false}>
                  {!sidebarCollapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.2 }}
                      className="text-xs sm:text-sm font-medium overflow-hidden whitespace-nowrap"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>

              {/* Badges for Analytics / Reports */}
              {!sidebarCollapsed && (item.id === 'analytics' || item.id === 'reports') && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                  isActive ? 'bg-white/20 text-white' : 'bg-blue-500/15 text-blue-400 border border-blue-500/20'
                }`}>
                  NEW
                </span>
              )}
            </NavLink>

            {/* Tooltip for collapsed mode */}
            {sidebarCollapsed && (
              <div className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                <div className="px-3 py-1.5 rounded-lg whitespace-nowrap text-xs font-semibold text-white bg-[#0B1120] border border-white/10 shadow-xl">
                  {item.label}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
};

export default SidebarNavigation;
