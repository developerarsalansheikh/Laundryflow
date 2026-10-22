import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { PublicNavbar } from '../components/public/PublicNavbar';
import { PublicFooter } from '../components/public/PublicFooter';

export const PublicLayout = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-blue-600 selection:text-white antialiased">
      {/* Skip to Main Content Link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 px-4 py-2 bg-blue-600 text-white rounded-md font-medium shadow-md outline-none"
      >
        Skip to main content
      </a>

      {/* Public Header */}
      <PublicNavbar />

      {/* Main Content Area */}
      <main id="main-content" className="flex-1 flex flex-col">
        <Outlet />
      </main>

      {/* Public Footer */}
      <PublicFooter />
    </div>
  );
};

export default PublicLayout;
