import {create} from "zustand";
import {apiClient} from "../../../shared/api/apiClient.js";

const MAP_CACHE_TTL = 30000;
const MAP_CACHE_LIMIT = 40;
const mapLocationsCache = new Map();
let latestMapRequestId = 0;

const getErrorMessage = (result, fallback = "Không thể tải dữ liệu") =>
  result?.message || result?.error?.message || fallback;

const makeBoundsCacheKey = (bounds) => [
  bounds.getWest().toFixed(3),
  bounds.getEast().toFixed(3),
  bounds.getSouth().toFixed(3),
  bounds.getNorth().toFixed(3),
].join(":");

const putMapCache = (key, data) => {
  mapLocationsCache.set(key, {data, timestamp: Date.now()});
  if (mapLocationsCache.size > MAP_CACHE_LIMIT) {
    mapLocationsCache.delete(mapLocationsCache.keys().next().value);
  }
};

export const useLocationStore = create((set) => ({
  locations: [],
  trendingLocations: [],
  followingLocations: [],
  userLocations: [],
  routeData: null,
  routeLoading: false,
  mapLoading: false,
  isLoading: false,
  error: null,
  mapError: null,
  routeError: null,
  tags: [],
  userLocation: null,
  accuracy: null,
  locationPermission: "checking",

  setUserLocation: (loc) => set({userLocation: loc}),
  setAccuracy: (acc) => set({accuracy: acc}),
  setLocationPermission: (permission) => set({locationPermission: permission}),
  setRouteData: (state) => (set({routeData: state})),

  fetchTrending: async () => {
    set({isLoading: true, error: null});
    try {
      const result = await apiClient.get("/locations/trending");
      if (result.success) {
        set({trendingLocations: result.data, error: null});
      } else {
        set({error: getErrorMessage(result, "Không thể tải feed cộng đồng")});
      }
    } catch (error) {
      console.error(error);
      set({error: error.message});
    } finally {
      set({isLoading: false});
    }
  },

  fetchFollowing: async () => {
    set({isLoading: true, error: null});
    try {
      const result = await apiClient.get("/locations/following");
      if (result.success) {
        set({followingLocations: result.data, error: null});
      } else {
        set({error: getErrorMessage(result, "Không thể tải feed đang theo dõi")});
      }
    } catch (error) {
      console.error(error);
      set({error: error.message});
    } finally {
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

  fetchByTag: async (tag) => {
    set({isLoading: true, error: null});
    try {
      const result = await apiClient.get(`/locations/tag/${tag}`);
      if (result.success) {
        set({trendingLocations: result.data, error: null});
      } else {
        set({error: getErrorMessage(result, "Không thể tải địa điểm theo tag")});
      }
    } catch (error) {
      console.error("Lỗi fetch by tag:", error);
      set({error: error.message});
    } finally {
      set({isLoading: false});
    }
  },

  fetchUserLocations: async (targetUid) => {
    set({isLoading: true, error: null});
    try {
      const result = await apiClient.get(`/locations/user/${targetUid}`);
      if (result.success) {
        set({userLocations: result.data, error: null});
      } else {
        set({error: getErrorMessage(result, "Không thể tải địa điểm của người dùng")});
      }
    } catch (error) {
      console.error(error);
      set({error: error.message});
    } finally {
      set({isLoading: false});
    }
  },

  fetchLocations: async (userId, bounds) => {
    if (!bounds) return;
    const cacheKey = makeBoundsCacheKey(bounds);
    const cached = mapLocationsCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < MAP_CACHE_TTL) {
      set({locations: cached.data, mapError: null});
      return;
    }

    const requestId = ++latestMapRequestId;
    set({mapLoading: true, mapError: null});
    try {
      const params = new URLSearchParams({
        minLng: bounds.getWest(),
        maxLng: bounds.getEast(),
        minLat: bounds.getSouth(),
        maxLat: bounds.getNorth()
      });
      const result = await apiClient.get(`/locations?${params.toString()}`);
      if (requestId !== latestMapRequestId) return;

      if (result.success) {
        putMapCache(cacheKey, result.data);
        set({locations: result.data, mapError: null});
      } else {
        set({mapError: getErrorMessage(result, "Không thể tải địa điểm trên bản đồ")});
      }
    } catch (error) {
      console.error(error);
      if (requestId === latestMapRequestId) {
        set({mapError: error.message});
      }
    } finally {
      if (requestId === latestMapRequestId) {
        set({mapLoading: false});
      }
    }
  },

  addLocation: async (locationData) => {
    set({isLoading: true, error: null});
    try {
      const result = await apiClient.post("/locations", locationData);

      if (result.success) {
        mapLocationsCache.clear();
        set((state) => ({
          locations: [result.data, ...state.locations]
        }));
      } else {
        set({error: getErrorMessage(result, "Không thể thêm địa điểm")});
      }
      return result;
    } catch (error) {
      console.error(error);
      set({error: error.message});
      return {success: false, message: error.message};
    } finally {
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
      set({routeError: "Tọa độ không hợp lệ"});
      return;
    }

    set({routeLoading: true, routeData: null, routeError: null});
    try {
      const startStr = `${start[0]},${start[1]}`;
      const endStr = `${end[0]},${end[1]}`;
      const result = await apiClient.get(`/locations/routing?start=${startStr}&end=${endStr}`);
      if (result && result.routes && result.routes.length > 0) {
        const route = result.routes[0];
        const geometry = route.geometry;

        if (geometry?.type === "LineString" && Array.isArray(geometry.coordinates)) {
          set({routeData: geometry});
        } else {
          throw new Error("No geometry found in route");
        }
      } else {
        throw new Error(getErrorMessage(result, "Backend routing failed"));
      }
    } catch (error) {
      console.error("Goong routing error:", error);
      set({routeError: "Không thể tìm đường đi"});
    } finally {
      set({routeLoading: false});
    }
  },

  clearRoute: () => set({routeData: null, routeError: null}),

  toggleLike: async (locationId) => {
    try {
      const result = await apiClient.post(`/likes/${locationId}/like`);

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
      return result;
    } catch (err) {
      console.error(err);
      return {success: false, message: err.message};
    }
  },

  postComment: async (locationId, content) => {
    try {
      const result = await apiClient.post(`/comments/${locationId}/comments`, {content});

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
      return {success: false, message: err.message};
    }
  },

  removeLocation: async (locationId) => {
    try {
      const result = await apiClient.delete(`/locations/${locationId}`);
      if (result.success) {
        mapLocationsCache.clear();
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
      return {success: false, message: err.message};
    }
  },

  fetchLocationDetail: async (locationId) => {
    try {
      const result = await apiClient.get(`/locations/${locationId}`);
      if (result.success) {
        set((state) => {
          const exists = state.locations.find(l => l.id === result.data.id);
          if (exists) {
            return {
              locations: state.locations.map(l => l.id === result.data.id ? result.data : l)
            };
          }
          return {
            locations: [result.data, ...state.locations]
          };
        });
        return result.data;
      }
    } catch (error) {
      console.error("Lỗi fetch chi tiết địa điểm:", error);
    }
    return null;
  },
}));
