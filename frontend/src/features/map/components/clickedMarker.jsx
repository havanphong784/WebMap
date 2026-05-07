import { useEffect, useState } from "react";
import { Marker } from "react-map-gl/maplibre";
import LocationFormModal from "./locationFormModal.jsx";
import { useLocationStore } from "../store/useLocationsStore.jsx";
import { AnimatePresence, motion } from "framer-motion";
import { CloseIcon, PinIcon, PlusIcon, RouteIcon, SpinnerIcon } from "../../../shared/components/common/icons.jsx";
import GlassPanel from "../../../shared/components/common/glassPanel.jsx";
import ActionButton from "../../../shared/components/common/actionButton.jsx";
import Skeleton, {SkeletonTheme} from "react-loading-skeleton";

export default function ClickedMarker({ point, setPoint }) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { fetchRoute, routeLoading, setRouteLoading, userLocation } = useLocationStore();

  useEffect(() => {
    if (point?.autoOpenForm) {
      setIsFormOpen(true);
    }
  }, [point]);

  if (!point) return null;

  const handleGetDirections = (e) => {
    e.stopPropagation();
    if (routeLoading) return;

    const end = [point.lng, point.lat];

    if (userLocation) {
      fetchRoute(userLocation, end);
      setPoint(null);
      return;
    }

    setRouteLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const start = [pos.coords.longitude, pos.coords.latitude];
        fetchRoute(start, end);
        setPoint(null);
      },
      (error) => {
        setRouteLoading(false);
        console.error("Lỗi định vị:", error);
        alert("Không thể lấy vị trí của bạn. Vui lòng cho phép truy cập vị trí.");
      },
      { timeout: 5000, enableHighAccuracy: true }
    );
  };

  return (
    <>
      <Marker longitude={point.lng} latitude={point.lat} anchor="center" style={{ zIndex: 500 }}>
        <div className="relative flex items-center justify-center">
          <div className="absolute w-10 h-10 bg-cyan-glow/20 rounded-full animate-ping"></div>
          <div className="w-4 h-4 bg-cyan-glow rounded-full shadow-neon border-2 border-text-primary z-10"></div>

          <AnimatePresence>
            {!isFormOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.9, x: "-50%" }}
                animate={{ opacity: 1, y: 0, scale: 1, x: "-50%" }}
                exit={{ opacity: 0, y: 10, scale: 0.9, x: "-50%" }}
                className="absolute bottom-8 left-1/2 z-200"
              >
                <GlassPanel
                  className="w-64 p-5 border-glass-border-bright bg-glass-obsidian backdrop-blur-3xl shadow-glass rounded-2xl overflow-hidden ring-1 ring-glass-border">
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

                  <div className="text-[12px] font-bold text-text-primary mb-5 leading-tight line-clamp-2">
                    {!point.address ? (
                      <SkeletonTheme baseColor="rgba(255,255,255,0.05)" highlightColor="rgba(255,255,255,0.1)">
                        <div className="space-y-1">
                          <Skeleton height={14} width="100%" />
                          <Skeleton height={14} width="80%" />
                        </div>
                      </SkeletonTheme>
                    ) : (
                      point.address?.display_name || "Không xác định được địa chỉ"
                    )}
                  </div>

                  <div className="flex flex-col gap-2.5">
                    <ActionButton
                      onClick={() => setIsFormOpen(true)}
                      className="w-full !py-2.5 gap-2 text-[10px] uppercase tracking-widest shadow-none"
                    >
                      <PlusIcon size={14} /> Thêm địa điểm
                    </ActionButton>

                    <button
                      onClick={handleGetDirections}
                      disabled={routeLoading}
                      className="w-full flex items-center justify-center gap-2 glass-panel border-glass-border bg-glass-white py-2.5 text-text-secondary hover:text-text-primary hover:bg-white/10 transition-all text-[10px] font-bold uppercase tracking-widest"
                    >
                      {routeLoading ? (
                        <SpinnerIcon size={14} className="animate-spin text-cyan-glow" />
                      ) : <RouteIcon size={14} className="text-cyan-glow" />}
                      Chỉ đường
                    </button>
                  </div>
                </GlassPanel>
                <div
                  className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-glass-obsidian border-b border-r border-glass-border rotate-45"></div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Marker>

      {isFormOpen && (
        <LocationFormModal
          point={point}
          onClose={() => {
            setIsFormOpen(false);
            setPoint(null);
          }}
        />
      )}
    </>
  );
}

