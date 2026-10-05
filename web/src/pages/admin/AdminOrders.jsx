import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Package,
  Search,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { adminApi } from '../../api/adminApi';
import { ROUTES } from '../../routes/routeConstants';

const STATUS_TABS = [
  { key: 'all', label: 'All Orders' },
  { key: 'pending', label: 'Pending Pickup' },
  { key: 'picked_up', label: 'Picked Up' },
  { key: 'at_laundry_pending_confirmation', label: 'Handoff Pending' },
  { key: 'received_at_laundry', label: 'Received' },
  { key: 'in_progress', label: 'Processing' },
  { key: 'ready', label: 'Ready' },
  { key: 'out_for_delivery', label: 'Out for Delivery' },
  { key: 'delivery_pending_customer_confirmation', label: 'Pending Customer' },
  { key: 'returned_to_laundry', label: 'Returned' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'cancelled', label: 'Cancelled' },
];

export const AdminOrders = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const activeTab = searchParams.get('status') || 'all';
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const limit = 15;

  const handleTabChange = (tabKey) => {
    setSearchParams(tabKey === 'all' ? {} : { status: tabKey });
    setPage(1);
  };

  // Fetch orders from backend
  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders', activeTab, page],
    queryFn: () => adminApi.getOrders({ status: activeTab, page, limit }),
    refetchInterval: 1000 * 30,
  });

  // Quick status update mutation
  const statusMutation = useMutation({
    mutationFn: ({ id, nextStatus }) =>
      adminApi.updateOrderStatus(id, { status: nextStatus }),
    onSuccess: (updatedOrder) => {
      toast.success(`Order status updated to ${updatedOrder.status?.replace(/_/g, ' ')}`);
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update order status');
    },
  });

  const orders = data?.orders || data?.data || [];
  const total = data?.total || orders.length;
  const totalPages = data?.pages || Math.max(1, Math.ceil(total / limit));

  // Client search filter
  const filteredOrders = orders.filter((order) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const id = (order._id || '').toLowerCase();
    const custName = (order.user?.name || order.customerId?.name || '').toLowerCase();
    const phone = (order.user?.phone || order.customerId?.phone || '').toLowerCase();
    return id.includes(q) || custName.includes(q) || phone.includes(q);
  });

  const getNextStatusAction = (currentStatus) => {
    switch (currentStatus) {
      case 'at_laundry_pending_confirmation':
        return { next: 'received_at_laundry', label: 'Confirm Received', icon: CheckCircle2 };
      case 'received_at_laundry':
        return { next: 'in_progress', label: 'Start Processing', icon: Clock };
      case 'in_progress':
        return { next: 'ready', label: 'Mark Ready', icon: CheckCircle2 };
      case 'returned_to_laundry':
        return { next: 'ready_for_redelivery', label: 'Ready for Redelivery', icon: Clock };
      default:
        return null;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            PENDING PICKUP
          </span>
        );
      case 'picked_up':
      case 'at_laundry_pending_confirmation':
      case 'received_at_laundry':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/15 text-blue-300 border border-blue-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            {status.replace(/_/g, ' ').toUpperCase()}
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            PROCESSING
          </span>
        );
      case 'ready':
      case 'ready_for_redelivery':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
            {status.replace(/_/g, ' ').toUpperCase()}
          </span>
        );
      case 'out_for_delivery':
      case 'delivery_pending_customer_confirmation':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            {status.replace(/_/g, ' ').toUpperCase()}
          </span>
        );
      case 'returned_to_laundry':
      case 'customer_unavailable':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-orange-500/15 text-orange-300 border border-orange-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
            {status.replace(/_/g, ' ').toUpperCase()}
          </span>
        );
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            DELIVERED
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-red-500/15 text-red-300 border border-red-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
            CANCELLED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/10 text-textSecondary border border-white/10">
            {status?.toUpperCase() || 'UNKNOWN'}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-textPrimary">
            Orders Management
          </h1>
          <p className="text-xs text-textMuted mt-1">
            Track customer shipments, handle lifecycle state machine, and dispatch drivers
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-textMuted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by ID, customer name, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-white/[0.04] border border-white/10 text-textPrimary placeholder-textMuted focus:outline-none focus:border-primaryPurple focus:ring-1 focus:ring-primaryPurple transition-all"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {STATUS_TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`px-3.5 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-primaryPurple to-brandIndigo text-white shadow-glowPurple'
                  : 'bg-white/[0.03] hover:bg-white/[0.06] text-textSecondary hover:text-textPrimary border border-white/[0.07]'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Orders Table Container */}
      <div className="glass-card p-6">
        {isLoading ? (
          <div className="py-16 text-center text-xs text-textMuted">Loading orders...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-16 text-center">
            <Package className="w-10 h-10 text-textMuted/40 mx-auto mb-3" />
            <p className="text-sm font-semibold text-textPrimary">No orders found</p>
            <p className="text-xs text-textMuted mt-1">
              {searchQuery ? 'Try matching another search keyword.' : `No orders currently marked as ${activeTab}.`}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-white/[0.07] text-[11px] font-semibold text-textMuted uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-3">Order ID</th>
                  <th className="py-3 px-3">Customer</th>
                  <th className="py-3 px-3">Schedule</th>
                  <th className="py-3 px-3">Items</th>
                  <th className="py-3 px-3">Total</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04] text-textSecondary">
                {filteredOrders.map((order) => {
                  const idShort = order._id ? `#${order._id.slice(-6).toUpperCase()}` : '#ORDER';
                  const customer = order.user || order.customerId || {};
                  const total = order.totalAmount || order.pricing?.total || 0;
                  const dateStr = order.createdAt
                    ? new Date(order.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    : 'Recent';
                  const slotStr = order.pickupSlot || order.pickupTime || 'Standard Slot';
                  const nextAction = getNextStatusAction(order.status);

                  return (
                    <tr
                      key={order._id}
                      className="hover:bg-white/[0.03] transition-colors"
                    >
                      <td className="py-3.5 px-3 font-mono font-bold text-textPrimary">
                        {idShort}
                      </td>

                      <td className="py-3.5 px-3">
                        <div className="font-semibold text-textPrimary">
                          {customer.name || 'Valued Customer'}
                        </div>
                        <div className="text-[11px] text-textMuted">
                          {customer.phone || 'No phone'}
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        <div className="font-medium text-textPrimary">{dateStr}</div>
                        <div className="text-[11px] text-textMuted">{slotStr}</div>
                      </td>

                      <td className="py-3.5 px-3">
                        <span className="font-medium text-textSecondary">
                          {order.items?.length || 0} items
                        </span>
                      </td>

                      <td className="py-3.5 px-3 font-bold text-textPrimary">
                        ₹{Number(total).toLocaleString('en-IN')}
                      </td>

                      <td className="py-3.5 px-3">{getStatusBadge(order.status)}</td>

                      <td className="py-3.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {nextAction && (
                            <button
                              onClick={() =>
                                statusMutation.mutate({
                                  id: order._id,
                                  nextStatus: nextAction.next,
                                })
                              }
                              disabled={statusMutation.isPending}
                              className="px-3 py-1 text-xs font-semibold rounded-lg bg-primaryPurple/20 hover:bg-primaryPurple/30 text-purpleLight border border-primaryPurple/35 transition-colors disabled:opacity-50"
                            >
                              {nextAction.label}
                            </button>
                          )}

                          <button
                            onClick={() => navigate(`${ROUTES.ADMIN.ORDERS}/${order._id}`)}
                            className="p-1.5 text-textMuted hover:text-textPrimary hover:bg-white/[0.06] rounded-lg transition-colors"
                            title="View Full Order Details"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-5 mt-4 border-t border-white/[0.07] text-xs">
            <span className="text-textMuted">
              Page {page} of {totalPages} ({total} total orders)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 disabled:opacity-40 text-textSecondary hover:text-textPrimary transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Prev</span>
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 disabled:opacity-40 text-textSecondary hover:text-textPrimary transition-colors"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminOrders;
