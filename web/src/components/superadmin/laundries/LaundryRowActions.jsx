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
        className="w-7 h-7 rounded-lg hover:bg-stone-100 flex items-center justify-center text-stone-500 hover:text-stone-900 transition-all cursor-pointer"
        aria-label="Actions"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-44 rounded-xl bg-white border border-[#E7E2D8] shadow-xl py-1 z-30 animate-in fade-in zoom-in-95 duration-100">
          {/* View Details */}
          <button
            onClick={() => {
              setIsOpen(false);
              onView(laundry);
            }}
            className="w-full px-3 py-2 text-left text-xs text-stone-700 hover:text-stone-900 hover:bg-stone-50 flex items-center gap-2 transition-colors cursor-pointer font-erode"
          >
            <Eye className="w-3.5 h-3.5 text-stone-500" />
            <span>View Details</span>
          </button>

          {/* Edit Commission */}
          <button
            onClick={() => {
              setIsOpen(false);
              onEditCommission(laundry);
            }}
            className="w-full px-3 py-2 text-left text-xs text-stone-700 hover:text-stone-900 hover:bg-stone-50 flex items-center gap-2 transition-colors cursor-pointer font-erode"
          >
            <Percent className="w-3.5 h-3.5 text-stone-500" />
            <span>Edit Commission</span>
          </button>

          {/* Approve / Activate / Unsuspend (If pending, rejected, or suspended) */}
          {(status === 'pending' || status === 'rejected' || status === 'suspended') && (
            <button
              onClick={() => {
                setIsOpen(false);
                onApprove(laundry);
              }}
              className="w-full px-3 py-2 text-left text-xs text-emerald-700 hover:bg-emerald-50 flex items-center gap-2 transition-colors cursor-pointer font-erode"
            >
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
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
              className="w-full px-3 py-2 text-left text-xs text-rose-700 hover:bg-rose-50 flex items-center gap-2 transition-colors cursor-pointer font-erode"
            >
              <XCircle className="w-3.5 h-3.5 text-rose-600" />
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
              className="w-full px-3 py-2 text-left text-xs text-amber-700 hover:bg-amber-50 flex items-center gap-2 transition-colors cursor-pointer font-erode"
            >
              <Ban className="w-3.5 h-3.5 text-amber-600" />
              <span>Suspend Laundry</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default LaundryRowActions;
