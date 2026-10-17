import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, User, Store, CreditCard,
  RefreshCw, Layers, Truck, Calendar,
} from 'lucide-react';
import { OrderStatusBadge } from './OrderStatusBadge';
import { useOrderDetails } from '../../../hooks/useOrders';
import { formatIndianCurrency } from '../../../utils/formatters';

const METHOD_LABELS = { razorpay: 'Razorpay', cod: 'Cash on Delivery', upi: 'UPI' };
const METHOD_ICONS = { razorpay: '💳', cod: '💵', upi: '📱' };

const formatDate = (d) =>
  d
    ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '—';

const Row = ({ label, value, mono = false }) =>
  value ? (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-slate-100 last:border-0">
      <span className="text-[11px] text-slate-500 font-medium whitespace-nowrap">{label}</span>
      <span className={`text-xs text-slate-900 text-right ${mono ? 'font-mono' : 'font-medium'}`}>{value}</span>
    </div>
  ) : null;

const SectionTitle = ({ icon: Icon, label, iconClass }) => (
  <div className="flex items-center gap-2 mb-2.5 mt-5 first:mt-0">
    <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${iconClass}`}>
      <Icon className="w-3.5 h-3.5" />
    </div>
    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{label}</span>
  </div>
);

/**
 * OrderDetailsDrawer — Shows complete platform order details.
 * Data source: GET /api/super-admin/orders/:id
 */
export const OrderDetailsDrawer = ({ orderId, order: initialOrder, isOpen, onClose }) => {
  const drawerRef = useRef(null);

  const targetId = orderId || initialOrder?._id;
  const { data: fetchedOrder, isLoading } = useOrderDetails(isOpen ? targetId : null);

  const order = fetchedOrder || initialOrder;

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handle = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handle);
    return () => document.removeEventListener('keydown', handle);
  }, [isOpen, onClose]);

  // Trap scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  // Derived values from order object
  const shortId = order?._id ? `#${String(order._id).slice(-6).toUpperCase()}` : '—';
  const customerName = order?.user?.name || '—';
  const customerPhone = order?.user?.phone || null;
  const customerEmail = order?.user?.email || null;
  const laundryName = order?.laundryId?.name || '—';
  const laundryCity = order?.laundryId?.city || null;
  const laundryAddress = order?.laundryId?.address || null;
  const orderStatus = order?.status || 'pending';
  const totalAmount = order?.totalAmount ?? 0;
  const commissionAmount = order?.commissionAmount ?? 0;
  const laundryEarning = order?.laundryEarning ?? 0;
  const method = METHOD_LABELS[order?.paymentMethod] || order?.paymentMethod || '—';
  const methodIcon = METHOD_ICONS[order?.paymentMethod] || '💳';
  const isPaid = Boolean(order?.isPaid);
  const paymentStatus = isPaid ? 'Paid' : 'Unpaid';
  const createdDate = order?.createdAt;
  const deliveryPartnerName = order?.deliveryPartner?.name || null;
  const servicesList = order?.services || [];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="drawer-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50"
            aria-hidden="true"
          />

          {/* Drawer Panel */}
          <motion.div
            key="drawer-panel"
            ref={drawerRef}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
            className="fixed right-0 top-0 h-full w-full max-w-[480px] bg-white border-l border-slate-200 shadow-2xl z-50 flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-label="Order Details"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4 px-5 pt-5 pb-4 border-b border-slate-200 bg-slate-50/70 flex-shrink-0">
              <div>
                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-0.5">Order Details</p>
                <h2 className="text-lg font-bold text-slate-900 font-mono">{shortId}</h2>
                <p className="text-xs text-slate-500 mt-0.5">{formatDate(createdDate)}</p>
              </div>
              <button
                onClick={onClose}
                id="order-drawer-close"
                className="w-8 h-8 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-all flex-shrink-0 mt-0.5 shadow-2xs"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-1">
              {isLoading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3">
                  <div className="w-8 h-8 rounded-full border-2 border-blue-600/30 border-t-blue-600 animate-spin" />
                  <p className="text-xs text-slate-500 font-medium">Loading order details...</p>
                </div>
              ) : (
                <>
                  {/* Status Badge Row */}
                  <div className="flex items-center gap-2 mb-2">
                    <OrderStatusBadge status={orderStatus} />
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                      isPaid
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {paymentStatus}
                    </span>
                  </div>

                  {/* ── Customer Info ─── */}
                  <SectionTitle icon={User} label="Customer" iconClass="bg-blue-50 text-blue-600 border border-blue-100" />
                  <div className="bg-slate-50/70 rounded-xl border border-slate-200/80 px-4 py-1 divide-y divide-slate-100">
                    <Row label="Name" value={customerName} />
                    {customerPhone && <Row label="Phone" value={customerPhone} />}
                    {customerEmail && <Row label="Email" value={customerEmail} />}
                  </div>

                  {/* ── Laundry Info ─── */}
                  <SectionTitle icon={Store} label="Laundry" iconClass="bg-indigo-50 text-indigo-600 border border-indigo-100" />
                  <div className="bg-slate-50/70 rounded-xl border border-slate-200/80 px-4 py-1 divide-y divide-slate-100">
                    <Row label="Name" value={laundryName} />
                    {laundryCity && <Row label="City" value={laundryCity} />}
                    {laundryAddress && <Row label="Address" value={laundryAddress} />}
                  </div>

                  {/* ── Services Breakdown ─── */}
                  {servicesList.length > 0 && (
                    <>
                      <SectionTitle icon={Layers} label="Services / Items" iconClass="bg-sky-50 text-sky-600 border border-sky-100" />
                      <div className="bg-slate-50/70 rounded-xl border border-slate-200/80 p-3 space-y-2">
                        {servicesList.map((item, idx) => {
                          const sName = item.service?.name || item.name || `Service ${idx + 1}`;
                          const qty = item.quantity || 1;
                          const price = item.price || item.service?.price || 0;
                          const lineTotal = item.lineTotal || qty * price;
                          return (
                            <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-slate-200/60 last:border-0">
                              <div>
                                <p className="font-semibold text-slate-900">{sName}</p>
                                <p className="text-[10px] text-slate-500">{qty} × {formatIndianCurrency(price)}</p>
                              </div>
                              <span className="font-bold text-slate-900">{formatIndianCurrency(lineTotal)}</span>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}

                  {/* ── Payment & Earnings Split ─── */}
                  <SectionTitle icon={CreditCard} label="Financial Breakdown" iconClass="bg-emerald-50 text-emerald-600 border border-emerald-100" />
                  <div className="bg-slate-50/70 rounded-xl border border-slate-200/80 px-4 py-1 divide-y divide-slate-100">
                    {order?.subtotal > 0 && <Row label="Services Subtotal" value={formatIndianCurrency(order.subtotal)} />}
                    {order?.deliveryFee !== undefined && <Row label="Delivery Fee" value={order.deliveryFee === 0 ? "FREE" : formatIndianCurrency(order.deliveryFee)} />}
                    {order?.gst > 0 && <Row label="GST (5%)" value={formatIndianCurrency(order.gst)} />}
                    <Row label="Total Amount" value={formatIndianCurrency(totalAmount)} />
                    <Row label="Platform Commission" value={formatIndianCurrency(commissionAmount)} />
                    <Row label="Laundry Earning" value={formatIndianCurrency(laundryEarning)} />
                    <Row label="Payment Method" value={`${methodIcon} ${method}`} />
                    <Row label="Payment Status" value={paymentStatus} />
                  </div>

                  {/* ── Delivery Partner Info ─── */}
                  {deliveryPartnerName && (
                    <>
                      <SectionTitle icon={Truck} label="Delivery Partner" iconClass="bg-amber-50 text-amber-600 border border-amber-100" />
                      <div className="bg-slate-50/70 rounded-xl border border-slate-200/80 px-4 py-1 divide-y divide-slate-100">
                        <Row label="Assigned Partner" value={deliveryPartnerName} />
                      </div>
                    </>
                  )}

                  {/* ── Timestamps ─── */}
                  <SectionTitle icon={Calendar} label="Timestamps" iconClass="bg-violet-50 text-violet-600 border border-violet-100" />
                  <div className="bg-slate-50/70 rounded-xl border border-slate-200/80 px-4 py-1 divide-y divide-slate-100">
                    <Row label="Placed At" value={formatDate(order?.createdAt)} />
                    {order?.estimatedDelivery && <Row label="Est. Delivery" value={formatDate(order.estimatedDelivery)} />}
                    {order?.deliveredAt && <Row label="Delivered At" value={formatDate(order.deliveredAt)} />}
                  </div>

                  {/* ── Note ─── */}
                  <div className="bg-blue-50/60 rounded-xl border border-blue-200/60 px-4 py-3 flex items-start gap-3 mt-3">
                    <RefreshCw className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-900 leading-relaxed">
                      Order status transitions and delivery partner assignments are handled directly by the Laundry Admin.
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-slate-200 bg-slate-50/60 flex-shrink-0">
              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-sm font-semibold text-slate-700 hover:text-slate-900 shadow-2xs transition-all"
              >
                Close
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default OrderDetailsDrawer;
