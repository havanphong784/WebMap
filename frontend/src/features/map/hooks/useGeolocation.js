import {useEffect} from "react";
import {useLocationStore} from "../store/useLocationsStore.jsx";
import {watchPosition} from "../../../platform/location.js";

/**
 * Theo dõi GPS qua navigator.geolocation.watchPosition và cập nhật vào store.
 * Tự cleanup khi unmount.
 */
export default function useGeolocation() {
  const setUserLocation = useLocationStore((state) => state.setUserLocation);
  const setAccuracy = useLocationStore((state) => state.setAccuracy);

  useEffect(() => {
    let disposed = false;
    let stopWatching;
    void watchPosition(
      {enableHighAccuracy: true},
      (pos) => {
        if (disposed) return;
        setUserLocation([pos.coords.longitude, pos.coords.latitude]);
        setAccuracy(pos.coords.accuracy);
      },
      () => {/* Ignore - user có thể không cấp quyền */},
    ).then((stop) => {
      if (disposed) void stop();
      else stopWatching = stop;
    }).catch(() => {/* User có thể không cấp quyền */});

    return () => {
      disposed = true;
      void stopWatching?.();
    };
  }, [setUserLocation, setAccuracy]);
}
