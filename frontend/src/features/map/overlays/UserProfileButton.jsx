import { memo } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import UserBadge from "../../../shared/components/UserBadge.jsx";
import { useAuthStore } from "../../auth/context/authStore.js";

const UserProfileButton = memo(() => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  return (
    <div className="absolute top-[calc(1rem+var(--app-safe-top))] right-[calc(1rem+var(--app-safe-right))] sm:top-[calc(1.5rem+var(--app-safe-top))] sm:right-[calc(1.5rem+var(--app-safe-right))] z-30">
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => {
          if (user?.uid) navigate(`/profile/${user.uid}`);
          else navigate("/login");
        }}
        className="hidden sm:flex items-center gap-2 sm:gap-3 glass-panel p-1 pr-3 sm:pr-5 border-glass-border cursor-pointer shadow-floating bg-obsidian/80 backdrop-blur-xl rounded-full group"
      >
        {user ? (
          <>
            <UserBadge user={user} size={38} />
            <div className="hidden sm:flex flex-col">
              <span className="text-text-primary text-[11px] font-black tracking-widest uppercase leading-tight">
                {user.displayName || "Hồ sơ"}
              </span>
              <span className="text-[9px] font-black text-cyan-glow uppercase tracking-[0.25em] mt-0.5 opacity-80">
                LVL.{Math.floor(Math.sqrt((user.xp || 0) / 10)) + 1}
              </span>
            </div>
          </>
        ) : (
          <>
            <div className="w-9 h-9 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white/40">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <span className="text-text-primary text-[12px] font-black uppercase leading-none">
              Đăng nhập
            </span>
          </>
        )}
      </motion.div>
    </div>
  );
});

UserProfileButton.displayName = "UserProfileButton";

export default UserProfileButton;
