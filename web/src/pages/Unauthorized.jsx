import { motion } from 'framer-motion';

export const Unauthorized = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-8 rounded-2xl border border-borderSubtle text-center max-w-md w-full mx-auto my-auto"
    >
      <h1 className="text-3xl font-extrabold text-textPrimary mb-1">Unauthorized Access</h1>
      <p className="text-sm text-textSecondary">LaundryFlow Super Admin</p>
    </motion.div>
  );
};

export default Unauthorized;
