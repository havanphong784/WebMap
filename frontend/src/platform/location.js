import {Geolocation} from "@capacitor/geolocation";
import {isNativeAndroid} from "./runtime.js";

const normalizedError = (code, message, recoverable = true) => Object.assign(new Error(message), {
  code,
  recoverable,
});

const normalizePosition = (position) => ({
  ...position,
  coords: {
    ...position.coords,
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    accuracy: position.coords.accuracy,
  },
});

export const createLocationAdapter = ({
  nativeAndroid = isNativeAndroid(),
  plugin = Geolocation,
  browserGeolocation = globalThis.navigator?.geolocation,
} = {}) => {
  const requestLocationPermission = async () => {
    if (!nativeAndroid) return browserGeolocation ? "granted" : "denied";

    const current = await plugin.checkPermissions();
    if (current.location === "granted") return "granted";
    if (current.location !== "prompt") return "denied";
    const requested = await plugin.requestPermissions();
    return requested.location === "granted" ? "granted" : "denied";
  };

  const ensureAvailable = async () => {
    if (!nativeAndroid && !browserGeolocation) {
      throw normalizedError("LOCATION_UNAVAILABLE", "Thiết bị không hỗ trợ định vị");
    }
    if (nativeAndroid && await requestLocationPermission() !== "granted") {
      throw normalizedError("LOCATION_DENIED", "Quyền truy cập vị trí đã bị từ chối");
    }
  };

  const getCurrentPosition = async (options = {}) => {
    await ensureAvailable();
    if (nativeAndroid) return normalizePosition(await plugin.getCurrentPosition(options));

    return new Promise((resolve, reject) => {
      browserGeolocation.getCurrentPosition(
        (position) => resolve(normalizePosition(position)),
        (error) => reject(normalizedError("LOCATION_FAILED", error?.message || "Không thể lấy vị trí")),
        options,
      );
    });
  };

  const watchPosition = async (options = {}, onPosition, onError = () => {}) => {
    await ensureAvailable();
    if (nativeAndroid) {
      const id = await plugin.watchPosition(options, (position, error) => {
        if (error) onError(normalizedError("LOCATION_FAILED", error.message || "Không thể theo dõi vị trí"));
        else if (position) onPosition(normalizePosition(position));
      });
      return () => plugin.clearWatch({id});
    }

    const id = browserGeolocation.watchPosition(
      (position) => onPosition(normalizePosition(position)),
      (error) => onError(normalizedError("LOCATION_FAILED", error?.message || "Không thể theo dõi vị trí")),
      options,
    );
    return async () => browserGeolocation.clearWatch(id);
  };

  return {requestLocationPermission, getCurrentPosition, watchPosition};
};

const locationAdapter = createLocationAdapter();
export const requestLocationPermission = locationAdapter.requestLocationPermission;
export const getCurrentPosition = locationAdapter.getCurrentPosition;
export const watchPosition = locationAdapter.watchPosition;
