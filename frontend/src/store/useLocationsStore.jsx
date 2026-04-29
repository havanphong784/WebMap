import { create } from 'zustand';

const BASE_URL = 'http://localhost:3000/api';

export const useLocationStore = create((set) => ({
  locations: [],
  routeData: null,
  routeLoading: false,
  isLoading: false,

  fetchLocations: async (userId, bounds) => {
    if (!bounds) return;
    set({ isLoading: true });
    try {
      const params = new URLSearchParams({
        user_id: userId || "",
        minLng: bounds.getWest(),
        maxLng: bounds.getEast(),
        minLat: bounds.getSouth(),
        maxLat: bounds.getNorth()
      });
      const response = await fetch(`${BASE_URL}/locations?${params.toString()}`);
      const result = await response.json();
      if (result.success) {
        set({ locations: result.data, isLoading: false });
      }
    } catch (error) {
      console.error("Lỗi Fetch Data:", error);
      set({ isLoading: false });
    }
  },

  addLocation: async (locationData) => {
    set({ isLoading: true });
    try {
      const response = await fetch(`${BASE_URL}/locations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(locationData)
      });
      const result = await response.json();

      if (result.success) {
        set((state) => ({
          locations: [result.data, ...state.locations]
        }));
      }
      set({ isLoading: false });
    } catch (error) {
      console.error("Lỗi Lưu Data:", error);
      set({ isLoading: false });
    }
  },

  setRouteLoading: (routeLoading) => set({ routeLoading }),

  fetchRoute: async (start, end) => {
    set({ routeLoading: true, routeData: null });
    try {
      // Sử dụng overview=simplified để giảm dung lượng dữ liệu truyền tải, giúp load nhanh hơn
      const url = `https://router.project-osrm.org/route/v1/driving/${start[0]},${start[1]};${end[0]},${end[1]}?overview=simplified&geometries=geojson`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.code === 'Ok') {
        set({ routeData: data.routes[0].geometry });
      }
    } catch (error) {
      console.error("Lỗi lấy đường đi:", error);
    } finally {
      set({ routeLoading: false });
    }
  },


  clearRoute: () => set({ routeData: null }),

  toggleLike: async (locationId, userId) => {
    try {
      const response = await fetch(`${BASE_URL}/likes/${locationId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId })
      });
      const result = await response.json();

      if (result.success) {
        set((state) => ({
          locations: state.locations.map(loc =>
            loc.id === locationId
              ? {
                ...loc,
                is_liked: result.action === 'liked',
                likes_count: result.action === 'liked' ? Number(loc.likes_count || 0) + 1 : Number(loc.likes_count || 0) - 1
              }
              : loc
          )
        }));
      }
    } catch (err) {
      console.error(err);
    }
  },

  postComment: async (locationId, userId, content) => {
    try {
      const response = await fetch(`${BASE_URL}/comments/${locationId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, content })
      });
      const result = await response.json();

      if (result.success) {
        set((state) => ({
          locations: state.locations.map(loc =>
            loc.id === locationId
              ? { ...loc, comments_count: Number(loc.comments_count || 0) + 1 }
              : loc
          )
        }));
      }
      return result;
    } catch (err) {
      console.error(err);
    }
  }
}));

