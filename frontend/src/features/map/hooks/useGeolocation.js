import {useEffect} from "react";
import {useLocationStore} from "../store/useLocationsStore.jsx";

/**
 * Theo dõi GPS qua navigator.geolocation.watchPosition và cập nhật vào store.
 * Tự cleanup khi unmount.
 */
export default function useGeolocation() {
  const setUserLocation = useLocationStore((state) => state.setUserLocation);
  const setAccuracy = useLocationStore((state) => state.setAccuracy);

  useEffect(() => {
    if (!navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setUserLocation([pos.coords.longitude, pos.coords.latitude]);
        setAccuracy(pos.coords.accuracy);
      },
      () => {/* Ignore - user có thể không cấp quyền */},
      {enableHighAccuracy: true}
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [setUserLocation, setAccuracy]);
}
