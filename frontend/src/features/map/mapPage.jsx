import { useLocation, useNavigate } from 'react-router-dom';
import Map, { Marker } from 'react-map-gl/maplibre';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import ClickedMarker from "./components/clickedMarker.jsx";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getAddress } from "./utils/geocoding.js";
import { debounce } from "./utils/performance.js";
import SearchBox from "./components/searchBox.jsx";
import { useLocationStore } from "./store/useLocationsStore.jsx";
import { useAuthStore } from "../auth/context/authContext.jsx";
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

export default function MapPage() {
  const navigate = useNavigate();
  const routerLocation = useLocation();
  const mapRef = useRef(null);

  const [infoClicked, setInfoClicked] = useState(null);
  const [markerViewMode, setMarkerViewMode] = useState('full');
  const [isMapReady, setIsMapReady] = useState(false);
  const addToast = useToastStore(state => state.addToast);

  const setUserLocation = useLocationStore(state => state.setUserLocation);
  const setAccuracy = useLocationStore(state => state.setAccuracy);

  useEffect(() => {
    if (!navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setUserLocation([pos.coords.longitude, pos.coords.latitude]);
        setAccuracy(pos.coords.accuracy);
      },
      (err) => { },
      { enableHighAccuracy: true }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [setUserLocation, setAccuracy]);

  const fetchLocations = useLocationStore(state => state.fetchLocations);
  const locations = useLocationStore(state => state.locations);
  const routeData = useLocationStore(state => state.routeData);
  const setRouteData = useLocationStore(state => state.setRouteData);
  const { user } = useAuthStore();
  const [currentZoom, setCurrentZoom] = useState(13);
  const [activeLocation, setActiveLocation] = useState(null);
  const { fetchLocationDetail } = useLocationStore();
  const [isLocating, setIsLocating] = useState(false);
  const [isExtractingPhoto, setIsExtractingPhoto] = useState(false);
  const fileInputRef = useRef(null);
  const clickThrottleRef = useRef(false);

  const flyToLocation = useCallback((lng, lat, zoom = 16, duration = 1600) => {
    if (!mapRef.current) return;

    mapRef.current.flyTo({
      center: [parseFloat(lng), parseFloat(lat)],
      zoom: zoom,
      pitch: 45,
      bearing: 0,
      duration: duration,
      essential: true
    });
  }, []);

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
      flyToLocation(lng, lat, 17);
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
      flyToLocation(lng, lat, 17);

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

  const handleClick = useCallback(async (e) => {
    if (clickThrottleRef.current) return;
    clickThrottleRef.current = true;
    setTimeout(() => {
      clickThrottleRef.current = false;
    }, 2000);

    setActiveLocation(null);
    setRouteData(null);
    const { lng, lat } = e.lngLat;
    flyToLocation(lng, lat, 15);
    setInfoClicked({ lng, lat, address: { display_name: "Đang xác định vị trí..." } });
    const diachi = await getAddress(lat, lng);
    setInfoClicked({ lng, lat, address: diachi });
  }, [flyToLocation, setRouteData]);

  const handleSearchSelect = useCallback(async (lng, lat, addressName) => {
    flyToLocation(lng, lat, 15);
    setInfoClicked({ lng, lat, address: { display_name: addressName } });
    const diachi = await getAddress(lat, lng);
    setInfoClicked({ lng, lat, address: diachi });
  }, [flyToLocation]);

  const debouncedFetch = useRef(
    debounce((uid, bounds) => {
      fetchLocations(uid, bounds);
    }, 200)
  ).current;

  const handleMapChange = useCallback(() => {
    if (mapRef.current) {
      const map = mapRef.current.getMap();
      if (!map) return;

      const bounds = map.getBounds();
      const zoom = map.getZoom();

      setCurrentZoom(zoom);
      debouncedFetch(user?.uid, bounds);
    }
  }, [user?.uid, debouncedFetch]);

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
    } catch (error) {
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

  const handleLocationClick = useCallback((locData) => {
    setInfoClicked(null);
    setActiveLocation(locData);
    flyToLocation(locData.lng - 0.001, locData.lat, 16, 2000);
  }, [flyToLocation]);

  const mapCanvas = useMemo(() => (
    <Map ref={mapRef}
      mapStyle={colorfull}
      minZoom={5}
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
    >
      <ClickedMarker point={infoClicked} setPoint={setInfoClicked} />
      <ClusterLocations />
      <RouteLayer />
      <UserMarker />
      <MapMarkers
        locations={locations}
        viewMode={markerViewMode}
        onLocationClick={handleLocationClick}
        zoom={currentZoom}
      />
    </Map>
  ), [
    handleMapChange,
    handleClick,
    markerViewMode,
    handleLocationClick,
    handlePhotoUpload,
    zoomIn,
    zoomOut,
    infoClicked,
    handleSearchSelect,
    currentZoom,
    locations,
  ]);

  return (
    <div className="h-screen w-full relative overflow-hidden bg-map-bg text-text-primary">
      {mapCanvas}

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
      />

      <SearchBox onSelectLocation={handleSearchSelect} />

      <OnlineCommunityBar />

      <AnimatePresence>
        {activeLocation && (
          <LocationSidebar
            location={activeLocation}
            onClose={() => {
              setActiveLocation(null);
              if (routerLocation.search) {
                navigate('/', { replace: true });
              }
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
