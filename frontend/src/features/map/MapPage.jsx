import {useCallback, useRef, useState} from "react";
import {useLocation, useNavigate} from "react-router-dom";
import {AnimatePresence} from "framer-motion";
import MapView from "./MapView.jsx";
import MapChatbot from "../chatbot/components/mapChatbot.jsx";
import {useLocationStore} from "./store/useLocationsStore.jsx";
import {useWeatherStore} from "./store/useWeatherStore.jsx";
import {useToastStore} from "../../shared/components/toast/useToastStore.jsx";
import useWindowSize from "../../shared/hooks/useWindowSize.jsx";
import {extractGPS} from "./utils/exifUtils.js";
import {getAddress, getPlaceDetail} from "./utils/geocoding.js";
import {getPoiName} from "./config/mapConfig.js";

import MapControls from "./overlays/MapControls.jsx";
import OnlineCommunityBar from "./overlays/OnlineCommunityBar.jsx";
import OnlineFriendsPane from "./overlays/OnlineFriendsPane.jsx";
import SearchBox from "./overlays/SearchBox.jsx";
import UserProfileButton from "./overlays/UserProfileButton.jsx";
import WeatherEffects from "./overlays/WeatherEffects.jsx";
import WeatherWidget from "./overlays/WeatherWidget.jsx";
import LocationSidebar from "./panels/LocationSidebar.jsx";
import {getCurrentPosition} from "../../platform/location.js";

/**
 * MapPage - composition layer.
 * Chỉ chịu trách nhiệm: render UI overlay + xử lý các action ở UI.
 * Toàn bộ logic map (layers, markers, GPS, focus...) đã đóng gói trong MapView.
 */
