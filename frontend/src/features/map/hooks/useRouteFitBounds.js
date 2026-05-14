import {useEffect} from "react";
import maplibregl from "maplibre-gl";

/**
 * Fit bounds map khi có route (LineString) mới.
 * Padding bên trái lớn hơn nếu có sidebar đang mở.
 */
export default function useRouteFitBounds({mapRef, routeData, hasActivePanel}) {
  useEffect(() => {
    const coordinates = routeData?.coordinates;
    if (!mapRef.current || !coordinates?.length) return;
    const map = mapRef.current.getMap?.();
    if (!map) return;

    const bounds = new maplibregl.LngLatBounds(coordinates[0], coordinates[0]);
    coordinates.slice(1).forEach((c) => bounds.extend(c));

    map.fitBounds(bounds, {
      padding: hasActivePanel
        ? {top: 100, bottom: 200, left: 400, right: 100}
        : {top: 100, bottom: 200, left: 100, right: 100},
      duration: 1200,
      essential: true,
    });
  }, [mapRef, routeData, hasActivePanel]);
}
