import { useLocation, useNavigate } from 'react-router-dom';
import Map from 'react-map-gl/maplibre';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import ClickedMarker from "../../components/Map/ClickedMarker.jsx";
import { useCallback, useEffect, useRef, useState } from "react";
import { getAddress } from "../../utils/geocoding.js";
import { debounce } from "../../utils/performance.js";
import MapStyleSwitcher from "../../components/Map/MapStyleSwitcher.jsx";
import SearchBox from "../../components/Map/SearchBox.jsx";
import { useLocationStore } from "../../store/useLocationsStore.jsx";
import { useAuthStore } from "../../context/AuthContext.jsx";
import ClusterLocations from "../../components/Map/ClusterLocations.jsx";
import LocationCard from "../../components/Map/LocationCard.jsx";
import LocationSidebar from "../../components/Map/LocationSidebar.jsx";
import RouteLayer from "../../components/Map/RouteLayer.jsx";
import { motion, AnimatePresence } from 'framer-motion';
import { StyleIcon, LocateIcon, PlusIcon, MinusIcon, SpinnerIcon } from '../../components/common/Icons';
import GlassPanel from '../../components/common/GlassPanel';
import ActionButton from '../../components/common/ActionButton';

export default function MapPage() {
  const navigate = useNavigate();
  const routerLocation = useLocation();
  const mapRef = useRef(null);

  const [infoClicked, setInfoClicked] = useState(null);
  const [activeStyle, setActiveStyle] = useState("https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json");
  const [showStyleSwitcher, setShowStyleSwitcher] = useState(false);
  
  const fetchLocations = useLocationStore(state => state.fetchLocations);
  const locations = useLocationStore(state => state.locations);
  const routeData = useLocationStore(state => state.routeData);
  const { user } = useAuthStore();
  const [currentZoom, setCurrentZoom] = useState(13);
  const [activeLocation, setActiveLocation] = useState(null);
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    if (routerLocation.state?.focusLocation && mapRef.current) {
      const loc = routerLocation.state.focusLocation;
      const lng = parseFloat(loc.lng);
      const lat = parseFloat(loc.lat);
      
      if (!isNaN(lng) && !isNaN(lat)) {
        setActiveLocation(loc);
        setTimeout(() => {
          mapRef.current?.flyTo({
            center: [lng, lat],
            zoom: 16,
            duration: 2500,
            essential: true
          });
        }, 100);
      }
    }
  }, [routerLocation.state]);

  useEffect(() => {
    const coordinates = routeData?.coordinates;
    if (!mapRef.current || !coordinates?.length) return;

    const map = mapRef.current.getMap();
    if (!map) return;

    const bounds = new maplibregl.LngLatBounds(coordinates[0], coordinates[0]);
    coordinates.slice(1).forEach((coordinate) => bounds.extend(coordinate));

    map.fitBounds(bounds, {
      padding: { top: 100, bottom: 100, left: 100, right: 100 },
      duration: 1200,
      essential: true,
    });
  }, [routeData]);

  const handleClick = async (e) => {
    const { lng, lat } = e.lngLat;
    mapRef.current.flyTo({
      center: [lng, lat],
      zoom: 16,
      pitch: 45,
      bearing: 0,
      duration: 2000
    });
    setInfoClicked({ lng, lat, address: "Đang tìm địa chỉ..." });
    const diachi = await getAddress(lat, lng);
    setInfoClicked({ lng, lat, address: diachi });
  }

  const handleSearchSelect = async (lng, lat, addressName) => {
    mapRef.current.flyTo({
      center: [lng, lat],
      zoom: 16,
      pitch: 45,
      bearing: 0,
      duration: 2500
    });
    setInfoClicked({ lng, lat, address: addressName });
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
        mapRef.current.flyTo({
          center: [pos.coords.longitude, pos.coords.latitude],
          zoom: 16,
          duration: 2000
        });
        setIsLocating(false);
      },
      () => {
        setIsLocating(false);
        alert("Không thể truy cập vị trí của bạn.");
      }
    );
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
    <div className="h-screen w-full relative overflow-hidden bg-obsidian">
      <Map ref={mapRef}
        onLoad={handleMapChange}
        onMoveEnd={handleMapChange}
        mapLib={maplibregl}
        antialias={true}
        attributionControl={false}
        initialViewState={{
          longitude: 105.804817,
          latitude: 21.028511,
          zoom: 13,
          pitch: 45,
          bearing: 0
        }}
        style={{ width: '100%', height: '100%' }}
        mapStyle={activeStyle}
        onClick={handleClick}
      >
        <div className="absolute top-6 right-6 z-[100]">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              if (user?.uid) navigate(`/profile/${user.uid}`);
              else navigate('/login');
            }}
            className="flex items-center gap-2 glass-panel p-1.5 pr-4 border-white/20 cursor-pointer shadow-neon"
          >
            <div className="w-9 h-9 rounded-full border-2 border-cyan-glow shadow-neon overflow-hidden bg-white/10">
              <img 
                src={user?.photoURL || "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y"} 
                className="w-full h-full object-cover" 
                alt="user" 
              />
            </div>
            <span className="text-white text-[10px] font-bold tracking-widest uppercase">
              {user ? 'Hồ sơ' : 'Đăng nhập'}
            </span>
          </motion.div>
        </div>

        <div className="absolute right-6 top-1/2 -translate-y-1/2 z-[100] flex flex-col gap-4">
          <ActionButton 
            variant="icon" 
            onClick={() => setShowStyleSwitcher(!showStyleSwitcher)}
            className={showStyleSwitcher ? "bg-cyan-glow/20 border-cyan-glow" : ""}
          >
            <StyleIcon size={22} className={showStyleSwitcher ? "text-cyan-glow" : "text-white"} />
          </ActionButton>

          <ActionButton 
            variant="icon" 
            onClick={handleLocateUser}
            disabled={isLocating}
          >
            {isLocating ? <SpinnerIcon size={22} className="text-cyan-glow animate-spin" /> : <LocateIcon size={22} className="text-cyan-glow" />}
          </ActionButton>

          <div className="flex flex-col gap-2 glass-panel p-2 rounded-2xl border-white/10">
            <ActionButton variant="icon" className="bg-transparent border-none shadow-none" onClick={zoomIn}>
              <PlusIcon size={22} className="text-white" />
            </ActionButton>
            <div className="h-[1px] w-full bg-white/10 mx-auto" style={{ width: '60%' }}></div>
            <ActionButton variant="icon" className="bg-transparent border-none shadow-none" onClick={zoomOut}>
              <MinusIcon size={22} className="text-white" />
            </ActionButton>
          </div>
        </div>

        <ClickedMarker point={infoClicked} setPoint={setInfoClicked} />
        <SearchBox onSelectLocation={handleSearchSelect} />
        <ClusterLocations />
        <RouteLayer />
        
        {currentZoom >= 13 && locations.map(loc => (
          <LocationCard
            key={loc.id}
            location={loc}
            onClick={(locData) => setActiveLocation(locData)}
          />
        ))}

        <AnimatePresence>
          {showStyleSwitcher && (
            <div className="absolute right-20 top-1/2 -translate-y-1/2 z-[100]">
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
        <GlassPanel className="py-3 px-6 rounded-2xl bg-black/40 border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-sunset animate-pulse shadow-sunset"></div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-300">
              Cộng đồng <span className="text-white">Trực tuyến</span>
            </span>
          </div>
          <div className="flex -space-x-3">
            {[1, 2, 3].map(i => (
              <img key={i} src={`https://picsum.photos/50/50?random=${i + 10}`} className="w-7 h-7 rounded-full border-2 border-obsidian shadow-lg" alt="u" />
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
