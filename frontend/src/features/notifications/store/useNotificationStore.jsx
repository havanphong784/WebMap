import { create } from "zustand";
import { apiClient } from "../../../shared/api/apiClient.js";

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  loading: false,
  unreadCount: 0,

  fetchNotifications: async (userId) => {
    if (!userId) return;
    set({ loading: true });
    try {
      const response = await apiClient.get(`/notifications/user/${userId}`);
      if (response.success) {
        set({ 
          notifications: response.data,
          unreadCount: response.data.filter(n => !n.is_read).length
        });
      }
    } catch (error) {
      console.error("Lỗi fetch thông báo:", error);
    } finally {
      set({ loading: false });
    }
  },

  markRead: async (notifId, userId) => {
    try {
      await apiClient.put(`/notifications/${notifId}/read`, { user_id: userId });
      set(state => ({
        notifications: state.notifications.map(n => 
          n.id === notifId ? { ...n, is_read: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1)
      }));
    } catch (error) {
      console.error(error);
    }
  },

  markAllRead: async (userId) => {
    try {
      await apiClient.put(`/notifications/read-all`, { user_id: userId });
      set(state => ({
        notifications: state.notifications.map(n => ({ ...n, is_read: true })),
        unreadCount: 0
      }));
    } catch (error) {
      console.error(error);
    }
  }
}));
