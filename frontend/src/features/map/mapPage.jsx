import { useLocation, useNavigate } from 'react-router-dom';
import Map from 'react-map-gl/maplibre';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import ClickedMarker from "./components/clickedMarker.jsx";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getAddress } from "./utils/geocoding.js";
import { debounce } from "./utils/performance.js";
import SearchBox from "./components/searchBox.jsx";
import { useLocationStore } from "./store/useLocationsStore.jsx";
import { useAuthStore } from "../auth/context/authStore.js";
import ClusterLocations from "./components/clusterLocations.jsx";
import LocationSidebar from "./components/locationSidebar.jsx";
import RouteLayer from "./components/routeLayer.jsx";
import { AnimatePresence } from 'framer-motion';
import colorfull from "./style/colorful";
import { extractGPS } from "./utils/exifUtils.js";

import { useToastStore } from "../../shared/components/toast/useToastStore.jsx";

import OnlineCommunityBar from "./components/onlineCommunityBar.jsx";
import MapControls from "./components/mapControls.jsx";
import UserMarker from "./components/userMarker.jsx";
import UserProfileButton from "./components/userProfileButton.jsx";
import MapMarkers from "./components/mapMarkers.jsx";
import WeatherWidget from "./components/WeatherWidget.jsx";
import WeatherLayers from "./components/WeatherLayers.jsx";
import WeatherEffects from "./components/WeatherEffects.jsx";
import { useWeatherStore } from "./store/useWeatherStore.jsx";
import MapChatbot from "../chatbot/components/mapChatbot.jsx";
import { isMobile } from "../../shared/utils/deviceUtils.js";
import {withNearbyGroup} from "./utils/locationGrouping.js";


