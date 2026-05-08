import { memo, useMemo } from "react";
import LocationCard from "./locationCard.jsx";

const MapMarkers = memo(({ locations, viewMode, onLocationClick, zoom }) => {
  if (zoom < 13) return null;

  // Gom nhóm các địa điểm trong bán kính ~11m bằng grid-based clustering O(N)
  const groupedLocations = useMemo(() => {
    const grid = new Map();
    const PRECISION = 0.0001; // ~11m tại xích đạo

    locations.forEach(loc => {
      const latIdx = Math.round(Number(loc.lat) / PRECISION);
      const lngIdx = Math.round(Number(loc.lng) / PRECISION);
      const key = `${latIdx},${lngIdx}`;

      if (!grid.has(key)) {
        grid.set(key, []);
      }
      grid.get(key).push(loc);
    });

    return Array.from(grid.values());
  }, [locations]);

  return groupedLocations.slice(0, 80).map((group) => {
    const representative = group[0];
    
    return (
      <LocationCard
        key={representative.id}
        location={representative}
        count={group.length}
        allInGroup={group}
        onClick={onLocationClick}
        viewMode={viewMode}
      />
    );
  });
});

MapMarkers.displayName = "MapMarkers";

export default MapMarkers;
