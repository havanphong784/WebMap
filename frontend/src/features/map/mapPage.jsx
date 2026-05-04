import { useLocation, useNavigate } from 'react-router-dom';
import Map, { Marker } from 'react-map-gl/maplibre';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import ClickedMarker from "./components/clickedMarker.jsx";
import { useCallback, useEffect, useRef, useState } from "react";
import { getAddress } from "./utils/geocoding.js";
import { debounce } from "./utils/performance.js";
import MapStyleSwitcher from "./components/mapStyleSwitcher.jsx";
import SearchBox from "./components/searchBox.jsx";
import { useLocationStore } from "./store/useLocationsStore.jsx";
import { useAuthStore } from "../auth/context/authContext.jsx";
import ClusterLocations from "./components/clusterLocations.jsx";
import LocationCard from "./components/locationCard.jsx";
import LocationSidebar from "./components/locationSidebar.jsx";
import RouteLayer from "./components/routeLayer.jsx";
import { AnimatePresence, motion } from 'framer-motion';
import {
  LocateIcon,
  MinusIcon,
  PhotoIcon,
  PlusIcon,
  SpinnerIcon,
  StyleIcon
} from "../../shared/components/common/icons.jsx";
import GlassPanel from "../../shared/components/common/glassPanel.jsx";
import ActionButton from "../../shared/components/common/actionButton.jsx";
import colorfull from "./style/colorful";
import { extractGPS } from "./utils/exifUtils.js";


