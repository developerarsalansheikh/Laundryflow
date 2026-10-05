import { useState, useRef, useEffect } from 'react';
import { MoreVertical, Eye, CheckCircle, XCircle, Ban, Percent } from 'lucide-react';

/**
 * LaundryRowActions Component
 * Three-dot action menu for laundry operations.
 * Only shows real operations supported by backend contracts.
 */
export const LaundryRowActions = ({
  laundry,
  onView,
  onApprove,
  onReject,
  onSuspend,
  onEditCommission,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  const status = laundry?.status || 'pending';

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-7 h-7 rounded-lg hover:bg-white/10 flex items-center justify-center text-textMuted hover:text-textPrimary transition-all cursor-pointer"
        aria-label="Actions"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-44 rounded-xl bg-[#0F172A] border border-white/15 shadow-2xl py-1 z-30 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100">
          {/* View Details */}
          <button
            onClick={() => {
              setIsOpen(false);
              onView(laundry);
            }}
            className="w-full px-3 py-2 text-left text-xs text-textSecondary hover:text-textPrimary hover:bg-white/10 flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-blue-400" />
            <span>View Details</span>
          </button>

          {/* Edit Commission */}
          <button
            onClick={() => {
              setIsOpen(false);
              onEditCommission(laundry);
            }}
            className="w-full px-3 py-2 text-left text-xs text-textSecondary hover:text-textPrimary hover:bg-white/10 flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Percent className="w-3.5 h-3.5 text-purple-400" />
            <span>Edit Commission</span>
          </button>

          {/* Approve / Activate / Unsuspend (If pending, rejected, or suspended) */}
          {(status === 'pending' || status === 'rejected' || status === 'suspended') && (
            <button
              onClick={() => {
                setIsOpen(false);
                onApprove(laundry);
              }}
              className="w-full px-3 py-2 text-left text-xs text-emerald-400 hover:bg-emerald-500/15 flex items-center gap-2 transition-colors cursor-pointer"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>{status === 'suspended' ? 'Activate Laundry' : 'Approve Laundry'}</span>
            </button>
          )}

          {/* Reject (Only if pending) */}
          {status === 'pending' && (
            <button
              onClick={() => {
                setIsOpen(false);
                onReject(laundry);
              }}
              className="w-full px-3 py-2 text-left text-xs text-rose-400 hover:bg-rose-500/15 flex items-center gap-2 transition-colors cursor-pointer"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Reject Laundry</span>
            </button>
          )}

          {/* Suspend (Only if active) */}
          {status === 'active' && (
            <button
              onClick={() => {
                setIsOpen(false);
                onSuspend(laundry);
              }}
              className="w-full px-3 py-2 text-left text-xs text-amber-400 hover:bg-amber-500/15 flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Ban className="w-3.5 h-3.5" />
              <span>Suspend Laundry</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default LaundryRowActions;
