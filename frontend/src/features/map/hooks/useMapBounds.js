import {useCallback, useMemo, useRef} from "react";
import {useLocationStore} from "../store/useLocationsStore.jsx";
import {useWeatherStore} from "../store/useWeatherStore.jsx";
import {debounce} from "../utils/performance.js";

const WEATHER_REFETCH_INTERVAL_MS = 60_000;

/**
 * Hook xử lý onMoveEnd: fetch locations theo bbox + refetch weather nếu visible.
 * Trả về handler ổn định để truyền vào <Map onMoveEnd={...} onLoad={...}>.
 */
export default function useMapBounds(mapRef) {
  const fetchLocations = useLocationStore((state) => state.fetchLocations);
  const fetchWeather = useWeatherStore((state) => state.fetchWeather);
  const isWeatherVisible = useWeatherStore((state) => state.isVisible);
  const lastWeatherFetchRef = useRef(0);

  const debouncedFetchLocations = useMemo(
    () => debounce((bounds) => fetchLocations(null, bounds), 300),
    [fetchLocations]
  );

  return useCallback(() => {
    const map = mapRef.current?.getMap?.();
    if (!map) return;

    debouncedFetchLocations(map.getBounds());

    if (isWeatherVisible && Date.now() - lastWeatherFetchRef.current > WEATHER_REFETCH_INTERVAL_MS) {
      lastWeatherFetchRef.current = Date.now();
      const center = map.getCenter();
      fetchWeather(center.lat, center.lng);
    }
  }, [mapRef, debouncedFetchLocations, isWeatherVisible, fetchWeather]);
}