export default function MapPage() {
  const navigate = useNavigate();
  const routerLocation = useLocation();
  const mapRef = useRef(null);

  const [infoClicked, setInfoClicked] = useState(null);
  const [activeStyle, setActiveStyle] = useState(colorfull);
  const [showStyleSwitcher, setShowStyleSwitcher] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);

  const setUserLocation = useLocationStore(state => state.setUserLocation);
  const setAccuracy = useLocationStore(state => state.setAccuracy);
  const userLocation = useLocationStore(state => state.userLocation);
  const accuracy = useLocationStore(state => state.accuracy);

  useEffect(() => {
    if (!navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setUserLocation([pos.coords.longitude, pos.coords.latitude]);
        setAccuracy(pos.coords.accuracy);
      },
      (err) => console.error("Lỗi định vị:", err),
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
        const found = locations.find(l => String(l.id) === locationId);
        if (found) {
          setActiveLocation(found);
          setInfoClicked(null);
          return;
        }
      }

      setInfoClicked({ lng, lat, address: null });
      const diachi = await getAddress(lat, lng);
      setInfoClicked({ lng, lat, address: diachi });
    }, 300);

    return () => clearTimeout(timer);
  }, [isMapReady, routerLocation.search, flyToLocation, locations]);

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

  const handleClick = async (e) => {
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
  }

  const handleSearchSelect = async (lng, lat, addressName) => {
    flyToLocation(lng, lat, 15);
    setInfoClicked({ lng, lat, address: { display_name: addressName } });
    const diachi = await getAddress(lat, lng);
    setInfoClicked({ lng, lat, address: diachi });
  };

  const debouncedFetch = useRef(
    debounce((uid, bounds) => {
      fetchLocations(uid, bounds);
    }, 400)
  ).current;

  const handleMapChange = useCallback(() => {
    if (mapRef.current) {
      const map = mapRef.current.getMap();
      const bounds = map.getBounds();
      const zoom = map.getZoom();

      setCurrentZoom(zoom);
      debouncedFetch(user?.uid, bounds);
    }
  }, [user, debouncedFetch]);

  const handleLocateUser = () => {
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
        alert("Không thể truy cập vị trí của bạn. Vui lòng cho phép quyền truy cập vị trí.");
      },
      { enableHighAccuracy: true }
    );
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert("Vui lòng chọn tệp hình ảnh!");
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
        alert("Ảnh này không chứa thông tin vị trí (GPS metadata).");
      }
    } catch (error) {
      console.error("Lỗi khi xử lý ảnh:", error);
      alert("Không thể trích xuất vị trí từ ảnh.");
    } finally {
      setIsExtractingPhoto(false);
      e.target.value = "";
    }
  };

  const zoomIn = () => {
    if (mapRef.current) {
      const map = mapRef.current.getMap();
      map.zoomIn();
    }
  };

  const zoomOut = () => {
    if (mapRef.current) {
      const map = mapRef.current.getMap();
      map.zoomOut();
    }
  };

  return (
    <div className="h-screen w-full relative overflow-hidden bg-map-bg text-text-primary">
      <Map ref={mapRef}
        mapStyle={activeStyle}
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
        <div className="absolute top-6 right-6 z-100">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              if (user?.uid) navigate(`/profile/${user.uid}`);
              else navigate('/login');
            }}
            className="bg-obsidian flex items-center gap-2 glass-panel p-1.5 pr-4 border-glass-border cursor-pointer shadow-neon"
          >
            <div className="w-9 h-9 rounded-full border-2 border-cyan-glow shadow-neon overflow-hidden ">
              <img
                src={user?.photoURL || "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y"}
                className="w-full h-full object-cover"
                alt="user"
              />
            </div>
            <span className="text-text-primary text-[10px] font-bold tracking-widest uppercase">
              {user ? 'Hồ sơ' : 'Đăng nhập'}
            </span>
          </motion.div>
        </div>

        <div className="absolute right-6 top-1/2 -translate-y-1/2 z-100 flex flex-col gap-4">
          <ActionButton
            variant="icon"
            onClick={() => setShowStyleSwitcher(!showStyleSwitcher)}
            className={showStyleSwitcher ? "bg-cyan-glow/20 border-cyan-glow" : "bg-obsidian "}
          >
            <StyleIcon size={22} className={showStyleSwitcher ? "text-cyan-glow" : "text-text-primary"} />
          </ActionButton>

          <ActionButton
            variant="icon"
            onClick={handleLocateUser}
            disabled={isLocating}
            className="bg-obsidian"
          >
            {isLocating ? <SpinnerIcon size={22} className="text-cyan-glow animate-spin" /> :
              <LocateIcon size={22} className="text-cyan-glow" />}
          </ActionButton>

          <ActionButton
            variant="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={isExtractingPhoto}
            className="bg-obsidian"
          >
            {isExtractingPhoto ? <SpinnerIcon size={22} className="text-cyan-glow animate-spin" /> :
              <PhotoIcon size={22} className="text-cyan-glow" />}
          </ActionButton>

          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="*"
            onChange={handlePhotoUpload}
          />

          <div className="flex flex-col bg-obsidian gap-2 glass-panel p-2 rounded-2xl border-glass-border">
            <ActionButton variant="icon" className="bg-transparent border-none shadow-none" onClick={zoomIn}>
              <PlusIcon size={22} className="text-text-primary" />
            </ActionButton>
            <div className="h-px w-full bg-glass-border mx-auto" style={{ width: '60%' }}></div>
            <ActionButton variant="icon" className="bg-transparent border-none shadow-none" onClick={zoomOut}>
              <MinusIcon size={22} className="text-text-primary" />
            </ActionButton>
          </div>
        </div>

        <ClickedMarker point={infoClicked} setPoint={setInfoClicked} />
        <SearchBox onSelectLocation={handleSearchSelect} />
        <ClusterLocations />
        <RouteLayer />

        {userLocation && (
          <Marker longitude={userLocation[0]} latitude={userLocation[1]} anchor="center">
            <div className="relative flex items-center justify-center">
              <div className="absolute w-12 h-12 bg-cyan-glow/30 rounded-full animate-ping"></div>
              <div className="absolute w-24 h-24 bg-cyan-glow/10 rounded-full animate-pulse"></div>

              <div
                className="relative w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(0,243,255,1)]">
                <div className="w-3 h-3 bg-cyan-glow rounded-full"></div>
              </div>
            </div>
          </Marker>
        )}

        {currentZoom >= 13 && locations.map(loc => (
          <LocationCard
            key={loc.id}
            location={loc}
            onClick={(locData) => {
              setInfoClicked(null);
              setActiveLocation(locData)
              flyToLocation(locData.lng - 0.001, locData.lat, 16, 2000);
            }}
          />
        ))}

        <AnimatePresence>
          {showStyleSwitcher && (
            <div className="absolute right-24 top-1/2 -translate-y-1/2 z-100">
              <MapStyleSwitcher
                currentStyleUrl={activeStyle}
                onStyleChange={(newStyle) => {
                  setActiveStyle(newStyle);
                  setShowStyleSwitcher(false);
                }}
                isStandalone={false}
              />
            </div>
          )}
        </AnimatePresence>
      </Map>

      <div className="absolute bottom-32 left-1/2 -translate-x-1/2 z-10 w-[90%] max-w-xl pointer-events-none">
        <GlassPanel
          className="py-3 px-6 rounded-2xl bg-obsidian border-glass-border flex items-center justify-between shadow-glass">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-sunset animate-pulse shadow-sunset"></div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">
              Cộng đồng <span className="text-text-primary">Trực tuyến</span>
            </span>
          </div>
          <div className="flex -space-x-3">
            {[1, 2, 3].map(i => (
              <img key={i} src={`https://picsum.photos/50/50?random=${i + 10}`}
                className="w-7 h-7 rounded-full border-2 border-map-bg shadow-lg" alt="u" />
            ))}
          </div>
        </GlassPanel>
      </div>

      <AnimatePresence>
        {activeLocation && (
          <LocationSidebar
            location={activeLocation}
            onClose={() => setActiveLocation(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

