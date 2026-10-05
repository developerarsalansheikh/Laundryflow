import { motion } from 'framer-motion';
import { Zap, Activity, Wifi } from 'lucide-react';
import { formatRelativeTime } from '../../utils/formatters';

// ── Animation variants ────────────────────────────────────────────────────────
const listVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

const itemVariants = {
  hidden: { opacity: 0, x: -8 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] } },
};

/**
 * LiveActivity Component.
 * Displays real platform audit/activity events if provided by backend.
 * Backend does NOT currently expose an activity/audit events endpoint.
 * Shows graceful empty state, ready for Socket.IO integration.
 *
 * Socket.IO Integration Point:
 * When backend provides real-time events, pass them via `activities` prop.
 * Example socket setup (do NOT implement here — backend integration pending):
 *   socket.on('platform:activity', (event) => setActivities(prev => [event, ...prev].slice(0, 20)));
 */
export const LiveActivity = ({ activities = [] }) => {
  const hasActivities = Array.isArray(activities) && activities.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="glass-card p-5 flex flex-col h-full"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4 border-b border-white/8 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-500/15 flex items-center justify-center" aria-hidden="true">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <h2 className="text-sm font-bold text-textPrimary">Live Activity</h2>
        </div>
        {/* Live indicator */}
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" aria-hidden="true" />
          <span className="text-[10px] text-textMuted font-medium">Live</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-center">
        {hasActivities ? (
          <div className="relative">
            {/* Timeline line */}
            <div
              className="absolute left-3 top-2 bottom-2 w-px pointer-events-none"
              style={{ background: 'rgba(255,255,255,0.07)' }}
              aria-hidden="true"
            />
            <motion.div
              variants={listVariants}
              initial="hidden"
              animate="visible"
              className="space-y-3"
            >
              {activities.slice(0, 6).map((act, idx) => (
                <motion.div
                  key={act._id || idx}
                  variants={itemVariants}
                  className="flex items-start gap-3 relative z-10"
                >
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(139,92,246,0.2)', border: '1px solid rgba(139,92,246,0.3)' }}
                    aria-hidden="true"
                  >
                    <Activity className="w-3.5 h-3.5 text-purple-400" />
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <p className="text-[11px] font-semibold text-textPrimary truncate leading-tight">
                      {act.title || act.action || 'Platform Event'}
                    </p>
                    {act.description && (
                      <p className="text-[10px] text-textMuted truncate mt-0.5">{act.description}</p>
                    )}
                    <span className="text-[9px] text-textMuted font-mono">
                      {formatRelativeTime(act.createdAt)}
                    </span>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        ) : (
          /* Graceful empty state — backend integration pending */
          <div className="py-6 text-center space-y-3 flex flex-col items-center">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}
              aria-hidden="true"
            >
              <Wifi className="w-7 h-7 text-amber-400" />
            </div>
            <div>
              <p className="text-xs font-semibold text-textPrimary">No Recent Activity</p>
              <p className="text-[11px] text-textMuted mt-1.5 leading-relaxed max-w-[180px]">
                Live platform activity will appear here in real-time via Socket.IO.
              </p>
            </div>
            {/* Visual socket.io ready indicator */}
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] text-textMuted"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400/50" aria-hidden="true" />
              <span>Socket.IO integration ready</span>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default LiveActivity;
