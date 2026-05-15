import {memo, useEffect, useMemo, useState} from "react";
import {useMap} from "react-map-gl/maplibre";
import LocationCard from "./LocationCard.jsx";
import {useLocationStore} from "../store/useLocationsStore.jsx";
import {LAYER_IDS, MARKER_ZOOM} from "../config/mapConfig.js";

const MAX_VISIBLE_CARDS = 20;

/**
 * Render LocationCard React Markers chỉ cho điểm:
 *  1. Có trong store `locations` (đã fetch theo bbox).
 *  2. Đang ở zoom đủ cao để MapLibre không gom thành cluster.
 *  3. Nằm trong viewport (lấy qua `queryRenderedFeatures`).
 *
 * Logic clustering/grouping do ClusterLayer + MapLibre engine xử lý.
 * Component này chỉ là layer trang trí (image card UI) chồng lên các point unclustered.
 */
const LocationMarkers = memo(({viewMode, onLocationClick, activeLocation}) => {
  const locations = useLocationStore((state) => state.locations);
  const {current: mapRef} = useMap();
  const [visibleIds, setVisibleIds] = useState(() => new Set());
  const [zoom, setZoom] = useState(() => mapRef?.getZoom?.() ?? 13);

  const locationsById = useMemo(() => {
    const map = new Map();
    for (const loc of locations) map.set(String(loc.id), loc);
    return map;
  }, [locations]);

  useEffect(() => {
    if (!mapRef) return;
    const map = mapRef.getMap?.();
    if (!map) return;

    const sync = () => {
      const currentZoom = map.getZoom();
      setZoom(currentZoom);
      if (currentZoom < MARKER_ZOOM.CARD_VISIBLE) {
        setVisibleIds((prev) => (prev.size ? new Set() : prev));
        return;
      }
      // Check if layer exists before querying (avoids console errors)
      if (!map.getLayer(LAYER_IDS.UNCLUSTERED_POINT)) return;
      try {
        const features = map.queryRenderedFeatures({layers: [LAYER_IDS.UNCLUSTERED_POINT]});
        const ids = new Set();
        for (const f of features) {
          const id = f?.properties?.id;
          if (id != null) ids.add(String(id));
          if (ids.size >= MAX_VISIBLE_CARDS) break;
        }
        setVisibleIds(ids);
      } catch {
        // Layer may not be ready yet
      }
    };

    map.once("idle", sync);
    map.on("moveend", sync);
    map.on("zoomend", sync);
    map.on("sourcedata", sync);

    return () => {
      map.off("moveend", sync);
      map.off("zoomend", sync);
      map.off("sourcedata", sync);
    };
  }, [mapRef]);

  const visibleLocations = useMemo(() => {
    if (zoom < MARKER_ZOOM.CARD_VISIBLE) return [];
    const list = [];
    for (const id of visibleIds) {
      if (id === String(activeLocation?.id)) continue;
      const loc = locationsById.get(id);
      if (loc) list.push(loc);
    }
    return list;
  }, [visibleIds, locationsById, activeLocation?.id, zoom]);

  const activeMarker = useMemo(() => {
    if (!activeLocation || zoom < MARKER_ZOOM.ACTIVE_FALLBACK) return null;
    return (
      <LocationCard
        key={`active-${activeLocation.id}`}
        location={activeLocation}
        onClick={onLocationClick}
        viewMode="full"
      />
    );
  }, [activeLocation, onLocationClick, zoom]);

  if (zoom < MARKER_ZOOM.ACTIVE_FALLBACK && !activeLocation) return null;

  return (
    <>
      {visibleLocations.map((loc) => (
        <LocationCard
          key={loc.id}
          location={loc}
          onClick={onLocationClick}
          viewMode={viewMode}
        />
      ))}
      {activeMarker}
    </>
  );
});

LocationMarkers.displayName = "LocationMarkers";

export default LocationMarkers;
