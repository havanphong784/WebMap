import {useEffect} from "react";
import {useLocationStore} from "../store/useLocationsStore.jsx";
import {getLocationPermissionState, watchPosition} from "../../../platform/location.js";

/**
 * Theo dõi GPS qua navigator.geolocation.watchPosition và cập nhật vào store.
 * Tự cleanup khi unmount.
 */
export default function useGeolocation() {
  const setUserLocation = useLocationStore((state) => state.setUserLocation);
  const setAccuracy = useLocationStore((state) => state.setAccuracy);
  const setLocationPermission = useLocationStore((state) => state.setLocationPermission);

  useEffect(() => {
    let disposed = false;
    let stopWatching;
    void getLocationPermissionState().then((permission) => {
      if (disposed) return;
      setLocationPermission(permission);
      if (permission !== "granted") return;
      return watchPosition(
        {enableHighAccuracy: true},
        (pos) => {
          if (disposed) return;
          setUserLocation([pos.coords.longitude, pos.coords.latitude]);
          setAccuracy(pos.coords.accuracy);
        },
        () => setLocationPermission("unavailable"),
      );
    }).then((stop) => {
      if (!stop) return;
      if (disposed) void stop();
      else stopWatching = stop;
    }).catch(() => setLocationPermission("unavailable"));

    return () => {
      disposed = true;
      void stopWatching?.();
    };
  }, [setUserLocation, setAccuracy, setLocationPermission]);
}
