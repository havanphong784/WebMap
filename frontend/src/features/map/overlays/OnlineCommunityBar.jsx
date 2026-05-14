import { useNavigate } from "react-router-dom";
import { useSocialStore } from "../store/useSocialStore.jsx";
import useWindowSize from "../../../shared/hooks/useWindowSize.jsx";
import GlassPanel from "../../../shared/components/common/glassPanel.jsx";
import UserBadge from "../../../shared/components/UserBadge.jsx";
import { memo } from "react";

const OnlineCommunityBar = memo(() => {
  const navigate = useNavigate();
  const { activeUsers } = useSocialStore();
  const { width: windowWidth } = useWindowSize();

  return (
    <div className="absolute bottom-28 sm:bottom-32 left-1/2 -translate-x-1/2 z-40 w-[95%] sm:w-[90%] max-w-xl pointer-events-none px-2">
      <GlassPanel className="py-2.5 sm:py-3 px-4 sm:px-6 rounded-2xl bg-obsidian border-glass-border flex items-center justify-between shadow-glass">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-sunset animate-pulse shadow-sunset"></div>
          <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-text-secondary">
            Cộng đồng <span className="text-text-primary">Trực tuyến</span>
          </span>
        </div>
        <div className="flex -space-x-2 sm:-space-x-3">
          {activeUsers.slice(0, 10).map((u) => {
            const lastSeen = new Date(u.last_seen_at);
            const now = new Date();
            const isOnline = (now - lastSeen) / 1000 / 60 < 2;

            return (
              <div
                key={u.firebase_uid}
                className="cursor-pointer relative z-10"
                onClick={() => navigate(`/profile/${u.firebase_uid}`)}
                style={{ pointerEvents: "auto" }}
                title={`${u.name} (${isOnline ? "Đang trực tuyến" : "Vừa hoạt động"})`}
              >
                <UserBadge
                  user={u}
                  size={windowWidth < 640 ? 32 : 40}
                  hideLevelBadge={true}
                  isOnline={isOnline}
                />
              </div>
            );
          })}
          {activeUsers.length > 10 && (
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-obsidian-soft border-2 border-obsidian flex items-center justify-center text-[10px] text-text-secondary font-black shadow-lg relative z-0">
              +{activeUsers.length - 10}
            </div>
          )}
        </div>
      </GlassPanel>
    </div>
  );
});

OnlineCommunityBar.displayName = "OnlineCommunityBar";

export default OnlineCommunityBar;
