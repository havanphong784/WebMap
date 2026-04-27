import {create} from 'zustand';

const API_URL = 'http://localhost:3000/api/locations';

export const useLocationStore = create((set) => ({
  locations: [],
  isLoading: false,
  fetchLocations: async (userId) => {
    set({isLoading: true});
    try {
      const response = await fetch(`${API_URL}/${userId}`);
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
  }
}));
