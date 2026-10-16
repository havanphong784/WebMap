import {lazy, Suspense, useCallback, useState} from "react";
import {Marker} from "react-map-gl/maplibre";
import {useNavigate} from "react-router-dom";
import {AnimatePresence, motion} from "framer-motion";
import Skeleton, {SkeletonTheme} from "react-loading-skeleton";
import {useLocationStore} from "../store/useLocationsStore.jsx";
import {useAuthStore} from "../../auth/context/authStore.js";
import {useToastStore} from "../../../shared/components/toast/useToastStore.jsx";
import GlassPanel from "../../../shared/components/common/glassPanel.jsx";
import ActionButton from "../../../shared/components/common/actionButton.jsx";
import {CloseIcon, PinIcon, PlusIcon, RouteIcon, SpinnerIcon} from "../../../shared/components/common/icons.jsx";
import {getCurrentPosition} from "../../../platform/location.js";

const LocationFormModal = lazy(() => import("../modals/LocationFormModal.jsx"));

/**
 * Marker tạm khi user click vào map (POI hoặc empty area).
 * Hiển thị popup "Thêm địa điểm" / "Chỉ đường", chuyển sang LocationFormModal khi user thêm.
 */
export default function ClickedMarker({point, setPoint, onLocationSaved}) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const fetchRoute = useLocationStore((s) => s.fetchRoute);
  const routeLoading = useLocationStore((s) => s.routeLoading);
  const setRouteLoading = useLocationStore((s) => s.setRouteLoading);
  const userLocation = useLocationStore((s) => s.userLocation);
  const {user} = useAuthStore();
  const navigate = useNavigate();
  const addToast = useToastStore((s) => s.addToast);
  const shouldShowForm = isFormOpen || Boolean(point?.autoOpenForm);

  const handleGetDirections = useCallback((e) => {
    e.stopPropagation();
    if (routeLoading || !point) return;

    const end = [point.lng, point.lat];
    if (userLocation) {
      fetchRoute(userLocation, end);
      setPoint(null);
      return;
    }

    setRouteLoading(true);
    void getCurrentPosition({timeout: 5000, enableHighAccuracy: true}).then(
      (pos) => {
        fetchRoute([pos.coords.longitude, pos.coords.latitude], end);
        setPoint(null);
      },
      () => {
        setRouteLoading(false);
        addToast("Không thể lấy vị trí của bạn. Vui lòng cho phép truy cập vị trí.", "error");
      },
    );
  }, [point, routeLoading, userLocation, fetchRoute, setPoint, setRouteLoading, addToast]);

  if (!point) return null;

  return (
    <>
      <Marker longitude={point.lng} latitude={point.lat} anchor="center" style={{zIndex: 20}}>
        <div className="relative flex items-center justify-center">
          <div className="absolute w-10 h-10 bg-cyan-glow/20 rounded-full animate-ping" />
          <div className="w-4 h-4 bg-cyan-glow rounded-full shadow-neon border-2 border-text-primary z-10" />

          <AnimatePresence>
            {!shouldShowForm && (
              <motion.div
                initial={{opacity: 0, y: 10, scale: 0.9, x: "-50%"}}
                animate={{opacity: 1, y: 0, scale: 1, x: "-50%"}}
                exit={{opacity: 0, y: 10, scale: 0.9, x: "-50%"}}
                className="absolute bottom-8 left-1/2 z-10"
              >
                <GlassPanel className="w-64 p-5 border-glass-border-bright bg-glass-obsidian backdrop-blur-3xl shadow-glass rounded-2xl overflow-hidden ring-1 ring-glass-border">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-xl bg-cyan-glow/10 text-cyan-glow">
                        <PinIcon size={14} />
                      </div>
                      <span className="text-[9px] font-bold text-text-muted uppercase tracking-widest">Tọa độ mới</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPoint(null);
                      }}
                      className="text-text-muted hover:text-text-primary transition-colors p-1"
                    >
                      <CloseIcon size={16} />
                    </button>
                  </div>

                  <div className="text-[12px] font-bold text-text-primary mb-5 leading-tight line-clamp-1">
                    {point.name || (point.address ? (point.address.display_name || "Không xác định được địa chỉ") : (
                      <SkeletonTheme baseColor="rgba(255,255,255,0.05)" highlightColor="rgba(255,255,255,0.1)">
                        <div className="space-y-1">
                          <Skeleton height={14} width="100%" />
                          <Skeleton height={14} width="80%" />
                        </div>
                      </SkeletonTheme>
                    ))}
                  </div>

                  {point.name && point.address && (
                    <div className="text-[10px] text-text-muted mb-4 line-clamp-1 opacity-80 italic">
                      {point.address.display_name}
                    </div>
                  )}

                  <div className="flex flex-col gap-2.5">
                    <ActionButton
                      onClick={() => {
                        if (!user) {
                          addToast("Vui lòng đăng nhập để thêm địa điểm.", "error");
                          navigate("/login");
                          return;
                        }
                        setIsFormOpen(true);
                      }}
                      className="w-full !py-2.5 gap-2 text-[10px] uppercase tracking-widest shadow-none"
                    >
                      <PlusIcon size={14} /> Thêm địa điểm
                    </ActionButton>

                    <button
                      onClick={handleGetDirections}
                      disabled={routeLoading}
                      className="w-full flex items-center justify-center gap-2 glass-panel border-glass-border bg-glass-white py-2.5 text-text-secondary hover:text-text-primary hover:bg-white/10 transition-all text-[10px] font-bold uppercase tracking-widest"
                    >
                      {routeLoading
                        ? <SpinnerIcon size={14} className="animate-spin text-cyan-glow" />
                        : <RouteIcon size={14} className="text-cyan-glow" />}
                      Chỉ đường
                    </button>
                  </div>
                </GlassPanel>
                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-glass-obsidian border-b border-r border-glass-border rotate-45" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Marker>

      {shouldShowForm && (
        <Suspense fallback={null}>
          <LocationFormModal
            point={point}
            onSaved={(savedLocation) => onLocationSaved?.(savedLocation)}
            onClose={() => {
              setIsFormOpen(false);
              setPoint(null);
            }}
          />
        </Suspense>
      )}
    </>
  );
}
