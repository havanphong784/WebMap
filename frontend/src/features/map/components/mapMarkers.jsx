import { memo } from "react";
import LocationCard from "./locationCard.jsx";

const MapMarkers = memo(({ locations, viewMode, onLocationClick, zoom }) => {
  if (zoom < 13) return null;

  return locations.slice(0, 80).map((loc) => (
    <LocationCard
      key={loc.id}
      location={loc}
      onClick={onLocationClick}
      viewMode={viewMode}
    />
  ));
});

MapMarkers.displayName = "MapMarkers";

export default MapMarkers;
