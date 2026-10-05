/**
 * LaundryFlow Reusable Formatters Utility Module.
 * Provides Indian currency, Indian number, relative time, status formatting,
 * and time-based greeting for the dashboard header.
 */

/**
 * Returns a time-appropriate greeting based on the current local hour.
 * @returns {'Good Morning' | 'Good Afternoon' | 'Good Evening'}
 */
export const getTimeBasedGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
};

/**
 * Formats a numeric value into Indian Rupee currency string.
 * Examples:
 *   1245000 -> "₹12.45L"
 *   12400000 -> "₹1.24Cr"
 *   1245 -> "₹1,245"
 *   0 -> "₹0"
 *
 * @param {number|string} amount
 * @returns {string}
 */
export const formatIndianCurrency = (amount) => {
  const num = Number(amount) || 0;
  if (num === 0) return '₹0';

  if (num >= 10000000) {
    const cr = (num / 10000000).toFixed(2);
    return `₹${cr.replace(/\.00$/, '')}Cr`;
  }
  if (num >= 100000) {
    const lakh = (num / 100000).toFixed(2);
    return `₹${lakh.replace(/\.00$/, '')}L`;
  }

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(num);
};

/**
 * Formats a number with Indian comma placement.
 * Examples:
 *   1245 -> "1,245"
 *   12450 -> "12,450"
 *   1245000 -> "12,45,000"
 *
 * @param {number|string} value
 * @returns {string}
 */
export const formatIndianNumber = (value) => {
  const num = Number(value) || 0;
  return new Intl.NumberFormat('en-IN').format(num);
};

/**
 * Formats ISO date string or timestamp into relative human-readable time.
 * Examples: "2m ago", "1h ago", "Yesterday", "10 May"
 *
 * @param {string|Date} dateInput
 * @returns {string}
 */
export const formatRelativeTime = (dateInput) => {
  if (!dateInput) return '—';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '—';

  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 172800) return 'Yesterday';

  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  });
};

/**
 * Maps status string to LaundryFlow design system status badge variant & human label.
 *
 * @param {string} status
 * @returns {{ label: string, variant: 'success'|'warning'|'danger'|'info'|'neutral' }}
 */
export const mapStatus = (status = '') => {
  const normalized = String(status).toLowerCase().trim();

  switch (normalized) {
    case 'active':
    case 'approved':
    case 'completed':
    case 'success':
    case 'paid':
    case 'delivered':
      return { label: normalized === 'delivered' ? 'Delivered' : 'Active', variant: 'success' };

    case 'ready':
      return { label: 'Ready for Delivery', variant: 'success' };

    case 'picked_up':
      return { label: 'Picked Up', variant: 'info' };

    case 'at_laundry_pending_confirmation':
      return { label: 'Delivered to Laundry', variant: 'info' };

    case 'received_at_laundry':
      return { label: 'Laundry Received', variant: 'info' };

    case 'in_progress':
    case 'in progress':
    case 'processing':
      return { label: 'Processing', variant: 'warning' };

    case 'ready_for_redelivery':
      return { label: 'Ready for Redelivery', variant: 'warning' };

    case 'out_for_delivery':
      return { label: 'Out for Delivery', variant: 'info' };

    case 'delivery_pending_customer_confirmation':
      return { label: 'Delivered (Pending Confirmation)', variant: 'warning' };

    case 'customer_unavailable':
      return { label: 'Customer Unavailable', variant: 'danger' };

    case 'returned_to_laundry':
      return { label: 'Returned to Laundry', variant: 'warning' };

    case 'pending':
      return { label: 'Order Placed', variant: 'warning' };

    case 'suspended':
    case 'rejected':
    case 'cancelled':
    case 'failed':
      return { label: status.replace(/_/g, ' '), variant: 'danger' };

    case 'info':
      return { label: status, variant: 'info' };

    default:
      return { label: status?.replace(/_/g, ' ') || 'Unknown', variant: 'neutral' };
  }
};
