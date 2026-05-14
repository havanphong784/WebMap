import { memo, useMemo, useState, useEffect } from "react";
import LocationCard from "./locationCard.jsx";
import { useLocationStore } from "../store/useLocationsStore.jsx";
import { useMap } from "react-map-gl/maplibre";
import {groupNearbyLocations} from "../utils/locationGrouping.js";

const MapMarkers = memo(({ viewMode, onLocationClick, activeLocation }) => {
  const locations = useLocationStore(state => state.locations);
  const { current: map } = useMap();
  const [zoom, setZoom] = useState(map?.getZoom() || 13);

  useEffect(() => {
    if (!map) return;
    const onMoveEnd = () => setZoom(map.getZoom());
    map.on('moveend', onMoveEnd);
    map.on('zoomend', onMoveEnd);
    return () => {
      map.off('moveend', onMoveEnd);
      map.off('zoomend', onMoveEnd);
    };
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

    const groupedLocations = groupNearbyLocations(locations)
      .filter(group => !group.items.some(loc => loc.id === activeLocation?.id))
      .slice(0, 15);

    return groupedLocations.map(({location, items}) => (
      <LocationCard
        key={items.map(loc => loc.id).join('-')}
        location={location}
        onClick={onLocationClick}
        viewMode={viewMode}
        count={items.length}
        allInGroup={items}
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


