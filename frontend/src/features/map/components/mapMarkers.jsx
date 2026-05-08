import { memo, useMemo } from "react";
import LocationCard from "./locationCard.jsx";

const MapMarkers = memo(({ locations, viewMode, onLocationClick, zoom }) => {
  if (zoom < 13) return null;

  // Hàm tính khoảng cách giữa 2 điểm (mét) - Thuật toán Haversine
  const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Bán kính Trái đất tính bằng mét
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Gom nhóm các địa điểm trong bán kính 5m
  const groupedLocations = useMemo(() => {
    const groups = [];
    
    locations.forEach(loc => {
      let added = false;
      // Duyệt qua các nhóm đã tạo để tìm điểm gần nhất
      for (let group of groups) {
        const dist = getDistance(
          Number(loc.lat), Number(loc.lng), 
          Number(group[0].lat), Number(group[0].lng)
        );
        
        if (dist <= 10) { // Nếu khoảng cách <= 10m thì gom vào nhóm
          group.push(loc);
          added = true;
          break;
        }
      }
      
      if (!added) {
        groups.push([loc]);
      }
    });

    return groups;
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
