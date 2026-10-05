import { motion } from 'framer-motion';
import { Waves } from 'lucide-react';
import { AppBackground } from './AppBackground';

/**
 * AuthLoadingScreen — shown during session initialization/restoration.
 * Prevents flash of login page when user has a valid persisted session.
 * Uses LaundryFlow design system.
 */
export const AuthLoadingScreen = () => {
  return (
    <AppBackground>
      <div className="flex flex-col items-center justify-center min-h-screen gap-6">
        {/* Animated logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center gap-4"
        >
          {/* Logo mark */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primaryPurple to-brandIndigo flex items-center justify-center shadow-glowPurple">
            <Waves className="w-8 h-8 text-white" strokeWidth={2.5} />
          </div>

          {/* Brand name */}
          <div className="text-center">
            <p className="text-xl font-bold text-textPrimary tracking-tight">LaundryFlow</p>
            <p className="text-xs text-textMuted mt-1 uppercase tracking-widest font-semibold text-primaryPurple">
              Super Admin
            </p>
          </div>
        </motion.div>

        {/* Spinner */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="flex flex-col items-center gap-3"
        >
          <div className="w-8 h-8 rounded-full border-2 border-borderSubtle border-t-primaryPurple animate-spin" />
          <p className="text-sm text-textMuted">Restoring session...</p>
        </motion.div>
      </div>
    </AppBackground>
  );
};

export default AuthLoadingScreen;
