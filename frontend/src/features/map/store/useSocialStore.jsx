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
      console.error("Loi fetch active users:", error);
      set({ isLoading: false });
    }
  },

  sendHeartbeat: async (location) => {
    try {
      const [lng, lat] = Array.isArray(location) ? location : [];
      await apiClient.post("/auth/heartbeat", {
        location: Number.isFinite(lat) && Number.isFinite(lng) ? {lat, lng} : undefined,
      });
    } catch (error) {
      console.error("Loi gui heartbeat:", error);
    }
  },
}));
