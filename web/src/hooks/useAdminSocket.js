import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { webSocketService } from '../services/socketService';
import { useAuthStore } from '../store/authStore';

/**
 * Custom hook to subscribe Admin Web application to real-time laundry events.
 * Automatically handles multi-tenant isolation, room joins, and TanStack query invalidation.
 */
export const useAdminSocket = () => {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const laundryId = user?.laundryId?._id || user?.laundryId;

  useEffect(() => {
    if (!laundryId) return;

    webSocketService.connect();
    const laundryRoom = `laundry:${laundryId}`;
    webSocketService.joinRoom(laundryRoom);

    // 1. Order Created
    const unsubCreated = webSocketService.on('order:created', (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-recent-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dispatch-orders'] });

      const orderNum = data?.orderId ? `#${String(data.orderId).slice(-6).toUpperCase()}` : 'New';
      toast.success(`New order received: ${orderNum}`, { id: `order-created-${data?.orderId}` });
    });

    // 2. Order Status Changed
    const unsubStatus = webSocketService.on('order:statusChanged', (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-recent-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dispatch-orders'] });
      if (data?.orderId) {
        queryClient.invalidateQueries({ queryKey: ['admin-order-detail', data.orderId] });
      }
    });

    // 3. Order Assigned
    const unsubAssigned = webSocketService.on('order:assigned', (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-delivery-partners'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dispatch-orders'] });
      if (data?.orderId) {
        queryClient.invalidateQueries({ queryKey: ['admin-order-detail', data.orderId] });
      }
    });

    // 4. Order Cancelled
    const unsubCancelled = webSocketService.on('order:cancelled', (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-recent-orders'] });
      if (data?.orderId) {
        queryClient.invalidateQueries({ queryKey: ['admin-order-detail', data.orderId] });
      }
    });

    // 5. Driver Availability Changed
    const unsubAvailability = webSocketService.on('driver:availabilityChanged', () => {
      queryClient.invalidateQueries({ queryKey: ['admin-delivery-partners'] });
      queryClient.invalidateQueries({ queryKey: ['admin-nearby-drivers'] });
    });

    // 6. Driver Location Updated
    const unsubLocation = webSocketService.on('driver:locationUpdated', () => {
      queryClient.invalidateQueries({ queryKey: ['admin-nearby-drivers'] });
    });

    return () => {
      unsubCreated();
      unsubStatus();
      unsubAssigned();
      unsubCancelled();
      unsubAvailability();
      unsubLocation();
      webSocketService.leaveRoom(laundryRoom);
    };
  }, [laundryId, queryClient]);
};

export default useAdminSocket;
