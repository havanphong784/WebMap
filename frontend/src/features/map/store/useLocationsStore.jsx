import {create} from "zustand";
import {apiClient} from "../../../shared/api/apiClient.js";

export const useLocationStore = create((set) => ({
  locations: [],
  trendingLocations: [],
  followingLocations: [],
  userLocations: [],
  routeData: null,
  routeLoading: false,
  isLoading: false,
  tags: [],
  userLocation: null,
  accuracy: null,

  setUserLocation: (loc) => set({userLocation: loc}),
  setAccuracy: (acc) => set({accuracy: acc}),
  setRouteData: (state) => (set({routeData: state})),

  fetchTrending: async (userId) => {
    set({isLoading: true});
    try {
      const result = await apiClient.get(`/locations/trending?user_id=${userId || "guest"}`);
      if (result.success) {
        set({trendingLocations: result.data, isLoading: false});
      }
    } catch (error) {
      console.error(error);
      set({isLoading: false});
    }
  },

  fetchFollowing: async (userId) => {
    if (!userId) return;
    set({isLoading: true});
    try {
      const result = await apiClient.get(`/locations/following?user_id=${userId}`);
      if (result.success) {
        set({followingLocations: result.data, isLoading: false});
      }
    } catch (error) {
      console.error(error);
      set({isLoading: false});
    }
  },

  fetchUniqueTags: async () => {
    try {
      const result = await apiClient.get("/locations/tags");
      if (result.success) {
        set({tags: result.data});
      }
    } catch (error) {
      console.error("Lỗi fetch tags:", error);
    }
  },

  fetchByTag: async (tag, userId) => {
    set({isLoading: true});
    try {
      const result = await apiClient.get(`/locations/tag/${tag}?user_id=${userId || "guest"}`);
      if (result.success) {
        set({trendingLocations: result.data, isLoading: false});
      }
    } catch (error) {
      console.error("Lỗi fetch by tag:", error);
      set({isLoading: false});
    }
  },

  fetchUserLocations: async (targetUid, currentUserId) => {
    set({isLoading: true});
    try {
      const result = await apiClient.get(`/locations/user/${targetUid}?current_user_id=${currentUserId || ""}`);
      if (result.success) {
        set({userLocations: result.data, isLoading: false});
      }
    } catch (error) {
      console.error(error);
      set({isLoading: false});
    }
  },

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
    const isValidPoint = (point) => (
      Array.isArray(point) &&
      point.length >= 2 &&
      Number.isFinite(Number(point[0])) &&
      Number.isFinite(Number(point[1]))
    );

    if (!isValidPoint(start) || !isValidPoint(end)) {
      console.error("Tọa độ không hợp lệ:", {start, end});
      return;
    }
    set({routeLoading: true, routeData: null});
    try {
      const startStr = `${start[0]},${start[1]}`;
      const endStr = `${end[0]},${end[1]}`;
      const result = await apiClient.get(`/locations/routing?start=${startStr}&end=${endStr}`);
      if (result.success !== false && result.code === 'Ok') {
        set({routeData: result.routes[0].geometry});
      } else {
        throw new Error("Backend routing failed");
      }
    } catch (error) {
      console.warn("Gọi backend thất bại, thử qua public OSRM...", error);
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${start[0]},${start[1]};${end[0]},${end[1]}?overview=full&geometries=geojson`;
        const response = await fetch(url);
        const data = await response.json();
        if (data.code === 'Ok') {
          set({routeData: data.routes[0].geometry});
        } else {
          console.error("Lỗi tìm đường đi.");
        }
      } catch (proxyError) {
        console.error("Lỗi cả public OSRM:", proxyError);
      }
    } finally {
      set({routeLoading: false});
    }
  },

  clearRoute: () => set({routeData: null}),

  toggleLike: async (locationId, userId) => {
    try {
      const result = await apiClient.post(`/likes/${locationId}/like`, {user_id: userId});

      if (result.success) {
        const updateLoc = (list) => list.map(loc =>
          loc.id === locationId
            ? {
              ...loc,
              is_liked: result.action === 'liked',
              likes_count: result.action === 'liked'
                ? Number(loc.likes_count || 0) + 1
                : Math.max(0, Number(loc.likes_count || 0) - 1)
            }
            : loc
        );

        set((state) => ({
          locations: updateLoc(state.locations),
          trendingLocations: updateLoc(state.trendingLocations),
          followingLocations: updateLoc(state.followingLocations),
          userLocations: updateLoc(state.userLocations)
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
        const updateLoc = (list) => list.map(loc =>
          loc.id === locationId
            ? {...loc, comments_count: Number(loc.comments_count || 0) + 1}
            : loc
        );

        set((state) => ({
          locations: updateLoc(state.locations),
          trendingLocations: updateLoc(state.trendingLocations),
          followingLocations: updateLoc(state.followingLocations),
          userLocations: updateLoc(state.userLocations)
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
          locations: state.locations.filter(loc => loc.id !== locationId),
          trendingLocations: state.trendingLocations.filter(loc => loc.id !== locationId),
          userLocations: state.userLocations.filter(loc => loc.id !== locationId),
          followingLocations: state.followingLocations.filter(loc => loc.id !== locationId)
        }));
      }
      return result;
    } catch (err) {
      console.error(err);
    }
  },

  fetchLocationDetail: async (locationId, userId) => {
    try {
      const result = await apiClient.get(`/locations/${locationId}?user_id=${userId || ""}`);
      if (result.success) {
        set((state) => {
          const exists = state.locations.find(l => l.id === result.data.id);
          if (exists) {
            return {
              locations: state.locations.map(l => l.id === result.data.id ? result.data : l)
            };
          } else {
            return {
              locations: [result.data, ...state.locations]
            };
          }
        });
        return result.data;
      }
    } catch (error) {
      console.error("Lỗi fetch chi tiết địa điểm:", error);
    }
    return null;
  },

}));


