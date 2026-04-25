import {create} from 'zustand';

export const useMapStore = create((set) => ({
  startPoint: null,
  endPoint: null,
  setStartPoint: (point) => set({startPoint: point}),
  setEndPoint: (point) => set({endPoint: point}),
  clearRoute: () => set({startPoint: null, endPoint: null})
}));
