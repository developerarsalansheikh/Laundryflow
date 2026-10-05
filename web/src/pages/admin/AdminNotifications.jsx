import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  Package,
  AlertCircle,
  Clock,
  Info,
  ExternalLink,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { adminApi } from '../../api/adminApi';
import { ROUTES } from '../../routes/routeConstants';

export const AdminNotifications = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('all'); // 'all' | 'unread'

  // Fetch notifications
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['admin-notifications'],
    queryFn: adminApi.getNotifications,
    refetchInterval: 1000 * 30,
  });

  // Mutation: Mark single as read
  const markReadMutation = useMutation({
    mutationFn: (id) => adminApi.markNotificationRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['admin-notifications-count'] });
    },
  });

  // Mutation: Mark all as read
  const markAllReadMutation = useMutation({
    mutationFn: adminApi.markAllNotificationsRead,
    onSuccess: () => {
      toast.success('All notifications marked as read');
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['admin-notifications-count'] });
    },
    onError: () => {
      toast.error('Failed to mark all as read');
    },
  });

  const unreadCount = notifications.filter((n) => !n.isRead && !n.read).length;

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread') return !n.isRead && !n.read;
    return true;
  });

  const handleNotificationClick = (item) => {
    const isRead = item.isRead || item.read;
    if (!isRead) {
      markReadMutation.mutate(item._id);
    }
    const targetOrderId = item.orderId || item.data?.orderId || item.metadata?.orderId;
    if (targetOrderId) {
      navigate(`${ROUTES.ADMIN.ORDERS}/${targetOrderId}`);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'order':
      case 'new_order':
        return <Package className="w-4 h-4 text-purpleLight" />;
      case 'alert':
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-amber-400" />;
      default:
        return <Info className="w-4 h-4 text-blue-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-textPrimary">
              Store Notifications
            </h1>
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {unreadCount} new
              </span>
            )}
          </div>
          <p className="text-xs text-textMuted mt-1">
            Store alerts, incoming customer orders, and logistics updates
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-white/[0.04] text-textSecondary hover:text-textPrimary hover:bg-white/[0.08] border border-white/10 transition-colors disabled:opacity-50"
          >
            <CheckCheck className="w-4 h-4 text-purpleLight" />
            <span>Mark All as Read</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-white/[0.07]">
        <button
          onClick={() => setFilter('all')}
          className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 ${
            filter === 'all'
              ? 'border-primaryPurple text-purpleLight shadow-[0_2px_0_0_#7C3AED]'
              : 'border-transparent text-textMuted hover:text-textPrimary'
          }`}
        >
          All Activity ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 ${
            filter === 'unread'
              ? 'border-primaryPurple text-purpleLight shadow-[0_2px_0_0_#7C3AED]'
              : 'border-transparent text-textMuted hover:text-textPrimary'
          }`}
        >
          Unread Only ({unreadCount})
        </button>
      </div>

      {/* Notifications List Container */}
      <div className="glass-card p-6">
        {isLoading ? (
          <div className="py-20 text-center text-xs text-textMuted">Loading notifications...</div>
        ) : filteredNotifications.length === 0 ? (
          <div className="py-16 text-center">
            <Bell className="w-10 h-10 text-textMuted/40 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-textPrimary">All Caught Up!</h3>
            <p className="text-xs text-textMuted mt-1">
              {filter === 'unread'
                ? 'No unread notifications at this time.'
                : 'No store notifications recorded yet.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {filteredNotifications.map((item) => {
              const isRead = item.isRead || item.read;
              const hasOrderLink = item.orderId || item.data?.orderId || item.metadata?.orderId;

              return (
                <div
                  key={item._id}
                  onClick={() => handleNotificationClick(item)}
                  className={`py-4 px-3 rounded-xl flex items-start justify-between gap-3.5 cursor-pointer transition-all ${
                    !isRead
                      ? 'bg-primaryPurple/10 hover:bg-primaryPurple/15'
                      : 'hover:bg-white/[0.02]'
                  }`}
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10 shadow-sm mt-0.5 flex-shrink-0">
                      {getIcon(item.type)}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-textPrimary">
                          {item.title || 'Store Notification'}
                        </h4>
                        {!isRead && (
                          <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)] flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-textSecondary mt-0.5 leading-relaxed">
                        {item.message || item.body}
                      </p>
                      <div className="flex items-center gap-2 mt-2 text-[11px] text-textMuted">
                        <Clock className="w-3 h-3" />
                        <span>
                          {item.createdAt
                            ? new Date(item.createdAt).toLocaleString('en-IN')
                            : 'Just now'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {hasOrderLink && (
                    <div className="flex-shrink-0 text-purpleLight p-1">
                      <ExternalLink className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminNotifications;
