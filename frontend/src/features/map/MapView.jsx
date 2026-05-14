import {forwardRef, useCallback, useImperativeHandle, useRef, useState} from "react";
import Map from "react-map-gl/maplibre";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import {GOONG_MAP_STYLE, INITIAL_VIEW_STATE, MAP_LIMITS, isGoongPoiFeature} from "./config/mapConfig.js";
import useGeolocation from "./hooks/useGeolocation.js";
import useMapBounds from "./hooks/useMapBounds.js";
import useFocusFromRoute from "./hooks/useFocusFromRoute.js";
import useFlyTo from "./hooks/useFlyTo.js";
import useRouteFitBounds from "./hooks/useRouteFitBounds.js";
import {useLocationStore} from "./store/useLocationsStore.jsx";
import {getAddress, getPlaceDetail} from "./utils/geocoding.js";
import ClusterLayer from "./layers/ClusterLayer.jsx";
import WeatherLayer from "./layers/WeatherLayer.jsx";
import RouteLayer from "./layers/RouteLayer.jsx";
import ClickedMarker from "./markers/ClickedMarker.jsx";
import LocationMarkers from "./markers/LocationMarkers.jsx";
import OnlineUserMarkers from "./markers/OnlineUserMarkers.jsx";
import UserMarker from "./markers/UserMarker.jsx";

/**
 * MapView - Component bản đồ "thuần", chỉ gồm Map + layers + markers.
 * UI overlay (controls, sidebar, search...) được render bởi MapPage component cha.
 *
 * Expose qua ref:
 *   - flyTo(lng, lat, zoom?, duration?, withPadding?)
 *   - getMap() - trả về MapLibre instance gốc
 */
const MapView = forwardRef(function MapView(
  {
    mobile,
    activeLocation,
    setActiveLocation,
    infoClicked,
    setInfoClicked,
    markerViewMode,
    onLocationSaved,
    onPoiClick,
    onEmptyAreaClick,
  },
  ref
) {
  const mapRef = useRef(null);
  const clickThrottleRef = useRef(false);
  const [isMapReady, setIsMapReady] = useState(false);

  const fetchLocationDetail = useLocationStore((state) => state.fetchLocationDetail);
  const setRouteData = useLocationStore((state) => state.setRouteData);
  const routeData = useLocationStore((state) => state.routeData);

  const flyToLocation = useFlyTo(mapRef, mobile);
  const handleMapBoundsChange = useMapBounds(mapRef);

  // Tracking GPS, focus theo URL/state, fit bounds khi có route
  useGeolocation();
  useFocusFromRoute({isMapReady, flyToLocation, setActiveLocation, setInfoClicked});
  useRouteFitBounds({mapRef, routeData, hasActivePanel: Boolean(activeLocation)});

  // Expose API ra parent
  useImperativeHandle(ref, () => ({
    flyTo: flyToLocation,
    getMap: () => mapRef.current?.getMap?.(),
    zoomIn: () => mapRef.current?.getMap?.().zoomIn(),
    zoomOut: () => mapRef.current?.getMap?.().zoomOut(),
  }), [flyToLocation]);

  /**
   * Click vào saved location (bubble unclustered từ ClusterLayer).
   * Mở sidebar và fetch detail.
   */
  const handleSavedPointClick = useCallback(async (location) => {
    if (!location?.id) return;
    setInfoClicked(null);
    setActiveLocation(location);
    flyToLocation(location.lng, location.lat, 16, 2000, true);
    const detail = await fetchLocationDetail(location.id);
    if (detail) setActiveLocation(detail);
  }, [flyToLocation, fetchLocationDetail, setActiveLocation, setInfoClicked]);

  /**
   * Click trên map (không phải cluster/saved point).
   * - Vào POI Goong native: reverse geocode + show detail
   * - Vào vùng trống: hiện popup "thêm địa điểm"
   */
  const handleMapClick = useCallback(async (e) => {
    if (clickThrottleRef.current) return;
    clickThrottleRef.current = true;
    setTimeout(() => { clickThrottleRef.current = false; }, 300);

    const features = e.features || [];
    const poiFeature = features.find(isGoongPoiFeature);

    if (poiFeature) {
      onPoiClick?.(e, poiFeature);
      return;
    }

    onEmptyAreaClick?.(e);
  }, [onPoiClick, onEmptyAreaClick]);

  const handleMouseMove = useCallback((e) => {
    const map = e.target;
    const features = map.queryRenderedFeatures(e.point);
    map.getCanvas().style.cursor = features.some(isGoongPoiFeature) ? "pointer" : "";
  }, []);

  return (
    <Map
      ref={mapRef}
      mapStyle={GOONG_MAP_STYLE}
      mapLib={maplibregl}
      minZoom={MAP_LIMITS.minZoom}
      maxZoom={MAP_LIMITS.maxZoom}
      initialViewState={INITIAL_VIEW_STATE}
      antialias
      attributionControl={false}
      style={{width: "100%", height: "100%"}}
      onLoad={() => {
        setIsMapReady(true);
        handleMapBoundsChange();
      }}
      onMoveEnd={handleMapBoundsChange}
      onClick={handleMapClick}
      onMouseMove={handleMouseMove}
    >
      <WeatherLayer />
      <ClickedMarker
        point={infoClicked}
        setPoint={setInfoClicked}
        onLocationSaved={onLocationSaved}
      />
      <ClusterLayer onPointClick={handleSavedPointClick} />
      <RouteLayer />
      <UserMarker />
      <OnlineUserMarkers
        onUserClick={(onlineUser) => {
          const lat = Number.parseFloat(onlineUser?.current_lat);
          const lng = Number.parseFloat(onlineUser?.current_lng);
          if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
          setActiveLocation(null);
          setInfoClicked(null);
          setRouteData(null);
          flyToLocation(lng, lat, 16, 1600, true);
        }}
      />
      <LocationMarkers
        viewMode={markerViewMode}
        onLocationClick={handleSavedPointClick}
        activeLocation={activeLocation}
      />
    </Map>
  );
});

export default MapView;

// Helpers cho POI handling
export {getAddress, getPlaceDetail};
