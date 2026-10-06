import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getNotificationsApi,
  getUnreadCountApi,
  markNotificationAsReadApi,
  markAllNotificationsAsReadApi,
  deleteNotificationApi,
} from '../api/notifications';

const NOTIFICATIONS_KEY = ['notifications'];
const UNREAD_COUNT_KEY = ['notifications', 'unread-count'];

/**
 * useNotifications — real database notifications with polling / reactive cache.
 */
export const useNotifications = (params = { limit: 10 }) => {
  return useQuery({
    queryKey: [...NOTIFICATIONS_KEY, params],
    queryFn: () => getNotificationsApi(params),
    staleTime: 30 * 1000,
    refetchInterval: 45 * 1000,
  });
};

/**
 * useUnreadNotificationCount — live unread badge count from DB.
 */
export const useUnreadNotificationCount = () => {
  return useQuery({
    queryKey: UNREAD_COUNT_KEY,
    queryFn: getUnreadCountApi,
    staleTime: 20 * 1000,
    refetchInterval: 30 * 1000,
  });
};

/**
 * useMarkNotificationAsRead — mutation to mark single notification as read.
 */
export const useMarkNotificationAsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markNotificationAsReadApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
      queryClient.invalidateQueries({ queryKey: UNREAD_COUNT_KEY });
    },
  });
};

/**
 * useMarkAllNotificationsAsRead — mutation to mark all notifications as read.
 */
export const useMarkAllNotificationsAsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markAllNotificationsAsReadApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
      queryClient.invalidateQueries({ queryKey: UNREAD_COUNT_KEY });
    },
  });
};

/**
 * useDeleteNotification — mutation to delete notification.
 */
export const useDeleteNotification = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteNotificationApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
      queryClient.invalidateQueries({ queryKey: UNREAD_COUNT_KEY });
    },
  });
};
