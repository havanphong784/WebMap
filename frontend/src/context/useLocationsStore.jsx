import {create} from 'zustand';

const API_URL = 'http://localhost:3000/api/locations';

export const useLocationStore = create((set) => ({
  locations: [],
  routeData: null,
  isLoading: false,

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
      const response = await fetch(`${API_URL}?${params.toString()}`);
      const result = await response.json();
      if (result.success) {
        set({locations: result.data, isLoading: false});
      }
    } catch (error) {
      console.error("Lỗi Fetch Data:", error);
      set({isLoading: false});
    }
  },


  addLocation: async (locationData) => {
    set({isLoading: true});
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(locationData)
      });
      const result = await response.json();

      if (result.success) {
        set((state) => ({
          locations: [result.data, ...state.locations]
        }));
      }

      set({isLoading: false});

    } catch (error) {
      console.error("Lỗi Lưu Data:", error);
      set({isLoading: false});
    }
  },

  fetchRoute: async (start, end) => {
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${start[0]},${start[1]};${end[0]},${end[1]}?overview=full&geometries=geojson`;

      const response = await fetch(url);
      const data = await response.json();
      if (data.code === 'Ok') {
        set({routeData: data.routes[0].geometry});
      }
    } catch (error) {
      console.error("Lỗi lấy đường đi:", error);
    }
  },

  clearRoute: () => set({routeData: null})

}));
