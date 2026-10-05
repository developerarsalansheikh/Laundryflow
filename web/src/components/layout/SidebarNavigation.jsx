import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Store, ShoppingBag, Users, UserCheck,
  CreditCard, DollarSign, BarChart3, FileText, HelpCircle, Settings,
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
                `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 outline-none focus-visible:ring-1 focus-visible:ring-primaryPurple ${
                  isActive
                    ? 'bg-gradient-to-r from-primaryPurple/20 to-brandIndigo/10 border border-primaryPurple/25 shadow-glowPurple text-textPrimary'
                    : 'text-textSecondary hover:text-textPrimary hover:bg-cardBg border border-transparent'
                }`
              }
            >
              {/* Icon */}
              <span className={`flex-shrink-0 transition-colors duration-200 ${isActive ? 'text-purpleLight' : 'text-textMuted group-hover:text-textSecondary'}`}>
                <Icon className="w-[18px] h-[18px]" strokeWidth={isActive ? 2.5 : 2} />
              </span>

              {/* Label */}
              <AnimatePresence initial={false}>
                {!sidebarCollapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`text-sm font-medium overflow-hidden whitespace-nowrap ${
                      isActive ? 'text-textPrimary font-semibold' : ''
                    }`}
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>

              {/* Active indicator bar */}
              {isActive && (
                <motion.div
                  layoutId="activeNavBar"
                  className="absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primaryPurple rounded-l-full"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
            </NavLink>

            {/* Tooltip for collapsed mode */}
            {sidebarCollapsed && (
              <div className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                <div className="glass-panel px-3 py-1.5 rounded-lg whitespace-nowrap text-sm font-medium text-textPrimary border border-borderStrong shadow-floating">
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
