import axiosInstance from './axios';

/**
 * Fetch notifications for authenticated user (or platform-wide for SuperAdmin)
 */
export const getNotificationsApi = async (params = {}) => {
  const response = await axiosInstance.get('/notifications', { params });
  return response.data;
};

/**
 * Fetch unread notification count
 */
export const getUnreadCountApi = async () => {
  const response = await axiosInstance.get('/notifications/unread-count');
  return response.data;
};

/**
 * Mark a single notification as read
 */
export const markNotificationAsReadApi = async (id) => {
  const response = await axiosInstance.put(`/notifications/${id}/read`);
  return response.data;
};

/**
 * Mark all notifications as read
 */
export const markAllNotificationsAsReadApi = async () => {
  const response = await axiosInstance.put('/notifications/read-all');
  return response.data;
};

/**
 * Delete a notification
 */
export const deleteNotificationApi = async (id) => {
  const response = await axiosInstance.delete(`/notifications/${id}`);
  return response.data;
};
