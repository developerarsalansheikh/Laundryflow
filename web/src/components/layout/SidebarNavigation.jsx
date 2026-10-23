import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Store, ShoppingBag, Users, UserCheck,
  CreditCard, DollarSign, BarChart3, FileText, HelpCircle, Settings,
  Sparkles, Coins, Globe,
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
    <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3.5 py-4 space-y-2 scrollbar-thin">
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
                `flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all duration-200 outline-none ${
                  isActive
                    ? 'bg-[#2563eb] text-white font-bold shadow-md shadow-blue-600/25'
                    : 'text-slate-300 hover:text-white hover:bg-white/[0.06]'
                }`
              }
            >
              <div className="flex items-center gap-3.5 min-w-0">
                {/* Icon */}
                <span className={`flex-shrink-0 transition-colors duration-200 ${isActive ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>
                  <Icon className="w-5 h-5" strokeWidth={isActive ? 2.3 : 1.9} />
                </span>

                {/* Label */}
                <AnimatePresence initial={false}>
                  {!sidebarCollapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.2 }}
                      className="text-[15px] font-semibold tracking-normal overflow-hidden whitespace-nowrap"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>

              {/* Badges for Analytics / Reports */}
              {!sidebarCollapsed && (item.id === 'analytics' || item.id === 'reports') && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  isActive ? 'bg-white/20 text-white' : 'bg-blue-500/20 text-blue-400'
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

      {/* Return to Public LaundryWave Website */}
      <div className="pt-2 border-t border-white/[0.08] mt-2">
        <NavLink
          to="/"
          onClick={onNavigate}
          aria-label="Visit LaundryWave Website"
          className="flex items-center gap-3.5 px-4 py-3.5 rounded-2xl text-[15px] font-semibold text-blue-400 hover:text-white hover:bg-white/[0.06] transition-all"
        >
          <span className="flex-shrink-0 text-blue-400">
            <Globe className="w-5 h-5" strokeWidth={1.9} />
          </span>
          <AnimatePresence initial={false}>
            {!sidebarCollapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden whitespace-nowrap"
              >
                Visit LaundryWave Website
              </motion.span>
            )}
          </AnimatePresence>
        </NavLink>
      </div>
    </nav>
  );
};

export default SidebarNavigation;
