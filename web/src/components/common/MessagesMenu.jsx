import { useEffect, useRef, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, HelpCircle, Store, User, ArrowUpRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { IconButton } from '../ui/IconButton';
import { useSupportTickets } from '../../hooks/useSupport';

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

const PRIORITY_BADGES = {
  urgent: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  high: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  medium: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  low: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
};

/**
 * MessagesMenu — Navbar messaging dropdown connected to real DB SupportTickets.
 */
export const MessagesMenu = () => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  // Load real incoming support messages from DB
  const { data: ticketsData, isLoading } = useSupportTickets({ limit: 10 });
  const tickets = useMemo(() => ticketsData?.data || [], [ticketsData]);
  const openCount = useMemo(() => tickets.filter((t) => t.status === 'open').length, [tickets]);

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

  const handleTicketClick = () => {
    setOpen(false);
    navigate('/superadmin/support');
  };

  return (
    <div ref={ref} className="relative">
      <IconButton
        onClick={() => setOpen((o) => !o)}
        badge={openCount > 0 ? openCount : undefined}
        aria-label={`Inquiries & Messages (${openCount} open)`}
        active={open}
      >
        <MessageCircle className="w-[18px] h-[18px]" />
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
            aria-label="Messages & Support Inquiries"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-borderSubtle bg-cardBg/60">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-textPrimary">Helpdesk & Inquiries</h3>
                {openCount > 0 ? (
                  <span className="badge-warning text-[10px] px-1.5 py-0.5">{openCount} open</span>
                ) : (
                  <span className="text-[10px] text-textMuted font-medium">All answered</span>
                )}
              </div>

              <button
                type="button"
                onClick={handleTicketClick}
                className="text-xs font-semibold text-primaryPurple hover:text-purpleLight flex items-center gap-1 transition-colors"
              >
                View all
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Messages / Tickets list */}
            <div className="divide-y divide-borderSubtle max-h-80 overflow-y-auto">
              {isLoading ? (
                <div className="p-8 text-center text-xs text-textMuted flex flex-col items-center gap-2">
                  <div className="w-5 h-5 rounded-full border-2 border-primaryPurple/30 border-t-primaryPurple animate-spin" />
                  Loading messages...
                </div>
              ) : tickets.length === 0 ? (
                <div className="p-8 text-center text-xs text-textMuted flex flex-col items-center gap-2">
                  <HelpCircle className="w-8 h-8 text-textMuted/40 mb-1" />
                  <p className="font-medium text-textPrimary">No active messages</p>
                  <p className="text-[11px]">Helpdesk tickets and inquiries from laundries will appear here.</p>
                </div>
              ) : (
                tickets.map((t) => {
                  const isStore = Boolean(t.laundryId);
                  const senderName = t.laundryId?.name || t.user?.name || 'User';
                  const priorityClass = PRIORITY_BADGES[t.priority] || PRIORITY_BADGES.medium;

                  return (
                    <div
                      key={t._id}
                      onClick={handleTicketClick}
                      className="flex items-start gap-3 px-4 py-3 hover:bg-white/[0.03] transition-colors duration-150 cursor-pointer"
                    >
                      <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mt-0.5 border border-purple-500/20">
                        {isStore ? <Store className="w-4 h-4" /> : <User className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-xs font-semibold text-textPrimary truncate">
                            {t.subject}
                          </p>
                          <span className="text-[10px] text-textMuted whitespace-nowrap">
                            {formatTimeAgo(t.createdAt)}
                          </span>
                        </div>
                        <p className="text-xs text-textSecondary mt-0.5 leading-relaxed line-clamp-2">
                          {t.description}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-[10px] text-textMuted truncate max-w-[140px]">
                            {senderName}
                          </span>
                          <span className={`text-[9px] font-semibold uppercase px-1.5 py-0.2 rounded border ${priorityClass}`}>
                            {t.priority}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2.5 border-t border-borderSubtle bg-cardBg/40 flex items-center justify-between">
              <span className="text-[10px] text-textMuted">Support & Communication</span>
              <button
                type="button"
                onClick={handleTicketClick}
                className="text-xs font-medium text-primaryPurple hover:text-purpleLight transition-colors"
              >
                Go to Helpdesk
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MessagesMenu;
