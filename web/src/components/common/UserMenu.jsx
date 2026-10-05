import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Settings, LogOut, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';
import { logoutApi } from '../../api/auth';
import { ROUTES } from '../../routes/routeConstants';

/**
 * UserMenu — avatar dropdown with profile, settings, and real logout.
 */
export const UserMenu = () => {
  const [open, setOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();
  const { user, clearAuth } = useAuthStore();

  const displayName = user?.name || 'Super Admin';
  const displayEmail = user?.email || '';
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

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
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="User menu"
        className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-textSecondary hover:text-textPrimary hover:bg-cardHover border border-transparent hover:border-borderSubtle transition-all duration-200 outline-none focus-visible:ring-1 focus-visible:ring-primaryPurple cursor-pointer"
      >
        {/* Avatar */}
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primaryPurple to-brandIndigo flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
          {initials}
        </div>
        <div className="hidden md:flex flex-col items-start leading-none">
          <span className="text-sm font-semibold text-textPrimary">{displayName}</span>
          <span className="text-[10px] text-textMuted mt-0.5">Super Admin</span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 hidden md:block transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -6 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-52 z-50 glass-dropdown overflow-hidden"
            role="menu"
          >
            {/* User info header */}
            <div className="px-3 py-3 border-b border-borderSubtle">
              <p className="text-sm font-semibold text-textPrimary">{displayName}</p>
              <p className="text-xs text-textMuted truncate">{displayEmail}</p>
            </div>

            {/* Menu items */}
            <div className="p-1">
              <button
                type="button"
                role="menuitem"
                onClick={() => setOpen(false)}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-textSecondary hover:text-textPrimary hover:bg-cardBg transition-all duration-150 outline-none focus-visible:ring-1 focus-visible:ring-primaryPurple cursor-pointer"
              >
                <User className="w-4 h-4 flex-shrink-0" />
                Profile
              </button>

              <button
                type="button"
                role="menuitem"
                onClick={() => setOpen(false)}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-textSecondary hover:text-textPrimary hover:bg-cardBg transition-all duration-150 outline-none focus-visible:ring-1 focus-visible:ring-primaryPurple cursor-pointer"
              >
                <Settings className="w-4 h-4 flex-shrink-0" />
                Settings
              </button>

              {/* Divider */}
              <div className="my-1 border-t border-borderSubtle" />

              <button
                type="button"
                role="menuitem"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-statusDanger hover:bg-statusDanger/10 transition-all duration-150 outline-none focus-visible:ring-1 focus-visible:ring-primaryPurple cursor-pointer disabled:opacity-60"
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
