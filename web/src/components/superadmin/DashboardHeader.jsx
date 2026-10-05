import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Download, Calendar } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { getTimeBasedGreeting } from '../../utils/formatters';
import { AddLaundryModal } from './AddLaundryModal';

/**
 * DashboardHeader Component.
 * Left: Time-aware greeting with the authenticated user's real first name.
 * Right: Export and + Add Laundry primary actions.
 */
export const DashboardHeader = () => {
  const { user } = useAuthStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Compute dynamic greeting from current local hour
  const greeting = getTimeBasedGreeting();

  // Extract real first name — never hardcode
  const firstName = user?.name ? user.name.split(' ')[0] : 'Super Admin';

  // Today's date formatted
  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
        className="flex flex-col md:flex-row md:items-start justify-between gap-5"
      >
        {/* Left: Greeting */}
        <div>
          {/* Status badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.3 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-[11px] font-semibold mb-3 tracking-wide"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
            <span>Super Admin Workspace · System Live</span>
          </motion.div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
            <span
              className="text-transparent bg-clip-text"
              style={{
                backgroundImage: 'linear-gradient(90deg, #F8FAFC 0%, #C4B5FD 50%, #93C5FD 100%)',
              }}
            >
              {greeting}, {firstName}
            </span>
            {' '}
            <span className="inline-block animate-bounce origin-bottom-right" aria-hidden="true">
              👋
            </span>
          </h1>

          <div className="flex items-center gap-2 mt-2">
            <Calendar className="w-3.5 h-3.5 text-textMuted flex-shrink-0" aria-hidden="true" />
            <p className="text-sm text-textSecondary">
              {today} — here&apos;s what&apos;s happening across your platform.
            </p>
          </div>
        </div>

        {/* Right: Action Buttons */}
        <div className="flex items-center gap-2.5 flex-shrink-0 flex-wrap">
          <button
            type="button"
            aria-label="Export platform report"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/8 border border-white/10 hover:border-white/20 text-textSecondary text-xs font-semibold transition-all duration-200 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Export Report</span>
          </button>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            aria-label="Add new laundry to platform"
            className="btn-primary flex items-center gap-2 py-2.5 px-5 rounded-xl text-xs font-bold shadow-glowPurple hover:scale-[1.02] active:scale-[0.98] transition-all duration-150 cursor-pointer"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            <span>Add Laundry</span>
          </button>
        </div>
      </motion.div>

      {/* Add Laundry Modal */}
      <AddLaundryModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};

export default DashboardHeader;