export default function MapPage() {
  const navigate = useNavigate();
  const routerLocation = useLocation();
  const mapViewRef = useRef(null);
  const fileInputRef = useRef(null);

  const {width} = useWindowSize();
  const mobile = width <= 768;

  const [activeLocation, setActiveLocation] = useState(null);
  const [infoClicked, setInfoClicked] = useState(null);
  const [markerViewMode, setMarkerViewMode] = useState("full");
  const [isLocating, setIsLocating] = useState(false);
  const [isExtractingPhoto, setIsExtractingPhoto] = useState(false);

  const setUserLocation = useLocationStore((s) => s.setUserLocation);
  const setAccuracy = useLocationStore((s) => s.setAccuracy);
  const setRouteData = useLocationStore((s) => s.setRouteData);
  const mapLoading = useLocationStore((s) => s.mapLoading);
  const mapError = useLocationStore((s) => s.mapError);
  const routeError = useLocationStore((s) => s.routeError);
  const locationPermission = useLocationStore((s) => s.locationPermission);
  const setLocationPermission = useLocationStore((s) => s.setLocationPermission);

  const isWeatherVisible = useWeatherStore((s) => s.isVisible);
  const toggleWeather = useWeatherStore((s) => s.toggleVisibility);

  const addToast = useToastStore((s) => s.addToast);

  const flyToLocation = useCallback((...args) => mapViewRef.current?.flyTo?.(...args), []);

  const handlePoiClick = useCallback(async (e, poiFeature) => {
    const {lng, lat} = e.lngLat;
    const poiName = getPoiName(poiFeature);

    setActiveLocation(null);
    setRouteData(null);
    flyToLocation(lng, lat, 17);
    
    // Hiện loading state
    setInfoClicked({lng, lat, name: poiName, address: {display_name: "Đang tải địa chỉ..."}});

    try {
      // Reverse geocode để lấy địa chỉ + place_id
      const addr = await getAddress(lat, lng);
      
      // Nếu có place_id, fetch detail từ Goong
      let detail = null;
      if (addr?.place_id) {
        detail = await getPlaceDetail(addr.place_id);
      }

      // Nếu detail có lat/lng, dùng nó; nếu không, dùng tọa độ từ click event
      if (detail?.lat && detail?.lng) {
        setInfoClicked(null);
        setActiveLocation({
          ...detail,
          name: poiName || detail.name,
          lat: Number(detail.lat),
          lng: Number(detail.lng),
        });
      } else {
        // Fallback: hiện popup với địa chỉ từ reverse geocode
        setInfoClicked({
          lng,
          lat,
          name: poiName,
          address: addr || {display_name: "Không xác định được địa chỉ"},
        });
      }
    } catch (err) {
      console.error("POI click error:", err);
      
      // Determine error type and provide helpful message
      let errorMessage = "Không thể tải thông tin địa chỉ";
      if (err.message?.includes("network") || err.message?.includes("fetch")) {
        errorMessage = "Lỗi kết nối. Vui lòng kiểm tra internet.";
      } else if (err.message?.includes("timeout")) {
        errorMessage = "Yêu cầu hết thời gian. Vui lòng thử lại.";
      }
      
      // Fallback: hiện popup với tọa độ
      setInfoClicked({
        lng,
        lat,
        name: poiName,
        address: {display_name: errorMessage},
      });
      
      // Show toast notification for better visibility
      addToast(errorMessage, "error");
    }
  }, [flyToLocation, setRouteData, addToast]);

  const handleEmptyAreaClick = useCallback(async (e) => {
    setActiveLocation(null);
    setRouteData(null);
    const {lng, lat} = e.lngLat;
    flyToLocation(lng, lat, 16);
    setInfoClicked({lng, lat, address: {display_name: "Đang xác định vị trí..."}});
    
    try {
      const addr = await getAddress(lat, lng);
      setInfoClicked({lng, lat, address: addr});
    } catch (err) {
      console.error("Empty area click error:", err);
      setInfoClicked({
        lng, 
        lat, 
        address: {display_name: "Không thể xác định vị trí"}
      });
    }
  }, [flyToLocation, setRouteData]);

  const handleSearchSelect = useCallback(async (item) => {
    if (!item) return;
    setActiveLocation(null);
    setInfoClicked(null);
    setRouteData(null);

    const itemLng = Number(item.lng ?? item.lon);
    const itemLat = Number(item.lat);
    const hasCoords = Number.isFinite(itemLng) && Number.isFinite(itemLat);

    if (hasCoords) {
      flyToLocation(itemLng, itemLat, 16, 1600, true);
      setActiveLocation({...item, lng: itemLng, lat: itemLat, kind: "goong_place", source: "goong"});
    }

    const detail = item.place_id ? await getPlaceDetail(item.place_id) : null;
    const selected = detail || (hasCoords ? item : null);
    const lng = Number(selected?.lng ?? selected?.lon);
    const lat = Number(selected?.lat);

    if (Number.isFinite(lng) && Number.isFinite(lat)) {
      flyToLocation(lng, lat, 16, 1600, true);
      setActiveLocation({
        ...selected,
        lng, lat,
        kind: selected.kind || "goong_place",
        source: selected.source || "goong",
      });
      return;
    }

    addToast("Không lấy được tọa độ từ Goong cho địa điểm này.", "error");
  }, [addToast, flyToLocation, setRouteData]);

  const handleLocateUser = useCallback(() => {
    setIsLocating(true);
    void getCurrentPosition({enableHighAccuracy: true}).then(
      (pos) => {
        const {longitude, latitude, accuracy} = pos.coords;
        setUserLocation([longitude, latitude]);
        setAccuracy(accuracy);
        setLocationPermission("granted");
        flyToLocation(longitude, latitude, 16, 2000);
        setIsLocating(false);
      },
      (error) => {
        setIsLocating(false);
        setLocationPermission(error?.code === "LOCATION_DENIED" ? "denied" : "unavailable");
        addToast(error?.code === "LOCATION_DENIED"
          ? "Quyền vị trí đang tắt. Hãy cấp quyền trong Cài đặt rồi thử lại."
          : "Không lấy được GPS. Hãy bật định vị rồi thử lại.", "error");
      },
    );
  }, [addToast, flyToLocation, setUserLocation, setAccuracy, setLocationPermission]);

  const handleFlyToOnlineUser = useCallback((onlineUser) => {
    const lat = Number.parseFloat(onlineUser?.current_lat);
    const lng = Number.parseFloat(onlineUser?.current_lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      addToast("Người dùng này chưa chia sẻ vị trí hiện tại.", "error");
      return;
    }
    setActiveLocation(null);
    setInfoClicked(null);
    setRouteData(null);
    flyToLocation(lng, lat, 16, 1600, true);
  }, [addToast, flyToLocation, setRouteData]);

  const handlePhotoUpload = useCallback(async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      addToast("Vui lòng chọn tệp hình ảnh!", "error");
      return;
    }
    setIsExtractingPhoto(true);
    try {
      const gps = await extractGPS(file);
      if (gps) {
        flyToLocation(gps.lng, gps.lat, 17);
        setInfoClicked({lng: gps.lng, lat: gps.lat, address: null, imageFile: file, autoOpenForm: true});
        try {
          const addr = await getAddress(gps.lat, gps.lng);
          setInfoClicked({lng: gps.lng, lat: gps.lat, address: addr, imageFile: file, autoOpenForm: true});
        } catch (err) {
          console.error("Error getting address from photo GPS:", err);
          // Still show the form even if address fetch fails
          setInfoClicked({
            lng: gps.lng, 
            lat: gps.lat, 
            address: {display_name: "Không thể xác định địa chỉ"}, 
            imageFile: file, 
            autoOpenForm: true
          });
        }
      } else {
        addToast("Ảnh này không chứa thông tin vị trí (GPS metadata).", "error");
      }
    } catch (err) {
      console.error("Photo extraction error:", err);
      addToast("Không thể trích xuất vị trí từ ảnh.", "error");
    } finally {
      setIsExtractingPhoto(false);
      e.target.value = "";
    }
  }, [addToast, flyToLocation]);

  const handleLocationSaved = useCallback((savedLocation) => {
    if (!savedLocation) return;
    setInfoClicked(null);
    setActiveLocation(savedLocation);
    flyToLocation(savedLocation.lng, savedLocation.lat, 16, 1200, true);
  }, [flyToLocation]);

  const handleSidebarAddReview = useCallback(() => {
    if (!activeLocation) return;
    setInfoClicked({
      lng: activeLocation.lng,
      lat: activeLocation.lat,
      address: activeLocation.address,
      name: activeLocation.name,
      category: activeLocation.category,
      tags: activeLocation.tags,
      autoOpenForm: true,
    });
    setActiveLocation(null);
  }, [activeLocation]);

  const showOverlay = !mobile || !activeLocation;

  return (
    <div className="app-screen w-full relative overflow-hidden bg-map-bg text-text-primary">
      <MapView
        ref={mapViewRef}
        mobile={mobile}
        activeLocation={activeLocation}
        setActiveLocation={setActiveLocation}
        infoClicked={infoClicked}
        setInfoClicked={setInfoClicked}
        markerViewMode={markerViewMode}
        onLocationSaved={handleLocationSaved}
        onPoiClick={handlePoiClick}
        onEmptyAreaClick={handleEmptyAreaClick}
      />

      {showOverlay && <WeatherWidget />}
      {showOverlay && <WeatherEffects />}
      <UserProfileButton />
      {showOverlay && (
        <MapControls
          onLocate={handleLocateUser}
          isLocating={isLocating}
          onPhotoUpload={handlePhotoUpload}
          isExtractingPhoto={isExtractingPhoto}
          viewMode={markerViewMode}
          setViewMode={setMarkerViewMode}
          onZoomIn={() => mapViewRef.current?.zoomIn?.()}
          onZoomOut={() => mapViewRef.current?.zoomOut?.()}
          fileInputRef={fileInputRef}
          isVisible={isWeatherVisible}
          onToggleWeather={toggleWeather}
        />
      )}
      {showOverlay && <SearchBox onSelectLocation={handleSearchSelect} />}

      {showOverlay && !["checking", "granted"].includes(locationPermission) && (
        <div className="absolute left-1/2 top-[calc(5rem+var(--app-safe-top))] z-30 w-[calc(100%-1.5rem)] max-w-lg -translate-x-1/2 rounded-2xl border border-cyan-glow/30 bg-white/95 p-3 text-xs text-text-primary shadow-floating backdrop-blur-xl">
          <p>{locationPermission === "denied"
            ? "Aether cần quyền vị trí để hiển thị bạn trên bản đồ. Bạn vẫn có thể dùng bản đồ khi chưa cấp quyền."
            : "Chưa thể đọc GPS. Hãy bật dịch vụ vị trí rồi thử lại."}</p>
          <button type="button" onClick={handleLocateUser} className="mt-2 font-bold text-cyan-glow">
            {locationPermission === "denied" ? "Cấp quyền / thử lại" : "Thử lại GPS"}
          </button>
        </div>
      )}
      {showOverlay && <OnlineFriendsPane onFlyToUser={handleFlyToOnlineUser} />}
      {!mobile && <OnlineCommunityBar />}

      {(mapLoading || mapError || routeError) && (
        <div className="absolute left-3 top-32 z-[60] max-w-[calc(100%-6rem)] sm:left-6 sm:top-24 sm:max-w-sm pointer-events-none">
          <div className={`rounded-2xl border px-4 py-3 text-xs font-bold shadow-glass backdrop-blur-2xl ${
            mapError || routeError
              ? "border-sunset/25 bg-white/95 text-sunset"
              : "border-cyan-glow/20 bg-white/90 text-cyan-glow"
          }`}>
            {mapError || routeError || "Đang cập nhật địa điểm..."}
          </div>
        </div>
      )}

      <AnimatePresence>
        {activeLocation && (
          <LocationSidebar
            location={activeLocation}
            onAddReview={handleSidebarAddReview}
            onClose={() => {
              setActiveLocation(null);
              if (routerLocation.search) navigate("/map", {replace: true});
            }}
          />
        )}
      </AnimatePresence>

      {showOverlay && (
        <MapChatbot
          onLocationClick={(loc) => {
            if (!loc?.id) return;
            setActiveLocation(loc);
            flyToLocation(loc.lng, loc.lat, 16, 1600, true);
          }}
        />
      )}
    </div>
  );
}
