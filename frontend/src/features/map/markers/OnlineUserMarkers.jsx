import { Marker } from "react-map-gl/maplibre";
import { memo, useMemo } from "react";
import UserBadge from "../../../shared/components/UserBadge.jsx";
import { useAuthStore } from "../../auth/context/authStore.js";
import { useSocialStore } from "../store/useSocialStore.jsx";

const toUserPosition = (user) => {
  const lat = Number.parseFloat(user?.current_lat);
  const lng = Number.parseFloat(user?.current_lng);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return {lat, lng};
};

const OnlineUserMarkers = memo(({onUserClick}) => {
  const {user: currentUser} = useAuthStore();
  const activeUsers = useSocialStore(state => state.activeUsers);

  const onlineUsersWithLocation = useMemo(() => (
    activeUsers
      .filter((item) => item.firebase_uid !== currentUser?.uid)
      .map((item) => ({...item, position: toUserPosition(item)}))
      .filter((item) => item.position)
  ), [activeUsers, currentUser?.uid]);

  return (
    <>
      {onlineUsersWithLocation.map((item) => (
        <Marker
          key={item.firebase_uid}
          longitude={item.position.lng}
          latitude={item.position.lat}
          anchor="center"
        >
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onUserClick?.(item);
            }}
            className="group relative flex items-center justify-center"
            aria-label={`Đi tới vị trí ${item.name || "người dùng online"}`}
          >
            <span className="absolute h-14 w-14 rounded-full bg-emerald/15 animate-ping" />
            <span className="absolute h-20 w-20 rounded-full bg-cyan-glow/10" />
            <span className="relative rounded-full bg-white/85 p-1 shadow-floating ring-2 ring-emerald/40 backdrop-blur">
              <UserBadge user={item} size={34} hideLevelBadge isOnline />
            </span>
            <span className="pointer-events-none absolute left-1/2 top-11 hidden -translate-x-1/2 whitespace-nowrap rounded-full border border-glass-border bg-white/95 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-text-primary shadow-glass group-hover:block">
              {item.name || "Online"}
            </span>
          </button>
        </Marker>
      ))}
    </>
  );
});

OnlineUserMarkers.displayName = "OnlineUserMarkers";

export default OnlineUserMarkers;
