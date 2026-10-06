import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
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
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { adminApi } from '../api/adminApi';
import { logoutApi } from '../api/auth';
import { ROUTES } from '../routes/routeConstants';
import { AppBackground } from '../components/common/AppBackground';
import { useAdminSocket } from '../hooks/useAdminSocket';

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

  const storeName = laundry?.name || user?.name || 'Laundry Operations';

  return (
    <AppBackground>
      {/* ── Desktop Fixed Glass Sidebar ────────────────────────────── */}
      <aside
        className="hidden lg:flex flex-col fixed top-0 left-0 h-screen w-64 z-30 overflow-hidden"
        style={{
          backgroundColor: '#080C1D',
          borderRight: '1px solid rgba(255,255,255,0.07)',
          boxShadow: '4px 0 24px rgba(0,0,0,0.5)',
        }}
        aria-label="Admin navigation"
      >
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-6 h-16 border-b border-white/[0.07]">
          <img
            src="/logo.png"
            alt="LaundryFlow"
            className="w-10 h-10 rounded-xl object-cover shadow-glowPurple border border-white/10 flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-bold truncate text-textPrimary leading-tight tracking-tight">
              {storeName}
            </h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
              <span className="text-[11px] font-semibold text-textMuted">
                Store Operations
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto scrollbar-thin">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              location.pathname === item.path ||
              (item.path !== ROUTES.ADMIN.DASHBOARD && location.pathname.startsWith(item.path));

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 outline-none ${
                  isActive
                    ? 'bg-gradient-to-r from-primaryPurple/25 to-brandIndigo/15 border border-primaryPurple/35 shadow-glowPurple text-textPrimary font-semibold'
                    : 'text-textSecondary hover:text-textPrimary hover:bg-white/[0.04] border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon
                    className={`w-[18px] h-[18px] flex-shrink-0 transition-colors ${
                      isActive ? 'text-purpleLight' : 'text-textMuted group-hover:text-textSecondary'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>

                {item.badge && unreadCount > 0 && (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    {unreadCount}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Sidebar Footer User Card */}
        <div className="p-4 border-t border-white/[0.07]">
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Store Admin</span>
              </div>
              <span className="text-[10px] font-medium text-textMuted">
                {laundry?.city || 'Facility'}
              </span>
            </div>
            <p className="text-xs font-medium truncate text-textSecondary">
              {user?.email || 'admin@laundryflow.com'}
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
                backgroundColor: '#080C1D',
                borderRight: '1px solid rgba(255,255,255,0.08)',
                boxShadow: '4px 0 30px rgba(0,0,0,0.8)',
              }}
            >
              <div className="flex items-center justify-between px-5 h-16 border-b border-white/[0.07]">
                <div className="flex items-center gap-2.5">
                  <img
                    src="/logo.png"
                    alt="LaundryFlow"
                    className="w-8 h-8 rounded-lg object-cover border border-white/10"
                  />
                  <span className="text-sm font-bold truncate text-textPrimary">{storeName}</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-textMuted hover:text-textPrimary hover:bg-white/[0.05]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;

                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-primaryPurple/25 to-brandIndigo/15 border border-primaryPurple/35 shadow-glowPurple text-textPrimary'
                          : 'text-textSecondary hover:text-textPrimary hover:bg-white/[0.04]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-purpleLight' : 'text-textMuted'}`} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && unreadCount > 0 && (
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          {unreadCount}
                        </span>
                      )}
                    </NavLink>
                  );
                })}
              </nav>

              <div className="p-4 border-t border-white/[0.07]">
                <button
                  onClick={handleLogout}
                  className="flex items-center justify-center gap-2 w-full py-2.5 text-xs font-semibold text-statusDanger bg-statusDanger/10 hover:bg-statusDanger/20 rounded-xl transition-colors border border-statusDanger/20"
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
            backgroundColor: 'rgba(7, 10, 23, 0.8)',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
          }}
        >
          {/* Left: Mobile hamburger + Store Identity */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg text-textMuted hover:text-textPrimary hover:bg-white/[0.05] transition-colors"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="hidden sm:flex items-center gap-2 text-xs text-textMuted">
              <span className="font-semibold text-textPrimary tracking-wide">
                {storeName}
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-textMuted opacity-60" />
              <span className="text-textSecondary">Laundry Operations Portal</span>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Notifications Shortcut */}
            <button
              onClick={() => navigate(ROUTES.ADMIN.NOTIFICATIONS)}
              className="relative p-2 rounded-xl text-textSecondary hover:text-textPrimary hover:bg-white/[0.05] border border-transparent hover:border-white/[0.08] transition-colors"
              title="View Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.8)]" />
              )}
            </button>

            <div className="h-5 w-px bg-white/[0.08] hidden sm:block mx-1" />

            {/* User Identity */}
            <div className="hidden sm:flex flex-col items-end text-right">
              <span className="text-xs font-semibold text-textPrimary">
                {user?.name || 'Laundry Admin'}
              </span>
              <span className="text-[10px] text-textMuted">
                {user?.email || 'admin@laundryflow.com'}
              </span>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-textSecondary hover:text-statusDanger bg-white/[0.04] hover:bg-statusDanger/10 rounded-xl transition-all border border-white/[0.08] hover:border-statusDanger/30"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
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
