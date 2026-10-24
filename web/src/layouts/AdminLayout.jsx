import { useState, useEffect } from 'react';
import { Link, NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Package,
  Sparkles,
  Truck,
  Users,
  Clock,
  Bell,
  Store,
  Menu,
  X,
  LogOut,
  ChevronRight,
  ShieldCheck,
  Globe,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { adminApi } from '../api/adminApi';
import { logoutApi } from '../api/auth';
import { ROUTES } from '../routes/routeConstants';
import { AppBackground } from '../components/common/AppBackground';
import { useAdminSocket } from '../hooks/useAdminSocket';
import { UserMenu } from '../components/common/UserMenu';

const NAV_ITEMS = [
  { path: ROUTES.ADMIN.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
  { path: ROUTES.ADMIN.ORDERS, label: 'Orders', icon: Package },
  { path: ROUTES.ADMIN.SERVICES, label: 'Services', icon: Sparkles },
  { path: ROUTES.ADMIN.DELIVERY, label: 'Delivery', icon: Truck },
  { path: ROUTES.ADMIN.CUSTOMERS, label: 'Customers', icon: Users },
  { path: ROUTES.ADMIN.TIME_SLOTS, label: 'Time Slots', icon: Clock },
  { path: ROUTES.ADMIN.NOTIFICATIONS, label: 'Notifications', icon: Bell, badge: true },
  { path: ROUTES.ADMIN.PROFILE, label: 'Store Profile', icon: Store },
];

export const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, clearAuth } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Real-time socket updates for all admin views
  useAdminSocket();

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Fetch Laundry Profile info for topbar/sidebar brand
  const { data: laundry } = useQuery({
    queryKey: ['admin-my-laundry'],
    queryFn: adminApi.getMyLaundry,
    staleTime: 1000 * 60 * 5,
  });

  // Fetch Unread Notification Count
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['admin-notifications-count'],
    queryFn: adminApi.getUnreadCount,
    refetchInterval: 1000 * 30, // Poll every 30s
  });

  const handleLogout = async () => {
    try {
      await logoutApi();
    } catch {
      // Handled silently
    } finally {
      clearAuth();
      navigate(ROUTES.AUTH.LOGIN, { replace: true });
    }
  };

  const storeName = laundry?.name || user?.storeName || user?.laundryName || user?.name || 'Dhoyoo Laundry';

  return (
    <AppBackground>
      {/* ── Desktop Fixed Glass Sidebar ────────────────────────────── */}
      <aside
        className="hidden lg:flex flex-col fixed top-0 left-0 h-screen w-64 z-40 overflow-hidden"
        style={{
          backgroundColor: '#1C1917',
          borderRight: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '4px 0 24px rgba(0,0,0,0.2)',
        }}
        aria-label="Admin navigation"
      >
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-5 h-16 border-b border-white/[0.08] flex-shrink-0">
          <div className="w-10 h-10 rounded-xl bg-[#292524] border border-stone-600/50 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-xs">
            <img
              src="/logo.svg"
              alt="LaundryWave"
              className="w-7 h-7 object-contain"
              onError={(e) => {
                e.currentTarget.src = '/logo.png';
              }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-bold truncate text-white leading-tight tracking-tight">
              {storeName}
            </h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
              <span className="text-[10px] font-semibold text-stone-400 font-oswald uppercase tracking-wider">
                Store Operations
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3.5 py-4 space-y-2 overflow-y-auto scrollbar-thin">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              location.pathname === item.path ||
              (item.path !== ROUTES.ADMIN.DASHBOARD && location.pathname.startsWith(item.path));

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex items-center justify-between px-4 py-3.5 rounded-2xl text-[14px] font-semibold transition-all duration-200 outline-none ${
                  isActive
                    ? 'bg-stone-800 text-white font-bold border border-stone-700/60 shadow-xs'
                    : 'text-stone-300 hover:text-white hover:bg-white/[0.06]'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <Icon
                    className={`w-5 h-5 flex-shrink-0 transition-colors ${
                      isActive ? 'text-white' : 'text-stone-300 group-hover:text-white'
                    }`}
                    strokeWidth={isActive ? 2.3 : 1.9}
                  />
                  <span className="truncate">{item.label}</span>
                </div>

                {item.badge && unreadCount > 0 && (
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                    isActive ? 'bg-white/20 text-white' : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    {unreadCount}
                  </span>
                )}
              </NavLink>
            );
          })}

          <div className="pt-2 border-t border-white/[0.08] mt-2">
            <Link
              to={ROUTES.PUBLIC.HOME}
              className="flex items-center gap-3.5 px-4 py-3 rounded-2xl text-[14px] font-semibold text-stone-300 hover:text-white hover:bg-white/[0.06] transition-all"
              title="Visit LaundryWave Website"
            >
              <Globe className="w-5 h-5 flex-shrink-0 text-stone-400" />
              <span>Visit LaundryWave Website</span>
            </Link>
          </div>
        </nav>

        {/* Sidebar Footer User Card */}
        <div className="p-4 border-t border-white/[0.08]">
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Store Admin</span>
              </div>
              <span className="text-[10px] font-medium text-stone-400">
                {laundry?.city || 'Facility'}
              </span>
            </div>
            <p className="text-xs font-bold truncate text-white">
              {user?.name || user?.fullName || laundry?.owner?.name || 'Laundry Admin'}
            </p>
            <p className="text-[10px] font-medium truncate text-stone-400 mt-0.5">
              {user?.email || 'admin@laundrywave.com'}
            </p>
          </div>
        </div>
      </aside>

      {/* ── Mobile Sidebar Drawer Overlay ──────────────────────────────── */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            />

            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              className="fixed inset-y-0 left-0 w-72 max-w-[85vw] flex flex-col z-50"
              style={{
                backgroundColor: '#1C1917',
                borderRight: '1px solid rgba(255,255,255,0.08)',
                boxShadow: '4px 0 30px rgba(0,0,0,0.6)',
              }}
            >
              <div className="flex items-center justify-between px-5 h-16 border-b border-white/[0.08]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#292524] border border-stone-600/50 flex items-center justify-center overflow-hidden">
                    <img
                      src="/logo.svg"
                      alt="LaundryWave"
                      className="w-6 h-6 object-contain"
                      onError={(e) => {
                        e.currentTarget.src = '/logo.png';
                      }}
                    />
                  </div>
                  <span className="text-sm font-bold truncate text-white">{storeName}</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-white/[0.05]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="flex-1 px-3.5 py-4 space-y-2 overflow-y-auto">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;

                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={`flex items-center justify-between px-4 py-3.5 rounded-2xl text-[14px] font-semibold transition-all ${
                        isActive
                          ? 'bg-stone-800 text-white font-bold border border-stone-700/60 shadow-xs'
                          : 'text-stone-300 hover:text-white hover:bg-white/[0.06]'
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-stone-300'}`} strokeWidth={isActive ? 2.3 : 1.9} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && unreadCount > 0 && (
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                          isActive ? 'bg-white/20 text-white' : 'bg-amber-500/20 text-amber-400'
                        }`}>
                          {unreadCount}
                        </span>
                      )}
                    </NavLink>
                  );
                })}
              </nav>

              <div className="p-4 border-t border-white/[0.08] space-y-2">
                <Link
                  to={ROUTES.PUBLIC.HOME}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 w-full py-2.5 text-xs font-semibold text-stone-200 bg-white/10 hover:bg-white/15 rounded-xl transition-colors border border-white/10 font-oswald uppercase tracking-wider"
                >
                  <Globe className="w-4 h-4" />
                  <span>Visit LaundryWave Website</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center justify-center gap-2 w-full py-2.5 text-xs font-semibold text-statusDanger bg-statusDanger/10 hover:bg-statusDanger/20 rounded-xl transition-colors border border-statusDanger/20 font-oswald uppercase tracking-wider"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Main Layout Wrapper (Header + Content) ────────────────────── */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        {/* Top Bar Header */}
        <header
          className="sticky top-0 z-20 flex items-center justify-between px-4 sm:px-8 h-16 transition-colors duration-200"
          style={{
            backgroundColor: 'rgba(250, 249, 246, 0.95)',
            borderBottom: '1px solid #E7E2D8',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            boxShadow: '0 1px 3px 0 rgba(28, 25, 23, 0.04)',
          }}
        >
          {/* Left: Mobile hamburger + Store Identity */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors flex-shrink-0"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-1.5 sm:gap-2 text-xs text-stone-600 min-w-0">
              <span className="font-bold text-stone-900 tracking-tight truncate max-w-[130px] sm:max-w-[200px] md:max-w-xs font-oswald uppercase tracking-wide">
                {storeName}
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-stone-400 hidden sm:inline flex-shrink-0" />
              <span className="text-stone-600 font-medium hidden sm:inline flex-shrink-0 font-erode">Laundry Operations Portal</span>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 ml-auto">
            {/* Return to Public Website */}
            <Link
              to={ROUTES.PUBLIC.HOME}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-stone-800 hover:text-stone-950 bg-white hover:bg-stone-50 border border-[#DDD5C7] shadow-2xs rounded-full transition-colors font-oswald uppercase tracking-wider"
              title="Return to Public LaundryWave Website"
            >
              <Globe className="w-3.5 h-3.5 text-stone-700 flex-shrink-0" />
              <span>Visit LaundryWave Website</span>
            </Link>

            {/* Notifications Shortcut */}
            <button
              onClick={() => navigate(ROUTES.ADMIN.NOTIFICATIONS)}
              className="relative p-2 rounded-xl text-stone-700 hover:text-stone-950 bg-white hover:bg-stone-50 border border-[#DDD5C7] shadow-2xs transition-colors flex-shrink-0 cursor-pointer"
              title="View Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.6)]" />
              )}
            </button>

            <div className="h-6 w-px bg-[#E7E2D8] hidden sm:block mx-0.5 flex-shrink-0" />

            {/* User Identity & Dropdown Menu */}
            <UserMenu />
          </div>
        </header>

        {/* Main Content View */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </AppBackground>
  );
};

export default AdminLayout;
