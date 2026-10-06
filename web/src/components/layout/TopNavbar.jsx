import { Menu } from 'lucide-react';
import { useUIStore } from '../../store/uiStore';
import { IconButton } from '../ui/IconButton';
import { SearchBar } from '../common/SearchBar';
import { MessagesMenu } from '../common/MessagesMenu';
import { NotificationMenu } from '../common/NotificationMenu';
import { UserMenu } from '../common/UserMenu';

/**
 * TopNavbar — sticky, glassmorphic top navigation bar.
 */
export const TopNavbar = () => {
  const { sidebarCollapsed, setMobileSidebarOpen } = useUIStore();

  return (
    <header
      className="fixed top-0 right-0 z-20 h-16 flex items-center px-4 sm:px-6 gap-3 transition-all duration-250"
      style={{
        left: 0,
        backgroundColor: 'rgba(7, 10, 23, 0.8)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      }}
    >
      {/* Desktop left offset spacer — tracks sidebar width */}
      <div
        className="hidden lg:block flex-shrink-0 transition-all duration-250"
        style={{ width: sidebarCollapsed ? 76 : 260 }}
      />

      {/* Hamburger — mobile only */}
      <IconButton
        onClick={() => setMobileSidebarOpen(true)}
        aria-label="Open navigation menu"
        className="lg:hidden"
      >
        <Menu className="w-5 h-5" />
      </IconButton>

      {/* Search bar */}
      <div className="flex-1 flex">
        <SearchBar />
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Messages & Helpdesk Inquiries */}
        <MessagesMenu />

        {/* Notifications */}
        <NotificationMenu />

        {/* Divider */}
        <div className="w-px h-6 bg-borderSubtle mx-1 hidden sm:block" />

        {/* User menu */}
        <UserMenu />
      </div>
    </header>
  );
};

export default TopNavbar;
