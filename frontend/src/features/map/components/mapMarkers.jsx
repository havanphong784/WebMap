import { memo, useMemo, useState, useEffect } from "react";
import LocationCard from "./locationCard.jsx";
import { useLocationStore } from "../store/useLocationsStore.jsx";
import { useMap } from "react-map-gl/maplibre";

const MapMarkers = memo(({ viewMode, onLocationClick, activeLocation }) => {
  const locations = useLocationStore(state => state.locations);
  const { current: map } = useMap();
  const [zoom, setZoom] = useState(map?.getZoom() || 13);

  useEffect(() => {
    if (!map) return;
    const onMove = () => setZoom(map.getZoom());
    map.on('move', onMove);
    return () => map.off('move', onMove);
  }, [map]);

  const activeMarker = useMemo(() => {
    if (!activeLocation || zoom < 13) return null;
    return (
      <LocationCard
        key={`active-${activeLocation.id}`}
        location={activeLocation}
        onClick={onLocationClick}
        viewMode="full"
      />
    );
  }, [activeLocation, onLocationClick, zoom]);

  const otherMarkers = useMemo(() => {
    if (zoom < 14.0) return [];

    const filtered = locations
      .filter(loc => loc.id !== activeLocation?.id)
      .slice(0, 15);

    return filtered.map((loc) => (
      <LocationCard
        key={loc.id}
        location={loc}
        onClick={onLocationClick}
        viewMode={viewMode}
      />
    ));
  }, [locations, activeLocation?.id, onLocationClick, viewMode, zoom]);

  if (zoom < 13 && !activeLocation) return null;


  return (
    <>
      {otherMarkers}
      {activeMarker}
    </>
  );
});

MapMarkers.displayName = "MapMarkers";

export default MapMarkers;


