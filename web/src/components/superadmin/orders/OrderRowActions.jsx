import { Eye } from 'lucide-react';

/**
 * OrderRowActions — Actions available to SuperAdmin per order row.
 *
 * Backend limitation:
 * - Status update: locked to "admin" role — NOT available to SuperAdmin
 * - Assign delivery: locked to "admin" role — NOT available to SuperAdmin
 * - Only "View" action is safe to expose
 */
export const OrderRowActions = ({ order, onView }) => {
  const orderId = order?.order?._id || order?.order || order?._id;

  return (
    <button
      id={`order-view-btn-${orderId}`}
      onClick={() => onView(order)}
      title="View order details"
      className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-indigo-500/15 text-textMuted hover:text-indigo-400 border border-white/8 hover:border-indigo-500/30 transition-all duration-150"
    >
      <Eye className="w-4 h-4" />
    </button>
  );
};

export default OrderRowActions;
