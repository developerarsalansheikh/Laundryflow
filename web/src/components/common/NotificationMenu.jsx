import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { IconButton } from '../ui/IconButton';

/**
 * UI-placeholder notification entries.
 * These are sample UI data only — no API integration in Phase 4.
 */
const SAMPLE_NOTIFICATIONS = [
  {
    id: 1,
    type: 'success',
    title: 'New laundry registered',
    message: 'Sparkle Clean joined the platform.',
    time: '2 min ago',
  },
  {
    id: 2,
    type: 'warning',
    title: 'Subscription expiring',
    message: '3 laundries expire in 7 days.',
    time: '1 hr ago',
  },
  {
    id: 3,
    type: 'info',
    title: 'System update',
    message: 'Backend v2.1.0 deployed successfully.',
    time: '3 hr ago',
  },
];

const TYPE_STYLES = {
  success: { Icon: CheckCircle2, color: 'text-statusSuccess', bg: 'bg-statusSuccess/10' },
  warning: { Icon: AlertCircle, color: 'text-statusWarning', bg: 'bg-statusWarning/10' },
  info: { Icon: Info, color: 'text-statusInfo', bg: 'bg-statusInfo/10' },
};

/**
 * NotificationMenu — bell icon with badge and dropdown.
 */
export const NotificationMenu = () => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const BADGE_COUNT = SAMPLE_NOTIFICATIONS.length;

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <IconButton
        onClick={() => setOpen((o) => !o)}
        badge={BADGE_COUNT}
        aria-label={`Notifications (${BADGE_COUNT} unread)`}
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
            className="absolute right-0 top-full mt-2 w-80 z-50 glass-dropdown overflow-hidden"
            role="dialog"
            aria-label="Notifications"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-borderSubtle">
              <h3 className="text-sm font-semibold text-textPrimary">Notifications</h3>
              <span className="badge-info">{BADGE_COUNT} new</span>
            </div>

            {/* Notification list */}
            <div className="divide-y divide-borderSubtle max-h-72 overflow-y-auto">
              {SAMPLE_NOTIFICATIONS.map((n) => {
                const { Icon, color, bg } = TYPE_STYLES[n.type] || TYPE_STYLES.info;
                return (
                  <div
                    key={n.id}
                    className="flex items-start gap-3 px-4 py-3 hover:bg-cardBg transition-colors duration-150 cursor-pointer"
                  >
                    <div className={`flex-shrink-0 w-8 h-8 rounded-xl ${bg} flex items-center justify-center mt-0.5`}>
                      <Icon className={`w-4 h-4 ${color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-textPrimary truncate">{n.title}</p>
                      <p className="text-xs text-textSecondary mt-0.5 leading-relaxed">{n.message}</p>
                      <p className="text-[10px] text-textMuted mt-1">{n.time}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-borderSubtle">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="w-full text-center text-xs font-medium text-primaryPurple hover:text-purpleLight transition-colors duration-150 cursor-pointer"
              >
                View all notifications
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationMenu;
