import { Eye, CheckCircle2, XCircle, RotateCw } from 'lucide-react';

/**
 * SubscriptionRowActions — Actions per subscription row.
 */
export const SubscriptionRowActions = ({
  subscription,
  onView,
  onActivate,
  onCancel,
  onRenew,
}) => {
  const status = subscription?.status;

  const canActivate = status === 'trial' || status === 'past_due';
  const canCancel = status === 'trial' || status === 'active' || status === 'past_due';
  const canRenew = status === 'active' || status === 'past_due' || status === 'expired';

  return (
    <div className="flex items-center gap-1.5 justify-end">
      {/* View Details */}
      <button
        id={`sub-view-${subscription._id}`}
        onClick={() => onView(subscription)}
        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/8 text-textMuted hover:text-textPrimary transition-all"
        title="View Details"
      >
        <Eye className="w-3.5 h-3.5" />
      </button>

      {/* Activate */}
      {canActivate && (
        <button
          id={`sub-activate-${subscription._id}`}
          onClick={() => onActivate(subscription)}
          className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 hover:text-emerald-300 transition-all"
          title="Activate Subscription"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Renew */}
      {canRenew && (
        <button
          id={`sub-renew-${subscription._id}`}
          onClick={() => onRenew(subscription)}
          className="p-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 text-purple-400 hover:text-purple-300 transition-all"
          title="Renew Subscription"
        >
          <RotateCw className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Cancel */}
      {canCancel && (
        <button
          id={`sub-cancel-${subscription._id}`}
          onClick={() => onCancel(subscription)}
          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 hover:text-rose-300 transition-all"
          title="Cancel Subscription"
        >
          <XCircle className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};

export default SubscriptionRowActions;