export default function MapPage() {
  const navigate = useNavigate();
  const routerLocation = useLocation();
  const mapRef = useRef(null);

  const [infoClicked, setInfoClicked] = useState(null);
  const [markerViewMode, setMarkerViewMode] = useState('full');
  const [isMapReady, setIsMapReady] = useState(false);
  const mobile = useMemo(() => isMobile(), []);
  const addToast = useToastStore(state => state.addToast);
  const hasAutoLocated = useRef(false);

  const setUserLocation = useLocationStore(state => state.setUserLocation);
  const setAccuracy = useLocationStore(state => state.setAccuracy);

  useEffect(() => {
    if (!navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setUserLocation([pos.coords.longitude, pos.coords.latitude]);
        setAccuracy(pos.coords.accuracy);
      },
      () => {
      },
      { enableHighAccuracy: true }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [setUserLocation, setAccuracy]);

  const fetchLocations = useLocationStore(state => state.fetchLocations);
  const locations = useLocationStore(state => state.locations);
  const mapLoading = useLocationStore(state => state.mapLoading);
  const mapError = useLocationStore(state => state.mapError);
  const routeError = useLocationStore(state => state.routeError);
  const routeData = useLocationStore(state => state.routeData);
  const setRouteData = useLocationStore(state => state.setRouteData);
  const { user } = useAuthStore();
  const [activeLocation, setActiveLocation] = useState(null);
  const fetchLocationDetail = useLocationStore(state => state.fetchLocationDetail);
  const [isLocating, setIsLocating] = useState(false);
  const [isExtractingPhoto, setIsExtractingPhoto] = useState(false);
  const fileInputRef = useRef(null);
  const clickThrottleRef = useRef(false);
  const fetchWeather = useWeatherStore(state => state.fetchWeather);
  const isVisible = useWeatherStore(state => state.isVisible);
  const toggleVisibility = useWeatherStore(state => state.toggleVisibility);

  const flyToLocation = useCallback((lng, lat, zoom = 17, duration = 1600, withPadding = false) => {
    if (!mapRef.current) return;

    mapRef.current.flyTo({
      center: [parseFloat(lng), parseFloat(lat)],
      zoom: zoom,
      pitch: 45,
      bearing: 0,
      duration: duration,
      essential: true,
      padding: withPadding ? {
        left: mobile ? 0 : 460,
      } : { left: 0, bottom: 0, top: 0, right: 0 }
    });
  }, [mobile]);

  useEffect(() => {
    const focusLocation = routerLocation.state?.focusLocation;
    if (!focusLocation || !isMapReady) return;

    const lng = parseFloat(focusLocation.lng);
    const lat = parseFloat(focusLocation.lat);

    if (Number.isNaN(lng) || Number.isNaN(lat)) return;

    const fetchDetail = async () => {
      const detail = await fetchLocationDetail(focusLocation.id, user?.uid);
      if (detail) {
        setActiveLocation(detail);
      } else {
        setActiveLocation(focusLocation);
      }
    };

    const timer = setTimeout(() => {
      fetchDetail();
      setInfoClicked(null);
      flyToLocation(lng, lat, 16, 1600, true);
    }, 100);

    return () => clearTimeout(timer);
  }, [routerLocation.state, isMapReady, flyToLocation, fetchLocationDetail, user?.uid]);

  useEffect(() => {
    if (!isMapReady) return;
    const params = new URLSearchParams(routerLocation.search);
    const lat = parseFloat(params.get('lat'));
    const lng = parseFloat(params.get('lng'));
    const locationId = params.get('locationId');
    if (Number.isNaN(lat) || Number.isNaN(lng)) return;

    const timer = setTimeout(async () => {
      flyToLocation(lng, lat, 16, 1600, true);

      if (locationId) {
        const detail = await fetchLocationDetail(locationId, user?.uid);
        if (detail) {
          setActiveLocation(detail);
          setInfoClicked(null);
          return;
        }
      }

      setInfoClicked({ lng, lat, address: null });
      const diachi = await getAddress(lat, lng);
      setInfoClicked({ lng, lat, address: diachi });
    }, 300);

    return () => clearTimeout(timer);
  }, [isMapReady, routerLocation.search, flyToLocation, fetchLocationDetail, user?.uid]);

  useEffect(() => {
    const coordinates = routeData?.coordinates;
    if (!mapRef.current || !coordinates?.length) return;

    const map = mapRef.current.getMap();
    if (!map) return;

    const bounds = new maplibregl.LngLatBounds(coordinates[0], coordinates[0]);
    coordinates.slice(1).forEach((coordinate) => bounds.extend(coordinate));

    if (activeLocation === null) {
      map.fitBounds(bounds, {
        padding: { top: 100, bottom: 200, left: 100, right: 100 },
        duration: 1200,
        essential: true,
      });
    } else {
      map.fitBounds(bounds, {
        padding: { top: 100, bottom: 200, left: 400, right: 100 },
        duration: 1200,
        essential: true,
      });
    }
  }, [routeData, activeLocation]);

  const handleLocationClick = useCallback(async (locData) => {
    setInfoClicked(null);
    const groupedLocation = locData.group?.length ? locData : withNearbyGroup(locData, locations);
    setActiveLocation(groupedLocation);
    flyToLocation(groupedLocation.lng, groupedLocation.lat, 16, 2000, true);

    const detail = await fetchLocationDetail(groupedLocation.id, user?.uid);
    if (detail) {
      const group = groupedLocation.group?.length
        ? groupedLocation.group.map(item => item.id === detail.id ? {...item, ...detail} : item)
        : null;
      setActiveLocation(group?.length > 1 ? {...detail, group} : detail);
    }
  }, [flyToLocation, fetchLocationDetail, locations, user?.uid]);

  const handleClick = useCallback(async (e) => {
    // Nếu click trúng marker từ layer unclustered-point của ClusterLocations
    const feature = e.features?.[0];
    if (feature && (feature.layer.id === 'unclustered-point' || feature.layer.id === 'unclustered-label')) {
      handleLocationClick(withNearbyGroup(feature.properties, locations));
      return;
    }

    if (clickThrottleRef.current) return;
    clickThrottleRef.current = true;
    setTimeout(() => {
      clickThrottleRef.current = false;
    }, 2000);

    setActiveLocation(null);
    setRouteData(null);
    const { lng, lat } = e.lngLat;
    flyToLocation(lng, lat, 16);
    setInfoClicked({ lng, lat, address: { display_name: "Đang xác định vị trí..." } });
    const diachi = await getAddress(lat, lng);
    setInfoClicked({ lng, lat, address: diachi });
  }, [flyToLocation, setRouteData, handleLocationClick, locations]);

  const handleSearchSelect = useCallback(async (lng, lat, addressName) => {
    flyToLocation(lng, lat, 16);
    setInfoClicked({ lng, lat, address: { display_name: addressName } });
    const diachi = await getAddress(lat, lng);
    setInfoClicked({ lng, lat, address: diachi });
  }, [flyToLocation]);

  const debouncedFetch = useRef(
    debounce((uid, bounds) => {
      fetchLocations(uid, bounds);
    }, 300)
  ).current;

  const handleMapChange = useCallback(() => {
    if (mapRef.current) {
      const map = mapRef.current.getMap();
      if (!map) return;

      const bounds = map.getBounds();
      debouncedFetch(user?.uid, bounds);

      if (isVisible) {
        const center = map.getCenter();
        fetchWeather(center.lat, center.lng);
      }
    }
  }, [user?.uid, debouncedFetch, isVisible, fetchWeather]);

  const handleLocateUser = useCallback(() => {
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { longitude, latitude, accuracy } = pos.coords;
        setUserLocation([longitude, latitude]);
        setAccuracy(accuracy);

        mapRef.current?.flyTo({
          center: [longitude, latitude],
          zoom: 16,
          duration: 2000,
          pitch: 45
        });
        setIsLocating(false);
      },
      (err) => {
        setIsLocating(false);
        console.error("Lỗi lấy vị trí:", err);
        addToast("Không thể truy cập vị trí của bạn. Vui lòng cấp quyền.", "error");
      },
      { enableHighAccuracy: true }
    );
  }, [addToast, setUserLocation, setAccuracy]);

  useEffect(() => {
    if (isMapReady && !hasAutoLocated.current && !routerLocation.state?.focusLocation && !routerLocation.search) {
      hasAutoLocated.current = true;
      handleLocateUser();
    }
  }, [isMapReady, handleLocateUser, routerLocation]);

  const handlePhotoUpload = useCallback(async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      addToast("Vui lòng chọn tệp hình ảnh!", "error");
      return;
    }

    setIsExtractingPhoto(true);
    try {
      const gps = await extractGPS(file);
      if (gps) {
        flyToLocation(gps.lng, gps.lat, 17);
        setInfoClicked({ lng: gps.lng, lat: gps.lat, address: null, imageFile: file, autoOpenForm: true });
        const diachi = await getAddress(gps.lat, gps.lng);
        setInfoClicked({ lng: gps.lng, lat: gps.lat, address: diachi, imageFile: file, autoOpenForm: true });
      } else {
        addToast("Ảnh này không chứa thông tin vị trí (GPS metadata).", "error");
      }
    } catch {
      addToast("Không thể trích xuất vị trí từ ảnh.", "error");
    } finally {
      setIsExtractingPhoto(false);
      e.target.value = "";
    }
  }, [addToast, flyToLocation]);

  const zoomIn = useCallback(() => {
    if (mapRef.current) {
      const map = mapRef.current.getMap();
      if (map) map.zoomIn();
    }
  }, []);

  const zoomOut = useCallback(() => {
    if (mapRef.current) {
      const map = mapRef.current.getMap();
      if (map) map.zoomOut();
    }
  }, []);


  const mapCanvas = useMemo(() => (
    <Map ref={mapRef}
      mapStyle={colorfull}
      minZoom={3}
      maxZoom={18}
      onLoad={() => {
        setIsMapReady(true);
        handleMapChange();
      }}
      onMoveEnd={handleMapChange}
      mapLib={maplibregl}
      antialias={true}
      attributionControl={false}
      initialViewState={{
        longitude: 108.249476,
        latitude: 15.972143,
        zoom: 13,
        pitch: 45,
        bearing: 0
      }}
      style={{ width: '100%', height: '100%' }}
      onClick={handleClick}
      interactiveLayerIds={['clusters', 'unclustered-point', 'unclustered-label']}
    >
      <WeatherLayers />
      <ClickedMarker
        point={infoClicked}
        setPoint={setInfoClicked}
        onLocationSaved={(savedLocation) => {
          if (!savedLocation) return;
          setInfoClicked(null);
          setActiveLocation(savedLocation);
          flyToLocation(savedLocation.lng, savedLocation.lat, 16, 1200, true);
        }}
      />
      <ClusterLocations />
      <RouteLayer />
      <UserMarker />
      <MapMarkers
        viewMode={markerViewMode}
        onLocationClick={handleLocationClick}
        activeLocation={activeLocation}
      />
    </Map>
  ), [
    handleMapChange,
    handleClick,
    markerViewMode,
    handleLocationClick,
    infoClicked,
    activeLocation,
    flyToLocation
  ]);


  return (
    <div className="h-screen w-full relative overflow-hidden bg-map-bg text-text-primary">
      {mapCanvas}

      <WeatherWidget />
      <WeatherEffects />

      <UserProfileButton />

      <MapControls
        onLocate={handleLocateUser}
        isLocating={isLocating}
        onPhotoUpload={handlePhotoUpload}
        isExtractingPhoto={isExtractingPhoto}
        viewMode={markerViewMode}
        setViewMode={setMarkerViewMode}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        fileInputRef={fileInputRef}
        isVisible={isVisible}
        onToggleWeather={toggleVisibility}
      />

      <SearchBox onSelectLocation={handleSearchSelect} />

      <OnlineCommunityBar />

      {(mapLoading || mapError || routeError) && (
        <div className="absolute left-3 top-32 z-[750] max-w-[calc(100%-6rem)] sm:left-6 sm:top-24 sm:max-w-sm pointer-events-none">
          <div className={`rounded-2xl border px-4 py-3 text-xs font-bold shadow-glass backdrop-blur-2xl ${
            mapError || routeError
              ? 'border-sunset/25 bg-white/95 text-sunset'
              : 'border-cyan-glow/20 bg-white/90 text-cyan-glow'
          }`}>
            {mapError || routeError || 'Đang cập nhật địa điểm...'}
          </div>
        </div>
      )}

      <AnimatePresence>
        {activeLocation && (
          <LocationSidebar
            location={activeLocation}
            onAddReview={() => {
              setInfoClicked({
                lng: activeLocation.lng,
                lat: activeLocation.lat,
                address: activeLocation.address,
                autoOpenForm: true
              });
              setActiveLocation(null);
            }}
            onClose={() => {
              setActiveLocation(null);
              if (routerLocation.search) {
                navigate('/', { replace: true });
              }
            }}
          />
        )}
      </AnimatePresence>

      <MapChatbot />
    </div>

  );
}
