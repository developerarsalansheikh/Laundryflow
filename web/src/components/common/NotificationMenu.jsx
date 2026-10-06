import { useEffect, useRef, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, ShoppingBag, CreditCard, Truck, Info, CheckCheck } from 'lucide-react';
import { IconButton } from '../ui/IconButton';
import {
  useNotifications,
  useUnreadNotificationCount,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
} from '../../hooks/useNotifications';

const TYPE_CONFIG = {
  order: { Icon: ShoppingBag, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
  payment: { Icon: CreditCard, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  delivery: { Icon: Truck, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  system: { Icon: Info, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  promo: { Icon: Info, color: 'text-rose-400', bg: 'bg-rose-500/10' },
};

const formatTimeAgo = (dateStr) => {
  if (!dateStr) return 'Just now';
  const diffSec = Math.floor((new Date() - new Date(dateStr)) / 1000);
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  return `${diffDays}d ago`;
};

/**
 * NotificationMenu — bell icon connected to real MongoDB notifications.
 */
export const NotificationMenu = () => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const { data: notificationsData, isLoading } = useNotifications({ limit: 15 });
  const { data: unreadData } = useUnreadNotificationCount();
  const { mutate: markAsRead } = useMarkNotificationAsRead();
  const { mutate: markAllAsRead, isPending: markingAll } = useMarkAllNotificationsAsRead();

  const notifications = useMemo(() => notificationsData?.data || [], [notificationsData]);
  const unreadCount = unreadData?.data?.unreadCount ?? notifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      markAsRead(notification._id);
    }
  };

  return (
    <div ref={ref} className="relative">
      <IconButton
        onClick={() => setOpen((o) => !o)}
        badge={unreadCount > 0 ? unreadCount : undefined}
        aria-label={`Notifications (${unreadCount} unread)`}
        active={open}
      >
        <Bell className="w-[18px] h-[18px]" />
      </IconButton>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -6 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-80 sm:w-96 z-50 glass-dropdown overflow-hidden"
            role="dialog"
            aria-label="Notifications"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-borderSubtle bg-cardBg/60">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-textPrimary">Notifications</h3>
                {unreadCount > 0 ? (
                  <span className="badge-info text-[10px] px-1.5 py-0.5">{unreadCount} new</span>
                ) : (
                  <span className="text-[10px] text-textMuted font-medium">All caught up</span>
                )}
              </div>

              {unreadCount > 0 && (
                <button
                  type="button"
                  disabled={markingAll}
                  onClick={() => markAllAsRead()}
                  className="flex items-center gap-1 text-[11px] font-medium text-emerald-400 hover:text-emerald-300 transition-colors disabled:opacity-50"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Mark all read
                </button>
              )}
            </div>

            {/* Notification list */}
            <div className="divide-y divide-borderSubtle max-h-80 overflow-y-auto">
              {isLoading ? (
                <div className="p-8 text-center text-xs text-textMuted flex flex-col items-center gap-2">
                  <div className="w-5 h-5 rounded-full border-2 border-primaryPurple/30 border-t-primaryPurple animate-spin" />
                  Loading notifications...
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center text-xs text-textMuted flex flex-col items-center gap-2">
                  <Bell className="w-8 h-8 text-textMuted/40 mb-1" />
                  <p className="font-medium text-textPrimary">No notifications yet</p>
                  <p className="text-[11px]">Real platform events and updates will show up here.</p>
                </div>
              ) : (
                notifications.map((n) => {
                  const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.system;
                  const Icon = cfg.Icon;
                  return (
                    <div
                      key={n._id}
                      onClick={() => handleNotificationClick(n)}
                      className={`flex items-start gap-3 px-4 py-3 transition-colors duration-150 cursor-pointer ${
                        n.isRead ? 'hover:bg-white/[0.02] opacity-80' : 'bg-primaryPurple/5 hover:bg-primaryPurple/10'
                      }`}
                    >
                      <div className={`flex-shrink-0 w-8 h-8 rounded-xl ${cfg.bg} flex items-center justify-center mt-0.5`}>
                        <Icon className={`w-4 h-4 ${cfg.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p className={`text-xs font-semibold truncate ${n.isRead ? 'text-textPrimary' : 'text-purple-300'}`}>
                            {n.title}
                          </p>
                          <span className="text-[10px] text-textMuted whitespace-nowrap">
                            {formatTimeAgo(n.createdAt)}
                          </span>
                        </div>
                        <p className="text-xs text-textSecondary mt-0.5 leading-relaxed line-clamp-2">
                          {n.message}
                        </p>
                      </div>
                      {!n.isRead && (
                        <div className="w-1.5 h-1.5 rounded-full bg-primaryPurple flex-shrink-0 mt-2" />
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2.5 border-t border-borderSubtle bg-cardBg/40 flex items-center justify-between">
              <span className="text-[10px] text-textMuted">Live platform alerts</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-xs font-medium text-primaryPurple hover:text-purpleLight transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationMenu;
