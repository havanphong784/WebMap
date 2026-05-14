import {useEffect} from "react";
import {useLocation} from "react-router-dom";
import {useLocationStore} from "../store/useLocationsStore.jsx";
import {getAddress} from "../utils/geocoding.js";

/**
 * Khi user navigate tới /map với state.focusLocation hoặc query params (?lat&lng&locationId),
 * tự động fly tới đó và mở location detail.
 */
export default function useFocusFromRoute({isMapReady, flyToLocation, setActiveLocation, setInfoClicked}) {
  const routerLocation = useLocation();
  const fetchLocationDetail = useLocationStore((state) => state.fetchLocationDetail);

  // Từ navigate state (vd: từ feed)
  useEffect(() => {
    const focusLocation = routerLocation.state?.focusLocation;
    if (!focusLocation || !isMapReady) return;
    const lng = parseFloat(focusLocation.lng);
    const lat = parseFloat(focusLocation.lat);
    if (Number.isNaN(lng) || Number.isNaN(lat)) return;

    const timer = setTimeout(async () => {
      const detail = await fetchLocationDetail(focusLocation.id);
      setActiveLocation(detail || focusLocation);
      setInfoClicked(null);
      flyToLocation(lng, lat, 16, 1600, true);
    }, 100);
    return () => clearTimeout(timer);
  }, [routerLocation.state, isMapReady, flyToLocation, fetchLocationDetail, setActiveLocation, setInfoClicked]);

  // Từ query params (?lat=...&lng=...&locationId=...)
  useEffect(() => {
    if (!isMapReady) return;
    const params = new URLSearchParams(routerLocation.search);
    const lat = parseFloat(params.get("lat"));
    const lng = parseFloat(params.get("lng"));
    const locationId = params.get("locationId");
    if (Number.isNaN(lat) || Number.isNaN(lng)) return;

    const timer = setTimeout(async () => {
      flyToLocation(lng, lat, 16, 1600, true);
      if (locationId) {
        const detail = await fetchLocationDetail(locationId);
        if (detail) {
          setActiveLocation(detail);
          setInfoClicked(null);
          return;
        }
      }
      setInfoClicked({lng, lat, address: null});
      const addr = await getAddress(lat, lng);
      setInfoClicked({lng, lat, address: addr});
    }, 300);
    return () => clearTimeout(timer);
  }, [isMapReady, routerLocation.search, flyToLocation, fetchLocationDetail, setActiveLocation, setInfoClicked]);
}
