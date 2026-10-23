import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Settings, LogOut, ChevronDown, ChevronRight, Globe, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';
import { logoutApi } from '../../api/auth';
import { ROUTES, PUBLIC_WEBSITE_URL } from '../../routes/routeConstants';

/**
 * UserMenu — avatar dropdown with real Profile, Settings, and Logout navigation.
 */
export const UserMenu = () => {
  const [open, setOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();
  const { user, clearAuth } = useAuthStore();

  const isStoreAdmin = user?.role === 'admin';
  const roleLabel = isStoreAdmin ? 'Store Admin' : 'Super Admin';

  const displayName =
    user?.name ||
    user?.fullName ||
    (user?.email ? user.email.split('@')[0] : '') ||
    (isStoreAdmin ? 'Laundry Admin' : 'Super Admin');

  const displayEmail = user?.email || (isStoreAdmin ? 'admin@laundrywave.com' : 'superadmin@laundrywave.com');
  const initials = (displayName || 'AD')
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'AD';

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const handleProfileClick = () => {
    setOpen(false);
    if (user?.role === 'admin') {
      navigate(ROUTES.ADMIN.PROFILE);
    } else {
      navigate(`${ROUTES.SUPERADMIN.SETTINGS}?tab=profile`);
    }
  };

  const handleSettingsClick = () => {
    setOpen(false);
    if (user?.role === 'admin') {
      navigate(ROUTES.ADMIN.PROFILE);
    } else {
      navigate(ROUTES.SUPERADMIN.SETTINGS);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logoutApi(); // Clears server-side refreshToken cookie
    } catch {
      // Best-effort — clear frontend state regardless
    } finally {
      clearAuth();
      setOpen(false);
      toast.success('Logged out successfully');
      navigate(ROUTES.AUTH.LOGIN, { replace: true });
      setIsLoggingOut(false);
    }
  };

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button
        type="button"
        id="navbar-user-profile-btn"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="User profile and settings"
        className={`flex items-center gap-2 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-xl transition-all duration-200 outline-none cursor-pointer flex-shrink-0 ${
          open
            ? 'bg-slate-100 ring-2 ring-blue-500/20 text-slate-900 border border-slate-200'
            : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100/70 border border-transparent hover:border-slate-200'
        }`}
      >
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shadow-xs flex-shrink-0">
            {initials}
          </div>
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
        </div>
        <div className="flex flex-col items-start leading-tight text-left min-w-0">
          <span className="text-xs font-bold text-slate-900 truncate max-w-[110px] sm:max-w-[150px]">
            {displayName}
          </span>
          <span className="text-[10px] text-slate-500 font-medium">
            {roleLabel}
          </span>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 flex-shrink-0 block transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -6 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-60 z-50 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden"
            role="menu"
          >
            {/* User info header — clickable to view Profile */}
            <div
              onClick={handleProfileClick}
              className="px-3.5 py-3 border-b border-slate-100 bg-slate-50/60 cursor-pointer hover:bg-slate-100/70 transition-colors group"
              title="Click to view full Profile"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{displayName}</p>
                <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200/60">View Profile</span>
              </div>
              <p className="text-[11px] text-slate-500 truncate mt-0.5">{displayEmail}</p>
            </div>

            {/* Menu items */}
            <div className="p-1.5 space-y-0.5">
              <button
                type="button"
                role="menuitem"
                onClick={handleProfileClick}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors outline-none cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <User className="w-4 h-4 text-slate-500 flex-shrink-0" />
                  <span>Profile</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                type="button"
                role="menuitem"
                onClick={handleSettingsClick}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors outline-none cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Settings className="w-4 h-4 text-slate-500 flex-shrink-0" />
                  <span>Settings</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <a
                href={PUBLIC_WEBSITE_URL}
                target="_blank"
                rel="noopener noreferrer"
                role="menuitem"
                onClick={() => setOpen(false)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-blue-700 hover:bg-blue-50 transition-colors outline-none cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Globe className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <span>Visit LaundryWave Website</span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-blue-500" />
              </a>

              {/* Divider */}
              <div className="my-1 border-t border-slate-100" />

              <button
                type="button"
                role="menuitem"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors outline-none cursor-pointer disabled:opacity-60"
              >
                <LogOut className="w-4 h-4 flex-shrink-0" />
                {isLoggingOut ? 'Logging out...' : 'Logout'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserMenu;
