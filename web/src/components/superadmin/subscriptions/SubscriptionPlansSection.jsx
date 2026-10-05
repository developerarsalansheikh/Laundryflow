import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, Tag, Check, Sparkles } from 'lucide-react';
import { useSubscriptionPlans } from '../../../hooks/useSubscriptions';

const fmtCurrency = (amount, currency = 'INR') =>
  amount != null
    ? new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount)
    : '₹0';

/**
 * SubscriptionPlansSection — Plan Management cards & actions panel.
 */
export const SubscriptionPlansSection = ({ onCreatePlan, onEditPlan, onDeletePlan }) => {
  const { data: plansData, isLoading, isError } = useSubscriptionPlans();

  const plans = plansData?.data || [];

  return (
    <div className="glass-card rounded-2xl border border-white/8 p-5 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/8 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-purple-400" />
            <h2 className="text-base font-bold text-textPrimary">Subscription Plans</h2>
          </div>
          <p className="text-xs text-textMuted mt-0.5">
            Configure SaaS pricing tiers, feature limits, and billing terms.
          </p>
        </div>

        <button
          id="create-plan-btn"
          onClick={onCreatePlan}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-semibold text-white shadow-lg shadow-purple-600/30 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create Plan</span>
        </button>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="glass-card rounded-xl p-4 border border-white/6 animate-pulse space-y-3">
              <div className="h-4 w-28 bg-white/8 rounded-md" />
              <div className="h-6 w-20 bg-white/10 rounded-md" />
              <div className="space-y-1.5">
                <div className="h-2.5 w-full bg-white/5 rounded-full" />
                <div className="h-2.5 w-3/4 bg-white/5 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !isError && plans.length === 0 && (
        <div className="text-center py-8 text-xs text-textMuted">
          <p className="font-semibold text-textSecondary mb-1">No subscription plans found</p>
          <p>Click &quot;Create Plan&quot; to define your first subscription tier.</p>
        </div>
      )}

      {/* Plans Grid */}
      {!isLoading && !isError && plans.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map((plan, i) => (
            <motion.div
              key={plan._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`relative glass-card rounded-2xl p-4 border transition-all flex flex-col justify-between ${
                plan.isPopular
                  ? 'border-purple-500/50 shadow-[0_0_20px_rgba(168,85,247,0.15)] bg-purple-500/[0.03]'
                  : 'border-white/8 hover:border-white/15'
              }`}
            >
              {/* Badges */}
              <div className="flex items-center gap-2 absolute right-4 top-4">
                {plan.isPopular && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/40">
                    <Sparkles className="w-3 h-3" /> Popular
                  </span>
                )}
                {!plan.isActive && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-rose-500/20 text-rose-400 border border-rose-500/40">
                    Inactive
                  </span>
                )}
              </div>

              <div>
                <p className="text-sm font-bold text-textPrimary">{plan.name}</p>
                <p className="text-[10px] text-textMuted font-mono mt-0.5">/{plan.slug}</p>
                {plan.description && (
                  <p className="text-xs text-textMuted mt-2 line-clamp-2 leading-relaxed">{plan.description}</p>
                )}

                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-2xl font-extrabold text-textPrimary tabular-nums">
                    {fmtCurrency(plan.price, plan.currency)}
                  </span>
                  <span className="text-xs text-textMuted">/{plan.billingCycle}</span>
                </div>

                {/* Features */}
                {plan.features?.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-white/6 space-y-1.5">
                    {plan.features.map((feat, idx) => (
                      <div key={idx} className="flex items-start gap-1.5 text-xs text-textSecondary">
                        <Check className="w-3.5 h-3.5 text-purple-400 flex-shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-white/6 flex items-center justify-end gap-2">
                <button
                  id={`edit-plan-${plan._id}`}
                  onClick={() => onEditPlan(plan)}
                  className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/8 text-[11px] font-semibold text-textSecondary hover:text-textPrimary flex items-center gap-1 transition-all"
                >
                  <Edit2 className="w-3 h-3" /> Edit
                </button>
                <button
                  id={`delete-plan-${plan._id}`}
                  onClick={() => onDeletePlan(plan)}
                  className="px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-[11px] font-semibold text-rose-400 hover:text-rose-300 flex items-center gap-1 transition-all"
                >
                  <Trash2 className="w-3 h-3" /> Delete
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SubscriptionPlansSection;
