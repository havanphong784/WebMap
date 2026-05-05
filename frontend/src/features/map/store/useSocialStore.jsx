import { create } from "zustand";
import { apiClient } from "../../../shared/api/apiClient.js";

export const useSocialStore = create((set) => ({
  activeUsers: [],
  isLoading: false,

  fetchActiveUsers: async () => {
    set({ isLoading: true });
    try {
      const result = await apiClient.get("/auth/active");
      if (result.success) {
        set({ activeUsers: result.data, isLoading: false });
      }
    } catch (error) {
      console.error("Lỗi fetch active users:", error);
      set({ isLoading: false });
    }
  },

  sendHeartbeat: async () => {
    try {
      await apiClient.post("/auth/heartbeat", {});
    } catch (error) {
      console.error("Lỗi gửi heartbeat:", error);
    }
  },
}));
