/**
 * Canonical Order Statuses aligned with Backend/server/models/orderModels.js
 */
export const ORDER_STATUS = Object.freeze({
  PENDING: 'pending',
  PICKED_UP: 'picked_up',
  AT_LAUNDRY_PENDING_CONFIRMATION: 'at_laundry_pending_confirmation',
  RECEIVED_AT_LAUNDRY: 'received_at_laundry',
  IN_PROGRESS: 'in_progress',
  READY: 'ready',
  READY_FOR_REDELIVERY: 'ready_for_redelivery',
  OUT_FOR_DELIVERY: 'out_for_delivery',
  DELIVERY_PENDING_CUSTOMER_CONFIRMATION: 'delivery_pending_customer_confirmation',
  CUSTOMER_UNAVAILABLE: 'customer_unavailable',
  RETURNED_TO_LAUNDRY: 'returned_to_laundry',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
});

export const ORDER_STATUS_LABELS = Object.freeze({
  [ORDER_STATUS.PENDING]: 'Order Placed',
  [ORDER_STATUS.PICKED_UP]: 'Picked Up by Driver',
  [ORDER_STATUS.AT_LAUNDRY_PENDING_CONFIRMATION]: 'Delivered to Laundry',
  [ORDER_STATUS.RECEIVED_AT_LAUNDRY]: 'Laundry Received',
  [ORDER_STATUS.IN_PROGRESS]: 'Processing (Washing)',
  [ORDER_STATUS.READY]: 'Ready for Delivery',
  [ORDER_STATUS.READY_FOR_REDELIVERY]: 'Ready for Redelivery',
  [ORDER_STATUS.OUT_FOR_DELIVERY]: 'Out for Delivery',
  [ORDER_STATUS.DELIVERY_PENDING_CUSTOMER_CONFIRMATION]: 'Delivered to Customer',
  [ORDER_STATUS.CUSTOMER_UNAVAILABLE]: 'Customer Unavailable',
  [ORDER_STATUS.RETURNED_TO_LAUNDRY]: 'Returned to Laundry',
  [ORDER_STATUS.DELIVERED]: 'Completed',
  [ORDER_STATUS.CANCELLED]: 'Cancelled',
});

export const ORDER_STATUS_COLORS = Object.freeze({
  [ORDER_STATUS.PENDING]: '#F59E0B',                             // Amber
  [ORDER_STATUS.PICKED_UP]: '#3B82F6',                           // Blue
  [ORDER_STATUS.AT_LAUNDRY_PENDING_CONFIRMATION]: '#6366F1',     // Indigo
  [ORDER_STATUS.RECEIVED_AT_LAUNDRY]: '#0EA5E9',                 // Sky
  [ORDER_STATUS.IN_PROGRESS]: '#8B5CF6',                         // Purple
  [ORDER_STATUS.READY]: '#10B981',                               // Emerald
  [ORDER_STATUS.READY_FOR_REDELIVERY]: '#14B8A6',                // Teal
  [ORDER_STATUS.OUT_FOR_DELIVERY]: '#06B6D4',                    // Cyan
  [ORDER_STATUS.DELIVERY_PENDING_CUSTOMER_CONFIRMATION]: '#F97316', // Orange
  [ORDER_STATUS.CUSTOMER_UNAVAILABLE]: '#EF4444',                // Red
  [ORDER_STATUS.RETURNED_TO_LAUNDRY]: '#EAB308',                 // Yellow
  [ORDER_STATUS.DELIVERED]: '#22C55E',                           // Green
  [ORDER_STATUS.CANCELLED]: '#EF4444',                           // Red
});
