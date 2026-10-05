import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Server, ShieldCheck, Activity } from 'lucide-react';
import { useUIStore } from '../../store/uiStore';

/**
 * SidebarFooter — LaundryFlow Platform Status & Info card + collapse toggle.
 */
export const SidebarFooter = () => {
  const { sidebarCollapsed, toggleSidebar } = useUIStore();

  return (
    <div className="flex-shrink-0 border-t border-borderSubtle p-3 space-y-3">
      {/* Project Information Card */}
      <AnimatePresence initial={false}>
        {!sidebarCollapsed ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div
              className="rounded-2xl p-3.5 relative overflow-hidden group transition-all duration-300"
              style={{
                background: 'linear-gradient(135deg, rgba(15,23,42,0.8) 0%, rgba(30,27,75,0.6) 100%)',
                border: '1px solid rgba(139,92,246,0.2)',
                boxShadow: '0 4px 20px -2px rgba(0,0,0,0.3)',
              }}
            >
              {/* Background ambient glow */}
              <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full bg-emerald-500/10 blur-lg pointer-events-none" />

              {/* Status Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-textPrimary leading-tight">
                      LaundryFlow Engine
                    </h4>
                    <p className="text-[10px] text-textMuted font-mono">v2.4.0 · Production</p>
                  </div>
                </div>
                {/* Live Indicator */}
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider">Live</span>
                </div>
              </div>

              {/* Node API Info */}
              <div className="pt-2 border-t border-white/6 flex items-center justify-between text-[11px] text-textMuted">
                <span className="flex items-center gap-1">
                  <Server className="w-3 h-3 text-purpleLight" />
                  Node.js API
                </span>
                <span className="text-emerald-400 font-semibold text-[10px]">Connected</span>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="flex justify-center py-1">
            <div
              className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center relative"
              title="LaundryFlow Engine: Connected (Live)"
            >
              <Activity className="w-4 h-4 text-emerald-400" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-[#0B0F17] animate-pulse" />
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Collapse Toggle Button */}
      <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-end px-1'}`}>
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="hidden lg:flex items-center justify-center w-8 h-8 rounded-lg text-textMuted hover:text-textPrimary hover:bg-cardHover transition-all duration-200 outline-none focus-visible:ring-1 focus-visible:ring-primaryPurple cursor-pointer"
        >
          <motion.div
            animate={{ rotate: sidebarCollapsed ? 0 : 180 }}
            transition={{ duration: 0.25 }}
          >
            <ChevronRight className="w-4 h-4" />
          </motion.div>
        </button>
      </div>
    </div>
  );
};

export default SidebarFooter;
