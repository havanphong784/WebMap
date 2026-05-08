import { Marker } from "react-map-gl/maplibre";
import { memo } from "react";
import { useLocationStore } from "../store/useLocationsStore.jsx";

const UserMarker = memo(() => {
  const userLocation = useLocationStore(state => state.userLocation);

  if (!userLocation) return null;

  return (
    <Marker longitude={userLocation[0]} latitude={userLocation[1]} anchor="center">
      <div className="relative flex items-center justify-center">
        <div className="absolute w-12 h-12 bg-cyan-glow/30 rounded-full animate-ping"></div>
        <div className="absolute w-24 h-24 bg-cyan-glow/10 rounded-full animate-pulse"></div>

        <div className="relative w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(0,243,255,1)]">
          <div className="w-3 h-3 bg-cyan-glow rounded-full"></div>
        </div>
      </div>
    </Marker>
  );
});

UserMarker.displayName = "UserMarker";

export default UserMarker;
