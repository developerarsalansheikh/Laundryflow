import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  User,
  Phone,
  MapPin,
  Clock,
  Truck,
  CheckCircle2,
  AlertCircle,
  Printer,
  CreditCard,
  Ban,
  Camera,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { adminApi } from '../../api/adminApi';
import { ROUTES } from '../../routes/routeConstants';

const LIFECYCLE_STEPS = [
  { key: 'pending', label: '1. Order Placed' },
  { key: 'picked_up', label: '2. Picked Up' },
  { key: 'at_laundry_pending_confirmation', label: '3. Handed to Laundry' },
  { key: 'received_at_laundry', label: '4. Laundry Received' },
  { key: 'in_progress', label: '5. Processing' },
  { key: 'ready', label: '6. Ready for Delivery' },
  { key: 'out_for_delivery', label: '7. Out for Delivery' },
  { key: 'delivery_pending_customer_confirmation', label: '8. Delivered to Customer' },
  { key: 'delivered', label: '9. Completed' },
];

export const AdminOrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [driverToAssign, setDriverToAssign] = useState(null);

  // 1. Fetch Order Details
  const { data: order, isLoading, error } = useQuery({
    queryKey: ['admin-order-detail', id],
    queryFn: () => adminApi.getOrderById(id),
    enabled: Boolean(id),
  });

  // 2. Fetch Nearby Eligible Shared Delivery Partners
  const {
    data: nearbyDrivers = [],
    isLoading: nearbyLoading,
    isError: nearbyError,
    error: nearbyErr,
    refetch: refetchNearby,
  } = useQuery({
    queryKey: ['admin-nearby-drivers', id],
    queryFn: () => adminApi.getNearbyDrivers(id),
    enabled: Boolean(id),
  });

  // 3. Fallback/Platform Delivery Partners
  const { data: drivers = [] } = useQuery({
    queryKey: ['admin-delivery-partners'],
    queryFn: adminApi.getDeliveryPartners,
  });

  // Mutation: Update status
  const statusMutation = useMutation({
    mutationFn: ({ nextStatus, message }) =>
      adminApi.updateOrderStatus(id, { status: nextStatus, message }),
    onSuccess: (updated) => {
      toast.success(`Order status advanced to ${updated.status?.replace(/_/g, ' ')}`);
      queryClient.invalidateQueries({ queryKey: ['admin-order-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] });
      setCancelModalOpen(false);
      setCancelReason('');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update order status');
    },
  });

  // Mutation: Assign Driver
  const assignDriverMutation = useMutation({
    mutationFn: (driverId) => adminApi.assignDeliveryPartner(id, driverId),
    onSuccess: () => {
      toast.success('Delivery driver successfully assigned to order');
      queryClient.invalidateQueries({ queryKey: ['admin-order-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-nearby-drivers', id] });
      setAssignModalOpen(false);
      setDriverToAssign(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to assign delivery driver');
    },
  });

  // Mutation: Confirm COD Payment
  const confirmCODPaymentMutation = useMutation({
    mutationFn: () => adminApi.confirmCODPayment(id),
    onSuccess: () => {
      toast.success('COD payment successfully confirmed and marked as paid!');
      queryClient.invalidateQueries({ queryKey: ['admin-order-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to confirm COD payment');
    },
  });

  // Mutation: Auto Assign Driver
  const autoAssignMutation = useMutation({
    mutationFn: () => adminApi.autoAssignOrder(id),
    onSuccess: (res) => {
      const driverName = res.data?.deliveryPartner?.name || 'Driver';
      toast.success(`Driver ${driverName} automatically assigned!`);
      queryClient.invalidateQueries({ queryKey: ['admin-order-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-nearby-drivers', id] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Auto-assignment unsuccessful');
      queryClient.invalidateQueries({ queryKey: ['admin-order-detail', id] });
    },
  });

  if (isLoading) {
    return (
      <div className="py-24 text-center text-xs text-textMuted">
        Loading order details...
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="py-20 text-center space-y-3">
        <AlertCircle className="w-10 h-10 text-statusDanger mx-auto" />
        <h2 className="text-base font-bold text-textPrimary">Order Not Found</h2>
        <p className="text-xs text-textMuted">
          The requested order ID may be invalid or does not belong to your store.
        </p>
        <button
          onClick={() => navigate(ROUTES.ADMIN.ORDERS)}
          className="btn-primary px-4 py-2 text-xs font-semibold"
        >
          Back to Orders
        </button>
      </div>
    );
  }

  const currentStatus = order.status || 'pending';
  const isCancelled = currentStatus === 'cancelled';

  const getStepIndex = (st) => LIFECYCLE_STEPS.findIndex((s) => s.key === st);
  const currentStepIdx = getStepIndex(currentStatus);

  const getNextTransition = () => {
    switch (currentStatus) {
      case 'at_laundry_pending_confirmation':
        return { next: 'received_at_laundry', label: 'Confirm Received at Laundry' };
      case 'received_at_laundry':
        return { next: 'in_progress', label: 'Start Processing (Wash/Clean)' };
      case 'in_progress':
        return { next: 'ready', label: 'Mark Ready for Delivery' };
      case 'returned_to_laundry':
        return { next: 'ready_for_redelivery', label: 'Schedule Next-Day Redelivery' };
      default:
        return null;
    }
  };

  const getHandoffNotice = () => {
    switch (currentStatus) {
      case 'pending':
        return {
          type: 'info',
          title: 'Awaiting Driver Pickup',
          desc: 'Delivery partner must pick up order from customer. Admin cannot skip pickup.',
        };
      case 'picked_up':
        return {
          type: 'info',
          title: 'Driver Bringing Order to Laundry',
          desc: 'Delivery partner has collected clothes from customer and is en route to your laundry store.',
        };
      case 'at_laundry_pending_confirmation':
        return {
          type: 'action',
          title: 'Delivery Partner Has Arrived',
          desc: 'Driver has delivered order to your laundry. Please check clothes and click "Confirm Received at Laundry" above.',
        };
      case 'received_at_laundry':
        return {
          type: 'action',
          title: 'Ready for Washing',
          desc: 'Order received at laundry. Click "Start Processing" to begin washing.',
        };
      case 'in_progress':
        return {
          type: 'action',
          title: 'Processing In Progress',
          desc: 'Clothes are being washed and cleaned. Click "Mark Ready for Delivery" once packed.',
        };
      case 'ready':
      case 'ready_for_redelivery':
        return {
          type: 'info',
          title: 'Ready for Delivery',
          desc: 'Assign an eligible delivery partner below. Assigned partner will pick up order from laundry and deliver to customer.',
        };
      case 'out_for_delivery':
        return {
          type: 'info',
          title: 'Out for Delivery',
          desc: 'Delivery partner has picked up order from laundry and is on the way to customer address.',
        };
      case 'delivery_pending_customer_confirmation':
        return {
          type: 'info',
          title: 'Awaiting Customer Confirmation',
          desc: 'Delivery partner arrived at customer address and marked delivered. Awaiting customer confirmation on customer app.',
        };
      case 'customer_unavailable':
        return {
          type: 'warning',
          title: 'Customer Unavailable',
          desc: 'Customer was not available today. Driver is returning order to laundry store.',
        };
      case 'returned_to_laundry':
        return {
          type: 'action',
          title: 'Order Returned to Laundry',
          desc: 'Customer was unavailable. Click "Schedule Next-Day Redelivery" above to make ready for redelivery.',
        };
      case 'delivered':
        return {
          type: 'success',
          title: 'Order Completed',
          desc: 'Delivery confirmed by customer. Payment and revenue settled.',
        };
      default:
        return null;
    }
  };

  const handoffNotice = getHandoffNotice();

  const nextTransition = getNextTransition();
  const customer = order.user || order.customerId || {};
  const pickupAddress = order.pickupAddress || order.pickupAddressSnapshot || order.address || {};
  const deliveryAddress = order.deliveryAddress || order.deliveryAddressSnapshot || order.pickupAddress || order.pickupAddressSnapshot || {};
  const items = order.items || order.services || [];
  const assignedDriver =
    drivers.find((d) => d._id === (order.deliveryPartnerId || order.deliveryPartner?._id)) || order.deliveryPartner;

  const getTrackingBadge = () => {
    if (!assignedDriver) return null;
    const updatedAt = assignedDriver.location?.updatedAt || assignedDriver.currentLocation?.updatedAt;
    if (!updatedAt) return { label: 'OFFLINE', color: 'bg-white/[0.06] text-textMuted border-white/[0.1]', detail: 'Location offline' };
    const diffSec = Math.floor((Date.now() - new Date(updatedAt).getTime()) / 1000);
    if (diffSec < 60) return { label: 'LIVE', color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30', detail: `Active (${diffSec}s ago)` };
    if (diffSec < 120) return { label: 'UPDATING', color: 'bg-amber-500/15 text-amber-300 border-amber-500/30', detail: `Updated ${diffSec}s ago` };
    if (diffSec < 300) return { label: 'STALE', color: 'bg-orange-500/15 text-orange-300 border-orange-500/30', detail: `Delayed (${Math.floor(diffSec / 60)}m ago)` };
    return { label: 'OFFLINE', color: 'bg-white/[0.06] text-textMuted border-white/[0.1]', detail: 'Offline' };
  };
  const trackingBadge = getTrackingBadge();

  const totalAmount = order.totalAmount || order.pricing?.total || 0;
  const deliveryFee = order.deliveryFee ?? order.pricing?.deliveryFee ?? 0;
  const tax = order.gst ?? order.tax ?? order.pricing?.tax ?? 0;
  const subtotal = order.subtotal ?? order.pricing?.subtotal ?? Math.max(0, totalAmount - deliveryFee - tax);

  return (
    <div className="space-y-6">
      {/* Top Navigation & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(ROUTES.ADMIN.ORDERS)}
            className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-textSecondary hover:text-textPrimary hover:bg-white/[0.08] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold tracking-tight text-textPrimary font-mono">
                #{order._id?.slice(-8).toUpperCase()}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-primaryPurple/15 text-purpleLight border border-primaryPurple/30">
                {currentStatus.replace(/_/g, ' ').toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-textMuted mt-0.5">
              Placed on {new Date(order.createdAt || Date.now()).toLocaleString('en-IN')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-white/[0.04] text-textSecondary hover:text-textPrimary border border-white/10 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Receipt</span>
          </button>

          {nextTransition && (
            <button
              onClick={() => statusMutation.mutate({ nextStatus: nextTransition.next })}
              disabled={statusMutation.isPending}
              className="btn-primary px-4 py-2 text-xs font-semibold gap-1.5 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{nextTransition.label}</span>
            </button>
          )}

          {currentStatus === 'pending' && (
            <button
              onClick={() => setCancelModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-statusDanger/10 text-statusDanger border border-statusDanger/25 hover:bg-statusDanger/20 transition-colors"
            >
              <Ban className="w-3.5 h-3.5" />
              <span>Cancel</span>
            </button>
          )}
        </div>
      </div>

      {/* Real Laundry Handoff Stage Notice Banner */}
      {handoffNotice && (
        <div
          className={`p-4 rounded-2xl border flex items-start gap-3.5 ${
            handoffNotice.type === 'action'
              ? 'bg-primaryPurple/10 border-primaryPurple/30 text-purpleLight'
              : handoffNotice.type === 'warning'
              ? 'bg-statusDanger/10 border-statusDanger/30 text-statusDanger'
              : handoffNotice.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-white/[0.03] border-white/10 text-textSecondary'
          }`}
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-current" />
          <div className="flex-1">
            <h3 className="text-sm font-bold text-textPrimary">{handoffNotice.title}</h3>
            <p className="text-xs text-textSecondary mt-0.5">{handoffNotice.desc}</p>
          </div>
          {nextTransition && (
            <button
              onClick={() => statusMutation.mutate({ nextStatus: nextTransition.next })}
              disabled={statusMutation.isPending}
              className="btn-primary px-3.5 py-1.5 text-xs font-semibold flex-shrink-0 ml-2"
            >
              {nextTransition.label}
            </button>
          )}
        </div>
      )}

      {/* Lifecycle Progress Stepper */}
      {!isCancelled ? (
        <div className="glass-card p-6">
          <h2 className="text-xs font-bold uppercase tracking-wider text-textMuted mb-4">
            Order Lifecycle Pipeline
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {LIFECYCLE_STEPS.map((step, idx) => {
              const isPastOrCurrent = currentStepIdx >= idx;
              const isCurrent = currentStepIdx === idx;
              return (
                <div
                  key={step.key}
                  className={`p-3.5 rounded-xl border text-center transition-all ${
                    isCurrent
                      ? 'bg-gradient-to-b from-primaryPurple/25 to-brandIndigo/15 border-primaryPurple/50 text-textPrimary font-bold shadow-glowPurple'
                      : isPastOrCurrent
                      ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300'
                      : 'bg-white/[0.02] border-white/[0.06] text-textMuted'
                  }`}
                >
                  <div className="text-[10px] font-bold uppercase tracking-wider mb-1 opacity-75">
                    Step {idx + 1}
                  </div>
                  <div className="text-xs font-medium truncate">{step.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-statusDanger/10 border border-statusDanger/30 text-statusDanger flex items-center gap-3">
          <Ban className="w-5 h-5 flex-shrink-0" />
          <div>
            <p className="text-sm font-bold text-textPrimary">This order was cancelled.</p>
            <p className="text-xs text-textSecondary mt-0.5">
              Reason: {order.cancelReason || 'Cancelled by store admin or customer request.'}
            </p>
          </div>
        </div>
      )}

      {/* Driver Assignment Banner */}
      <div className="glass-card p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purpleLight">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-textPrimary">
              Assigned Delivery Partner
            </h3>
            {assignedDriver ? (
              <p className="text-xs text-textSecondary mt-0.5 font-medium">
                {assignedDriver.name} • {assignedDriver.phone} • {assignedDriver.vehicleNumber || 'Shared Partner'}
              </p>
            ) : (
              <p className="text-xs text-amber-400 mt-0.5 font-medium">
                No delivery partner assigned yet for this shipment.
              </p>
            )}
          </div>
        </div>

        {/* Assignment Controls */}
        {!isCancelled && currentStatus !== 'delivered' && (
          <div className="flex items-center gap-2">
            {!assignedDriver && (
              <button
                onClick={() => autoAssignMutation.mutate()}
                disabled={autoAssignMutation.isPending}
                className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 transition-colors flex items-center gap-1.5"
              >
                <span>⚡ Auto-Assign Driver</span>
              </button>
            )}
            <button
              onClick={() => setAssignModalOpen(true)}
              className="btn-primary px-4 py-2 text-xs font-semibold gap-1.5"
            >
              <Truck className="w-4 h-4" />
              <span>{assignedDriver ? 'Reassign Nearby Partner' : 'Assign Nearby Partner'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Main 2-Column Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Items & Billing (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items Table */}
          <div className="glass-card p-6">
            <h2 className="text-sm font-bold text-textPrimary mb-4">
              Order Items ({items.length})
            </h2>

            {items.length === 0 ? (
              <p className="text-xs text-textMuted py-4">No detailed items recorded.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-white/[0.07] text-[11px] font-semibold text-textMuted uppercase tracking-wider">
                    <tr>
                      <th className="py-2.5 px-2">Service Item</th>
                      <th className="py-2.5 px-2">Unit</th>
                      <th className="py-2.5 px-2 text-center">Qty</th>
                      <th className="py-2.5 px-2 text-right">Price</th>
                      <th className="py-2.5 px-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {items.map((it, idx) => {
                      const name = it.service?.name || it.name || `Service Item #${idx + 1}`;
                      const unit = it.service?.unit || it.unit || 'pc';
                      const rate = it.price || it.unitPrice || 0;
                      const lineTotal = it.total || rate * (it.quantity || 1);

                      return (
                        <tr key={idx} className="hover:bg-white/[0.02]">
                          <td className="py-3 px-2 font-medium text-textPrimary">
                            {name}
                          </td>
                          <td className="py-3 px-2 text-textMuted">{unit}</td>
                          <td className="py-3 px-2 text-center font-bold text-textPrimary">
                            {it.quantity || 1}
                          </td>
                          <td className="py-3 px-2 text-right text-textSecondary">
                            ₹{rate}
                          </td>
                          <td className="py-3 px-2 text-right font-bold text-textPrimary">
                            ₹{lineTotal}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Special Instructions Note */}
          {order.specialInstructions && (
            <div className="glass-card p-5 text-xs">
              <span className="font-bold text-textPrimary">Customer Note:</span>
              <p className="text-textSecondary mt-1 leading-relaxed">{order.specialInstructions}</p>
            </div>
          )}

          {/* Pricing Summary Card */}
          <div className="glass-card p-6 space-y-3 text-xs">
            <h3 className="text-sm font-bold text-textPrimary mb-2">
              Payment & Invoice Summary
            </h3>
            <div className="flex justify-between text-textSecondary">
              <span>Subtotal</span>
              <span>₹{Number(subtotal).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-textSecondary">
              <span>Delivery Fee</span>
              <span>₹{Number(deliveryFee).toFixed(2)}</span>
            </div>
            {tax > 0 && (
              <div className="flex justify-between text-textSecondary">
                <span>Taxes & GST</span>
                <span>₹{Number(tax).toFixed(2)}</span>
              </div>
            )}
            <div className="border-t border-white/[0.08] pt-3 flex justify-between font-bold text-base text-textPrimary">
              <span>Grand Total</span>
              <span className="text-purpleLight">₹{Number(totalAmount).toLocaleString('en-IN')}</span>
            </div>

            <div className="pt-2 flex items-center justify-between text-[11px] text-textMuted">
              <span className="flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-textSecondary" />
                <span>Payment: {order.paymentMethod?.toUpperCase() || 'COD'}</span>
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full font-semibold border ${
                  order.isPaid || order.paymentStatus === 'paid'
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                    : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                }`}
              >
                {order.isPaid || order.paymentStatus === 'paid' ? 'PAID' : 'PAYMENT DUE'}
              </span>
            </div>

            {/* Detailed Payment Transaction Details */}
            {order.payment && (
              <div className="mt-2 pt-2 border-t border-white/[0.06] space-y-1 text-[11px] text-textSecondary">
                {order.payment.razorpayPaymentId && (
                  <div className="flex justify-between font-mono">
                    <span className="text-textMuted">Razorpay ID:</span>
                    <span>{order.payment.razorpayPaymentId}</span>
                  </div>
                )}
                {order.payment.paidAt && (
                  <div className="flex justify-between">
                    <span className="text-textMuted">Paid At:</span>
                    <span>{new Date(order.payment.paidAt).toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-textMuted">Store Payout:</span>
                  <span className="text-emerald-400 font-semibold">₹{Number(order.payment.laundryEarning || order.laundryEarning || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-textMuted">Platform Commission:</span>
                  <span>₹{Number(order.payment.commissionAmount || order.commissionAmount || 0).toFixed(2)}</span>
                </div>
              </div>
            )}

            {/* Confirm COD Payment button for delivered unpaid orders */}
            {order.paymentMethod === 'cod' && !order.isPaid && (
              <div className="mt-3 pt-2">
                <button
                  onClick={() => confirmCODPaymentMutation.mutate()}
                  disabled={confirmCODPaymentMutation.isPending}
                  className="w-full py-2 px-3 text-xs font-semibold rounded-xl bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600/30 transition-colors flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{confirmCODPaymentMutation.isPending ? 'Confirming...' : 'Confirm COD Payment Collected'}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Customer Profile & Schedule */}
        <div className="space-y-6">
          {/* Physical Package Identification / Pickup Photo Card */}
          {Boolean(order.pickupPhoto?.url) && (
            <div className="glass-card p-6 space-y-4 border border-sky-500/30 bg-sky-950/20 shadow-glowSky">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-textPrimary flex items-center gap-2">
                    <Camera className="w-4 h-4 text-sky-400" />
                    <span>Package Identification (Pickup Photo)</span>
                  </h3>
                  <p className="text-[11px] text-textMuted mt-0.5">
                    Laundry bag photo captured at customer pickup
                  </p>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/15 text-sky-300 border border-sky-500/30">
                  VERIFIED PHOTO
                </span>
              </div>

              <div className="rounded-xl overflow-hidden bg-slate-950/80 border border-white/10 flex items-center justify-center p-1.5">
                <img
                  src={order.pickupPhoto.url}
                  alt="Pickup Package"
                  className="max-h-72 w-full object-contain rounded-lg"
                />
              </div>

              <div className="space-y-1.5 text-xs text-textSecondary pt-2 border-t border-white/[0.06]">
                <div className="flex justify-between">
                  <span className="text-textMuted">Order ID:</span>
                  <span className="font-mono font-semibold text-textPrimary">#{order._id?.slice(-8).toUpperCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-textMuted">Customer:</span>
                  <span className="font-semibold text-textPrimary">{customer.name || 'Customer'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-textMuted">Delivery Agent:</span>
                  <span className="font-semibold text-textPrimary">{order.deliveryPartner?.name || 'Delivery Partner'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-textMuted">Destination Store:</span>
                  <span className="font-semibold text-textPrimary">{order.laundryId?.name || 'Laundry Store'}</span>
                </div>
                {order.pickupPhoto.uploadedAt && (
                  <div className="flex justify-between">
                    <span className="text-textMuted">Pickup Timestamp:</span>
                    <span className="text-textPrimary">{new Date(order.pickupPhoto.uploadedAt).toLocaleString('en-IN')}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Customer Info Card */}
          <div className="glass-card p-6 space-y-4">
            <h3 className="text-sm font-bold text-textPrimary flex items-center gap-2">
              <User className="w-4 h-4 text-purpleLight" />
              <span>Customer Details</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-textMuted text-[11px] uppercase tracking-wider font-semibold">Name</span>
                <p className="font-semibold text-textPrimary mt-0.5">
                  {customer.name || 'Valued Customer'}
                </p>
              </div>

              <div>
                <span className="text-textMuted text-[11px] uppercase tracking-wider font-semibold">Contact Phone</span>
                <p className="font-medium text-textPrimary flex items-center gap-1.5 mt-0.5">
                  <Phone className="w-3.5 h-3.5 text-textMuted" />
                  <a href={`tel:${customer.phone}`} className="hover:underline text-purpleLight">
                    {customer.phone || 'No phone provided'}
                  </a>
                </p>
              </div>

              {customer.email && (
                <div>
                  <span className="text-textMuted text-[11px] uppercase tracking-wider font-semibold">Email</span>
                  <p className="font-medium text-textSecondary truncate mt-0.5">
                    {customer.email}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Delivery & Pickup Address Card */}
          <div className="glass-card p-6 space-y-4">
            <h3 className="text-sm font-bold text-textPrimary flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-400" />
              <span>Addresses & Locations</span>
            </h3>

            <div className="text-xs space-y-3 text-textSecondary">
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <span className="text-[10px] uppercase font-bold text-textMuted tracking-wider block mb-1">
                  Pickup Address ({pickupAddress.label || 'Home'})
                </span>
                <p className="font-medium text-textPrimary leading-relaxed">
                  {pickupAddress.street || pickupAddress.fullAddress || pickupAddress.addressLine1 || 'Standard Address'}
                </p>
                {pickupAddress.landmark && (
                  <p className="text-textMuted text-[11px] mt-0.5">
                    Landmark: {pickupAddress.landmark}
                  </p>
                )}
                <p className="text-textMuted text-[11px] mt-0.5">
                  {pickupAddress.city || 'City'}, {pickupAddress.state || 'State'} {pickupAddress.pincode || pickupAddress.postalCode || pickupAddress.zipCode || ''}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <span className="text-[10px] uppercase font-bold text-textMuted tracking-wider block mb-1">
                  Delivery Address ({deliveryAddress.label || 'Home'})
                </span>
                <p className="font-medium text-textPrimary leading-relaxed">
                  {deliveryAddress.street || deliveryAddress.fullAddress || deliveryAddress.addressLine1 || 'Standard Address'}
                </p>
                {deliveryAddress.landmark && (
                  <p className="text-textMuted text-[11px] mt-0.5">
                    Landmark: {deliveryAddress.landmark}
                  </p>
                )}
                <p className="text-textMuted text-[11px] mt-0.5">
                  {deliveryAddress.city || 'City'}, {deliveryAddress.state || 'State'} {deliveryAddress.pincode || deliveryAddress.postalCode || deliveryAddress.zipCode || ''}
                </p>
              </div>
            </div>
          </div>

          {/* Assigned Driver & Tracking Card */}
          <div className="glass-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-textPrimary flex items-center gap-2">
                <Truck className="w-4 h-4 text-purpleLight" />
                <span>Assigned Partner</span>
              </h3>
              {trackingBadge && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${trackingBadge.color}`}>
                  {trackingBadge.label}
                </span>
              )}
            </div>

            {assignedDriver ? (
              <div className="text-xs space-y-2 text-textSecondary">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-textPrimary text-sm">{assignedDriver.name}</span>
                  {assignedDriver.phone && (
                    <a href={`tel:${assignedDriver.phone}`} className="text-purpleLight hover:underline text-xs">
                      📞 {assignedDriver.phone}
                    </a>
                  )}
                </div>
                {trackingBadge?.detail && (
                  <p className="text-[11px] text-textMuted">
                    Status: <span className="text-textSecondary">{trackingBadge.detail}</span>
                  </p>
                )}
                {order.assignmentInfo?.mode && (
                  <p className="text-[11px] text-textMuted">
                    Assignment: <span className="font-semibold text-textSecondary uppercase">{order.assignmentInfo.mode}</span> ({order.assignmentInfo.status || 'assigned'})
                  </p>
                )}
              </div>
            ) : (
              <div className="text-xs space-y-2 text-textMuted">
                <p>No delivery partner assigned yet for this order.</p>
                {order.assignmentInfo?.failureReason && (
                  <p className="text-statusDanger text-[11px]">
                    ⚠️ {order.assignmentInfo.failureReason}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Pickup & Delivery Schedule Card */}
          <div className="glass-card p-6 space-y-4">
            <h3 className="text-sm font-bold text-textPrimary flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-400" />
              <span>Schedule Timings</span>
            </h3>

            <div className="text-xs space-y-3">
              <div>
                <span className="text-textMuted text-[11px] uppercase tracking-wider font-semibold">Pickup Date</span>
                <p className="font-semibold text-textPrimary mt-0.5">
                  {order.scheduledPickup?.date
                    ? new Date(order.scheduledPickup.date).toLocaleDateString('en-IN', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    : 'Not specified'}
                </p>
              </div>

              {order.scheduledPickup?.timeSlot?.label && (
                <div>
                  <span className="text-textMuted text-[11px] uppercase tracking-wider font-semibold">Time Slot</span>
                  <p className="font-semibold text-textPrimary mt-0.5">
                    {order.scheduledPickup.timeSlot.label}
                    {order.scheduledPickup.timeSlot.startTime && (
                      <span className="font-normal text-textSecondary ml-1.5">
                        ({order.scheduledPickup.timeSlot.startTime} – {order.scheduledPickup.timeSlot.endTime})
                      </span>
                    )}
                  </p>
                </div>
              )}

              <div>
                <span className="text-textMuted text-[11px] uppercase tracking-wider font-semibold">Order Placed</span>
                <p className="font-medium text-textSecondary mt-0.5">
                  {new Date(order.createdAt || Date.now()).toLocaleString('en-IN', {
                    day: 'numeric', month: 'short', year: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Order Modal */}
      {cancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="w-full max-w-md p-6 rounded-2xl glass-card space-y-4 border border-white/10 shadow-2xl">
            <h3 className="text-base font-bold text-textPrimary">
              Cancel Order #{order._id?.slice(-6).toUpperCase()}
            </h3>
            <p className="text-xs text-textSecondary">
              Are you sure you want to cancel this order? This action will abort processing.
            </p>

            <div>
              <label className="block text-xs font-semibold text-textSecondary mb-1.5">
                Reason for Cancellation
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="E.g., Out of capacity, customer requested, etc."
                rows={3}
                className="w-full p-3 text-xs rounded-xl bg-white/[0.05] border border-white/10 text-textPrimary focus:outline-none focus:border-primaryPurple"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setCancelModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-white/[0.04] text-textSecondary hover:text-textPrimary hover:bg-white/[0.08] transition-colors"
              >
                Go Back
              </button>
              <button
                onClick={() =>
                  statusMutation.mutate({
                    nextStatus: 'cancelled',
                    message: cancelReason || 'Cancelled by store admin',
                  })
                }
                disabled={statusMutation.isPending}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-statusDanger hover:bg-red-600 text-white transition-colors"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Nearby Shared Delivery Partner Dispatch Modal */}
      {assignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="w-full max-w-lg p-6 rounded-2xl glass-card space-y-4 border border-white/10 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-textPrimary">
                  {assignedDriver ? 'Reassign Delivery Partner' : 'Assign Nearby Delivery Partner'}
                </h3>
                <p className="text-xs text-textMuted mt-0.5">
                  Order #{order._id?.slice(-8).toUpperCase()} • Shared partners sorted by distance from pickup
                </p>
              </div>
              <button
                onClick={() => {
                  setAssignModalOpen(false);
                  setDriverToAssign(null);
                }}
                className="text-textMuted hover:text-textPrimary text-xs px-2 py-1 rounded-lg bg-white/[0.04]"
              >
                ✕
              </button>
            </div>

            {nearbyLoading ? (
              <div className="py-12 text-center text-xs text-textMuted">
                Searching for nearby available delivery partners...
              </div>
            ) : nearbyError ? (
              <div className="py-8 text-center space-y-2">
                <p className="text-xs text-statusDanger">
                  {nearbyErr?.response?.data?.message || 'Failed to load nearby drivers'}
                </p>
                <button
                  onClick={() => refetchNearby()}
                  className="btn-primary px-3 py-1.5 text-xs font-semibold"
                >
                  Retry
                </button>
              </div>
            ) : nearbyDrivers.length === 0 ? (
              <div className="py-10 text-center space-y-2">
                <Truck className="w-8 h-8 text-textMuted/40 mx-auto" />
                <p className="text-xs font-bold text-textPrimary">No Available Delivery Partners Nearby</p>
                <p className="text-xs text-textMuted max-w-xs mx-auto">
                  All shared drivers are currently busy or offline. Please check again in a few moments.
                </p>
                <button
                  onClick={() => refetchNearby()}
                  className="px-3 py-1.5 text-xs rounded-xl bg-white/[0.05] border border-white/10 hover:bg-white/[0.1] text-textSecondary"
                >
                  Refresh
                </button>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                {nearbyDrivers.map((driver, index) => {
                  const isCurrent = assignedDriver?._id === driver._id;
                  const isNearest = index === 0 && driver.distance !== null;

                  return (
                    <div
                      key={driver._id}
                      className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                        isNearest
                          ? 'bg-purple-500/[0.08] border-primaryPurple/50'
                          : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04]'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-textPrimary">{driver.name}</span>
                          {isNearest && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                              NEAREST
                            </span>
                          )}
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primaryPurple/15 text-purpleLight border border-primaryPurple/30">
                            {driver.availabilityStatus?.toUpperCase() || 'AVAILABLE'}
                          </span>
                        </div>
                        <p className="text-[11px] text-textMuted flex items-center gap-2">
                          <span>
                            {driver.distance !== null
                              ? `📍 ${driver.distance} km from pickup`
                              : '📍 Location pending'}
                          </span>
                          {driver.phone && <span>• 📞 {driver.phone}</span>}
                        </p>
                      </div>

                      <button
                        onClick={() => setDriverToAssign(driver)}
                        disabled={isCurrent || assignDriverMutation.isPending}
                        className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-colors ${
                          isCurrent
                            ? 'bg-white/[0.04] text-textMuted cursor-default'
                            : 'btn-primary'
                        }`}
                      >
                        {isCurrent ? 'Assigned' : assignedDriver ? 'Reassign' : 'Assign'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => {
                  setAssignModalOpen(false);
                  setDriverToAssign(null);
                }}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-white/[0.04] text-textSecondary hover:text-textPrimary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {driverToAssign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm p-6 rounded-2xl glass-card space-y-4 border border-white/15 shadow-2xl">
            <h3 className="text-base font-bold text-textPrimary">
              {assignedDriver ? 'Confirm Reassignment' : 'Confirm Driver Assignment'}
            </h3>
            <p className="text-xs text-textSecondary leading-relaxed">
              Are you sure you want to assign shared delivery partner{' '}
              <span className="font-bold text-textPrimary">{driverToAssign.name}</span>
              {driverToAssign.distance !== null ? ` (~${driverToAssign.distance} km away)` : ''}{' '}
              to Order #{order._id?.slice(-8).toUpperCase()}?
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setDriverToAssign(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-white/[0.04] text-textSecondary hover:text-textPrimary"
              >
                Cancel
              </button>
              <button
                onClick={() => assignDriverMutation.mutate(driverToAssign._id)}
                disabled={assignDriverMutation.isPending}
                className="btn-primary px-5 py-2 text-xs font-semibold"
              >
                {assignDriverMutation.isPending ? 'Assigning...' : 'Yes, Assign Driver'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrderDetail;
