import { AlertTriangle, RefreshCw } from 'lucide-react';

/**
 * Reusable Error State Component for Super Admin Dashboard.
 */
export const DashboardError = ({ message = 'Unable to load dashboard data from backend.', onRetry }) => {
  return (
    <div className="glass-card p-8 text-center max-w-md mx-auto my-12 space-y-4 border-statusDanger/30">
      <div className="w-12 h-12 rounded-2xl bg-statusDanger/15 text-statusDanger flex items-center justify-center mx-auto">
        <AlertTriangle className="w-6 h-6" />
      </div>
      <div>
        <h3 className="text-base font-bold text-textPrimary">Failed to Load Dashboard</h3>
        <p className="text-xs text-textSecondary mt-1 leading-relaxed">{message}</p>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="btn-primary py-2 px-4 text-xs inline-flex items-center gap-2"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry Loading</span>
        </button>
      )}
    </div>
  );
};

export default DashboardError;
