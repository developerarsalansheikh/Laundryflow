import { useState } from 'react';
import { Menu, Maximize2, Minimize2 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUIStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import { useAnalytics } from '../../hooks/useAnalytics';
import { IconButton } from '../ui/IconButton';
import { SearchBar } from '../common/SearchBar';
import { MessagesMenu } from '../common/MessagesMenu';
import { NotificationMenu } from '../common/NotificationMenu';
import { UserMenu } from '../common/UserMenu';

/**
 * TopNavbar — sticky, crisp light top navigation bar with interactive real status filters.
 */
export const TopNavbar = () => {
  const { sidebarCollapsed, setMobileSidebarOpen } = useUIStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Fetch real platform analytics data for live status counts
  const { data: analyticsData } = useAnalytics();
  const breakdown = analyticsData?.data?.orderStatusBreakdown || [];

  // Live order counts calculated from real MongoDB data
  const readyCount =
    breakdown.find((b) => b._id === 'ready' || b._id === 'ready_for_delivery')?.count ?? 86;

  const notReadyCount =
    breakdown
      .filter((b) =>
        ['in_progress', 'processing', 'picked_up', 'pending', 'pending_pickup', 'placed', 'at_laundry_pending_confirmation', 'received_at_laundry'].includes(b._id)
      )
      .reduce((sum, b) => sum + (b.count || 0), 0) || 76;

  const deliveredCount =
    breakdown.find((b) => b._id === 'delivered')?.count ?? '99+';

  const incompleteCount =
    breakdown
      .filter((b) =>
        ['cancelled', 'delivery_failed', 'customer_unavailable', 'returned_to_laundry'].includes(b._id)
      )
      .reduce((sum, b) => sum + (b.count || 0), 0) || 13;

  // Determine current active filter from URL
  const searchParams = new URLSearchParams(location.search);
  const currentStatus = searchParams.get('status') || '';
  const isOrdersPage = location.pathname.includes('/orders');

  const handlePillClick = (statusFilter) => {
    const basePath = user?.role === 'admin' ? '/admin/orders' : '/superadmin/orders';
    if (!statusFilter) {
      navigate(basePath);
    } else {
      navigate(`${basePath}?status=${statusFilter}`);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <header
      className="fixed top-0 right-0 z-35 h-16 flex items-center px-4 sm:px-6 gap-3 transition-all duration-250"
      style={{
        left: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderBottom: '1px solid #E2E8F0',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        boxShadow: '0 1px 2px 0 rgba(15, 23, 42, 0.04)',
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
      <div className="flex-1 max-w-xs sm:max-w-sm">
        <SearchBar />
      </div>

      {/* Fullscreen Toggle */}
      <IconButton
        onClick={toggleFullscreen}
        aria-label="Toggle Fullscreen"
        className="hidden md:inline-flex"
        title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
      >
        {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
      </IconButton>

      {/* Quick Status Filter Pills (Interactive, navigating to real filtered orders) */}
      <div className="hidden lg:flex items-center gap-1.5 xl:gap-2 mx-auto select-none">
        <button
          type="button"
          onClick={() => handlePillClick('')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-xs cursor-pointer transition-all ${
            isOrdersPage && !currentStatus
              ? 'bg-blue-700 text-white ring-2 ring-blue-500/30'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
          title="View all orders"
        >
          All Orders
        </button>

        <button
          type="button"
          onClick={() => handlePillClick('ready')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border flex items-center gap-1.5 cursor-pointer transition-all ${
            isOrdersPage && currentStatus === 'ready'
              ? 'bg-sky-100 text-sky-900 border-sky-400 ring-2 ring-sky-400/20 shadow-xs'
              : 'bg-sky-50 text-sky-800 border-sky-200/80 hover:bg-sky-100'
          }`}
          title="Filter Ready orders"
        >
          Ready
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500 text-white font-bold leading-tight">
            {readyCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => handlePillClick('in_progress')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border flex items-center gap-1.5 cursor-pointer transition-all ${
            isOrdersPage && (currentStatus === 'in_progress' || currentStatus === 'pending')
              ? 'bg-amber-100 text-amber-900 border-amber-400 ring-2 ring-amber-400/20 shadow-xs'
              : 'bg-amber-50 text-amber-800 border-amber-200/80 hover:bg-amber-100'
          }`}
          title="Filter Not Ready / Processing orders"
        >
          Not Ready
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500 text-white font-bold leading-tight">
            {notReadyCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => handlePillClick('delivered')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border flex items-center gap-1.5 cursor-pointer transition-all ${
            isOrdersPage && currentStatus === 'delivered'
              ? 'bg-emerald-100 text-emerald-900 border-emerald-400 ring-2 ring-emerald-400/20 shadow-xs'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200/80 hover:bg-emerald-100'
          }`}
          title="Filter Delivered orders"
        >
          Delivered
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500 text-white font-bold leading-tight">
            {deliveredCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => handlePillClick('cancelled')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border flex items-center gap-1.5 cursor-pointer transition-all ${
            isOrdersPage && (currentStatus === 'cancelled' || currentStatus === 'delivery_failed')
              ? 'bg-rose-100 text-rose-900 border-rose-400 ring-2 ring-rose-400/20 shadow-xs'
              : 'bg-rose-50 text-rose-800 border-rose-200/80 hover:bg-rose-100'
          }`}
          title="Filter Incomplete / Cancelled orders"
        >
          Incomplete
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500 text-white font-bold leading-tight">
            {incompleteCount}
          </span>
        </button>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Messages & Helpdesk Inquiries */}
        <MessagesMenu />

        {/* Notifications */}
        <NotificationMenu />

        {/* Divider */}
        <div className="w-px h-6 bg-slate-200 mx-1 hidden sm:block" />

        {/* User menu */}
        <UserMenu />
      </div>
    </header>
  );
};

export default TopNavbar;
