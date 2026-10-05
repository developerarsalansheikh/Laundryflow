import { Percent, Shield, Layers } from 'lucide-react';

/**
 * SubscriptionCommissionCard — Overview of platform billing model.
 * Read-only structure.
 */
export const SubscriptionCommissionCard = () => {
  return (
    <div className="glass-card rounded-2xl border border-white/8 p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Percent className="w-4 h-4 text-purple-400" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-textPrimary">LaundryFlow SaaS Billing Structure</h3>
          <p className="text-xs text-textMuted mt-0.5 max-w-xl">
            Laundries operate on a percentage-based platform commission model (default 10%).
            Commission is automatically split upon successful order payments.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-shrink-0 border-t md:border-t-0 md:border-l border-white/8 pt-3 md:pt-0 md:pl-5">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs font-semibold text-purple-300">
          <Shield className="w-3.5 h-3.5" />
          <span>Automated Split</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold text-indigo-300">
          <Layers className="w-3.5 h-3.5" />
          <span>Tiered Commission</span>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionCommissionCard;
