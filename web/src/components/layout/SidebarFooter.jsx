import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ShieldCheck, Activity } from 'lucide-react';
import { useUIStore } from '../../store/uiStore';

/**
 * SidebarFooter — LaundryFlow Platform Status & Info card + collapse toggle.
 */
export const SidebarFooter = () => {
  const { sidebarCollapsed, toggleSidebar } = useUIStore();

  return (
    <div className="flex-shrink-0 border-t border-white/[0.08] p-3 space-y-2.5">
      {/* Store / Platform Information Card */}
      <AnimatePresence initial={false}>
        {!sidebarCollapsed ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="rounded-xl p-3 bg-[#0B1226] border border-white/10 shadow-xs relative overflow-hidden">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs font-bold text-white truncate leading-tight">
                        Poonaclub
                      </h4>
                      <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        Parent
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">PerClean Laundry</p>
                  </div>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                </div>
              </div>

              <div className="mt-2 pt-2 border-t border-white/[0.06] flex items-center justify-between text-[10px] text-slate-400">
                <span>1 store available</span>
                <span className="text-emerald-400 font-medium flex items-center gap-1">
                  Connected
                </span>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="flex justify-center py-1">
            <div
              className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center relative"
              title="Store Connected (Live)"
            >
              <Activity className="w-4 h-4 text-blue-400" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-[#0B1120] animate-pulse" />
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
          className="hidden lg:flex items-center justify-center w-7 h-7 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-all duration-200 outline-none cursor-pointer"
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
