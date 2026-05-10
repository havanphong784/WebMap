import {create} from "zustand";
import {apiClient} from "../../../shared/api/apiClient.js";

const getErrorMessage = (response, fallback = "Không thể tải thông báo") =>
  response?.message || response?.error?.message || fallback;

export const useNotificationStore = create((set) => ({
  notifications: [],
  loading: false,
  error: null,
  unreadCount: 0,

  fetchNotifications: async (userId, silent = false) => {
    if (!userId) return;
    if (!silent) set({loading: true, error: null});
    try {
      const response = await apiClient.get(`/notifications/user/${userId}`);
      if (response.success) {
        set({
          notifications: response.data,
          unreadCount: response.data.filter(n => !n.is_read).length,
          error: null,
        });
      } else if (!silent) {
        set({error: getErrorMessage(response)});
      }
    } catch (error) {
      console.error("Lỗi fetch thông báo:", error);
      if (!silent) set({error: error.message});
    } finally {
      if (!silent) set({loading: false});
    }
  },

  markRead: async (notifId, userId) => {
    try {
      const response = await apiClient.put(`/notifications/${notifId}/read`, {user_id: userId});
      if (response?.success === false) return response;

      set(state => ({
        notifications: state.notifications.map(n =>
          n.id === notifId ? {...n, is_read: true} : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1)
      }));
      return response;
    } catch (error) {
      console.error(error);
      return {success: false, message: error.message};
    }
  },

  markAllRead: async (userId) => {
    try {
      const response = await apiClient.put(`/notifications/read-all`, {user_id: userId});
      if (response?.success === false) return response;

      set(state => ({
        notifications: state.notifications.map(n => ({...n, is_read: true})),
        unreadCount: 0
      }));
      return response;
    } catch (error) {
      console.error(error);
      return {success: false, message: error.message};
    }
  }
}));
