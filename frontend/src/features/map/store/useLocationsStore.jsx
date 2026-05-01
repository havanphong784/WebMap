import {create} from "zustand";
import {apiClient} from "../../../shared/api/apiClient.js";

export const useLocationStore = create((set) => ({
  locations: [],
  routeData: null,
  routeLoading: false,
  isLoading: false,

  setRouteData: (state) => (set({routeData: state})),

  fetchLocations: async (userId, bounds) => {
    if (!bounds) return;
    set({isLoading: true});
    try {
      const params = new URLSearchParams({
        user_id: userId || "",
        minLng: bounds.getWest(),
        maxLng: bounds.getEast(),
        minLat: bounds.getSouth(),
        maxLat: bounds.getNorth()
      });
      const result = await apiClient.get(`/locations?${params.toString()}`);
      if (result.success) {
        set({locations: result.data, isLoading: false});
      }
    } catch (error) {
      console.error(error);
      set({isLoading: false});
    }
  },

  addLocation: async (locationData) => {
    set({isLoading: true});
    try {
      const result = await apiClient.post("/locations", locationData);

      if (result.success) {
        set((state) => ({
          locations: [result.data, ...state.locations]
        }));
      }
      set({isLoading: false});
    } catch (error) {
      console.error(error);
      set({isLoading: false});
    }
  },

  setRouteLoading: (routeLoading) => set({routeLoading}),

  fetchRoute: async (start, end) => {
    set({routeLoading: true, routeData: null});
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${start[0]},${start[1]};${end[0]},${end[1]}?overview=simplified&geometries=geojson`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.code === 'Ok') {
        set({routeData: data.routes[0].geometry});
      }
    } catch (error) {
      console.error(error);
    } finally {
      set({routeLoading: false});
    }
  },

  clearRoute: () => set({routeData: null}),

  toggleLike: async (locationId, userId) => {
    try {
      const result = await apiClient.post(`/likes/${locationId}/like`, {user_id: userId});

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
      const result = await apiClient.post(`/comments/${locationId}/comments`, {user_id: userId, content});

      if (result.success) {
        set((state) => ({
          locations: state.locations.map(loc =>
            loc.id === locationId
              ? {...loc, comments_count: Number(loc.comments_count || 0) + 1}
              : loc
          )
        }));
      }
      return result;
    } catch (err) {
      console.error(err);
    }
  },

  removeLocation: async (locationId, userId) => {
    try {
      const result = await apiClient.delete(`/locations/${locationId}`, {user_id: userId});
      if (result.success) {
        set((state) => ({
          locations: state.locations.filter(loc => loc.id !== locationId)
        }));
      }
      return result;
    } catch (err) {
      console.error(err);
    }
  }
}));


