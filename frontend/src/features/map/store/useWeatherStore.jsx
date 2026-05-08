import { create } from 'zustand';
import { apiClient } from '../../../shared/api/apiClient.js';

export const useWeatherStore = create((set) => ({
  weather: null,
  isLoading: false,
  isVisible: false,
  activeLayer: 'precipitation_new', // Mặc định là mưa

  toggleVisibility: () => set((state) => ({ isVisible: !state.isVisible })),
  setActiveLayer: (layer) => set({ activeLayer: layer }),

  fetchWeather: async (lat, lng) => {
    if (!lat || !lng) return;
    set({ isLoading: true });
    try {
      const res = await apiClient.get(`/weather?lat=${lat}&lng=${lng}`);
      if (res.success) {
        set({ weather: res.data, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch (err) {
      console.error("Lỗi fetch weather:", err);
      set({ isLoading: false });
    }
  }
}));
