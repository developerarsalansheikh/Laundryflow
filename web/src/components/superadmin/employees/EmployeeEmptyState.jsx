import { motion } from 'framer-motion';
import { X, Plus, Truck } from 'lucide-react';

/**
 * EmployeeEmptyState — Displayed when no employees or delivery agents are found.
 */
export const EmployeeEmptyState = ({ hasActiveFilters, onClear, onCreateDeliveryPartner }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl border border-white/8 flex flex-col items-center justify-center py-16 px-6 text-center my-4 overflow-hidden relative"
    >
      {/* Background illustration */}
      <div className="relative mb-4">
        <img
          src="/images/delivery_empty.jpg"
          alt="Delivery workforce"
          className="w-44 h-44 object-contain rounded-2xl shadow-xl shadow-indigo-500/10 border border-white/10"
        />
        <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-xl bg-indigo-600/90 text-white flex items-center justify-center shadow-lg border border-white/20">
          <Truck className="w-5 h-5" />
        </div>
      </div>

      <h3 className="text-base font-bold text-textPrimary mb-1">
        {hasActiveFilters ? 'No matching delivery agents found' : 'No delivery agents registered yet'}
      </h3>
      <p className="text-xs sm:text-sm text-textMuted max-w-sm leading-relaxed mb-5">
        {hasActiveFilters
          ? 'Try adjusting your search criteria, role tabs, or store filters.'
          : 'Onboard your first delivery agent to start assigning pickups and door-to-door deliveries.'}
      </p>

      <div className="flex items-center gap-3">
        {hasActiveFilters ? (
          <button
            onClick={onClear}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-xl hover:bg-amber-500/20 transition-all"
          >
            <X className="w-3.5 h-3.5" />
            Clear Filters
          </button>
        ) : onCreateDeliveryPartner ? (
          <button
            onClick={onCreateDeliveryPartner}
            className="btn-primary flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/35 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Delivery Agent</span>
          </button>
        ) : null}
      </div>
    </motion.div>
  );
};

export default EmployeeEmptyState;
