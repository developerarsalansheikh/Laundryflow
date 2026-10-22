import { useState, useEffect } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { Menu, X, ArrowRight, ShieldCheck, LayoutDashboard } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { ROUTES } from '../../routes/routeConstants';

const NAV_LINKS = [
  { name: 'Home', path: ROUTES.PUBLIC.HOME },
  { name: 'About', path: ROUTES.PUBLIC.ABOUT },
  { name: 'How It Works', path: ROUTES.PUBLIC.HOW_IT_WORKS },
  { name: 'Features', path: ROUTES.PUBLIC.FEATURES },
  { name: 'Download', path: ROUTES.PUBLIC.DOWNLOAD },
];

export const PublicNavbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { isAuthenticated, role } = useAuthStore();

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const normalizedRole = String(role || '').trim().toLowerCase();
  const isSuperAdmin = normalizedRole === 'superadmin';
  const dashboardPath = isSuperAdmin
    ? ROUTES.SUPERADMIN.DASHBOARD
    : ROUTES.ADMIN.DASHBOARD;
  const dashboardLabel = isSuperAdmin ? 'Super Admin' : 'Store Admin';

  return (
    <header className="sticky top-0 z-50 bg-[#FAF8F5]/95 backdrop-blur-md border-b border-stone-200/80 transition-all font-erode">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 sm:h-22 py-2">
          {/* Brand Logo & Wordmark */}
          <Link
            to={ROUTES.PUBLIC.HOME}
            className="flex items-center gap-3.5 group focus-visible:outline-none"
          >
            <img
              src="/logo.svg"
              onError={(e) => { e.currentTarget.src = '/logo.png'; }}
              alt="LaundryWave Logo"
              className="w-11 h-11 object-contain rounded-2xl shadow-2xs group-hover:scale-105 transition-transform"
            />
            <div className="flex flex-col">
              <span className="font-oswald text-xl sm:text-2xl font-bold tracking-wider text-stone-900 uppercase leading-none group-hover:text-stone-700 transition-colors">
                LaundryWave
              </span>
              <span className="text-[10px] sm:text-[11px] font-erode text-stone-500 tracking-wider mt-0.5">
                Garment Care Platform
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav
            aria-label="Public Navigation"
            className="hidden md:flex items-center gap-8"
          >
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                end={link.path === ROUTES.PUBLIC.HOME}
                className={({ isActive }) =>
                  `text-xs uppercase font-oswald tracking-widest transition-all relative py-1 focus-visible:outline-none ${
                    isActive
                      ? 'text-stone-900 font-bold after:content-[""] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-stone-900'
                      : 'text-stone-500 hover:text-stone-900 font-medium'
                  }`
                }
              >
                {link.name}
              </NavLink>
            ))}
          </nav>

          {/* CTA Action */}
          <div className="hidden md:flex items-center gap-4">
            {isAuthenticated ? (
              <Link
                to={dashboardPath}
                className="inline-flex items-center gap-2 px-5 py-2 text-xs font-oswald uppercase tracking-widest text-white bg-stone-900 hover:bg-stone-800 rounded-full transition-all shadow-xs"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>{dashboardLabel}</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            ) : (
              <Link
                to={ROUTES.AUTH.LOGIN}
                className="inline-flex items-center gap-2 px-5 py-2 text-xs font-oswald uppercase tracking-widest text-stone-800 hover:text-stone-950 bg-white hover:bg-stone-100 border border-stone-300/80 rounded-full transition-all shadow-2xs"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-stone-600" />
                <span>Admin Login</span>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((open) => !open)}
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle navigation menu"
            className="md:hidden p-2 rounded-xl text-stone-700 hover:text-stone-950 hover:bg-stone-200/60 transition-colors"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-stone-200 bg-[#FAF8F5] px-6 pt-4 pb-8 space-y-4 shadow-xl">
          <nav aria-label="Mobile Navigation" className="flex flex-col space-y-3">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                end={link.path === ROUTES.PUBLIC.HOME}
                className={({ isActive }) =>
                  `text-sm font-oswald uppercase tracking-wider py-1.5 transition-colors ${
                    isActive
                      ? 'text-stone-900 font-bold'
                      : 'text-stone-500 hover:text-stone-900'
                  }`
                }
              >
                {link.name}
              </NavLink>
            ))}
          </nav>
          <div className="pt-4 border-t border-stone-200">
            {isAuthenticated ? (
              <Link
                to={dashboardPath}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 text-xs font-oswald uppercase tracking-widest text-white bg-stone-900 hover:bg-stone-800 rounded-full"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Open {dashboardLabel}</span>
              </Link>
            ) : (
              <Link
                to={ROUTES.AUTH.LOGIN}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 text-xs font-oswald uppercase tracking-widest text-stone-800 bg-white border border-stone-300 rounded-full"
              >
                <ShieldCheck className="w-4 h-4 text-stone-600" />
                <span>Admin Operations Portal</span>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default PublicNavbar;
