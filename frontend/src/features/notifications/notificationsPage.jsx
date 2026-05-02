import {motion} from "framer-motion";
import {useNavigate} from "react-router-dom";
import {useAuthStore} from "../auth/context/authContext.jsx";
import GlassPanel from "../../shared/components/common/glassPanel.jsx";
import {CommentIcon, LikeIcon, MapIcon, PinIcon} from "../../shared/components/common/icons.jsx";
import ActionButton from "../../shared/components/common/actionButton.jsx";
import {useNotificationStore} from "./store/useNotificationStore.jsx";
import {useEffect} from "react";
import {formatFullTime} from "../../shared/utils/dateUtils.js";
import Skeleton from "../../shared/components/common/skeleton.jsx";

const typeConfig = {
  like: {
    icon: LikeIcon,
    color: 'text-white',
    bg: 'bg-sunset border-sunset/50 shadow-[0_0_15px_rgba(255,75,43,0.4)]',
    label: 'THÍCH'
  },
  comment: {
    icon: CommentIcon,
    color: 'text-cyan-glow',
    bg: 'bg-cyan-glow/20 border-cyan-glow/40 shadow-[0_0_10px_rgba(0,243,255,0.3)]',
    label: 'BÌNH LUẬN'
  },
  discovery: {
    icon: PinIcon,
    color: 'text-emerald',
    bg: 'bg-emerald/20 border-emerald/40 shadow-[0_0_10px_rgba(16,185,129,0.3)]',
    label: 'KHÁM PHÁ'
  },
};

export default function NotificationsPage() {
  const navigate = useNavigate();
  const {user} = useAuthStore();
  const {notifications, fetchNotifications, markRead, markAllRead, unreadCount, loading} = useNotificationStore();

  useEffect(() => {
    if (user?.uid) {
      fetchNotifications(user.uid);
    }
  }, [user, fetchNotifications]);

  const formatTime = (dateStr) => formatFullTime(dateStr);

  if (!user) {
    return (
      <div className="min-h-screen bg-obsidian flex flex-col items-center justify-center gap-6">
        <MapIcon size={48} className="text-cyan-glow opacity-30"/>
        <p className="text-zinc-500 font-plus font-bold uppercase tracking-widest text-sm text-center">
          Đăng nhập để xem thông báo
        </p>
        <ActionButton onClick={() => navigate('/login')}>Đăng nhập ngay</ActionButton>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-map-bg pb-32 overflow-y-auto no-scrollbar">
      <div className="sticky top-0 z-10 bg-obsidian/90 backdrop-blur-xl border-b border-glass-border px-6 py-5">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-plus font-black tracking-tight text-text-primary uppercase">Thông báo</h1>
            {unreadCount > 0 && (
              <p className="text-text-secondary text-xs font-bold mt-0.5">
                {unreadCount} thông báo mới
              </p>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={() => markAllRead(user.uid)}
              className="text-cyan-glow text-[10px] font-bold uppercase tracking-widest hover:underline"
            >
              Đánh dấu đã đọc tất cả
            </button>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 pt-6 space-y-3">
        {loading ? (
          [...Array(6)].map((_, i) => (
            <div key={i} className="p-5 flex items-start gap-4 glass-panel border-glass-border">
              <Skeleton circle width="3.5rem" height="3.5rem" className="shrink-0" />
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2">
                  <Skeleton width="4rem" height="0.75rem" />
                  <Skeleton width="6rem" height="0.75rem" />
                </div>
                <Skeleton width="80%" height="1.25rem" />
                <Skeleton width="40%" height="1.5rem" className="rounded-lg" />
              </div>
            </div>
          ))
        ) : notifications.map((notif, i) => {
          const config = typeConfig[notif.type] || typeConfig.like;
          const Icon = config.icon;
          return (
            <motion.div
              key={notif.id}
              initial={{opacity: 0, x: -20}}
              animate={{opacity: 1, x: 0}}
              transition={{delay: i * 0.05}}
            >
              <GlassPanel
                className={`p-5 flex items-start gap-4 border-glass-border cursor-pointer hover:border-cyan-glow/30 transition-all duration-300 relative overflow-hidden ${!notif.is_read ? 'bg-cyan-glow/[0.04]' : ''}`}
                onClick={() => {
                  if (!notif.is_read) markRead(notif.id, user.uid);
                  navigate('/', {state: {focusLocation: {lat: notif.lat, lng: notif.lng, id: notif.location_id}}});
                }}
              >
                {!notif.is_read && (
                  <div className="absolute top-0 left-0 w-1 h-full bg-cyan-glow shadow-neon"/>
                )}

                <div className="relative shrink-0">
                  <div
                    className="w-14 h-14 rounded-2xl overflow-hidden border border-glass-border bg-glass-white shadow-lg">
                    <img
                      src={notif.sender_avatar || "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y"}
                      className="w-full h-full object-cover" alt="avatar"/>
                  </div>
                  <div className={`absolute -bottom-1 -right-1 p-2 rounded-xl border backdrop-blur-md ${config.bg}`}>
                    <Icon
                      size={14}
                      className={`${config.color} drop-shadow-md`}
                      fill={notif.type === 'like' ? 'currentColor' : 'none'}
                    />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-[9px] font-black px-2 py-0.5 rounded-md border ${config.bg} ${config.color}`}>
                      {config.label}
                    </span>
                    <span className="text-[10px] text-text-muted font-bold uppercase tracking-widest">
                      {formatTime(notif.created_at)}
                    </span>
                  </div>

                  <p className="text-[14px] text-text-primary leading-snug">
                    <span className="font-bold">{notif.sender_name || 'Người dùng'}</span>{' '}
                    <span className="text-text-secondary font-medium">{notif.message}</span>
                  </p>

                  <div
                    className="mt-2 py-1.5 px-3 bg-white/[0.03] rounded-lg border border-glass-border inline-flex items-center gap-2">
                    <span className="text-[11px] font-bold text-cyan-glow truncate max-w-[200px]">
                      📍 {notif.location_name || 'Địa điểm'}
                    </span>
                  </div>
                </div>
              </GlassPanel>
            </motion.div>
          );
        })}

        {!loading && notifications.length === 0 && (
          <div className="text-center py-40 glass-panel border-glass-border rounded-3xl">
            <MapIcon size={48} className="text-text-dim mx-auto mb-4 opacity-20"/>
            <p className="text-text-secondary font-plus font-bold uppercase tracking-widest text-sm">
              Chưa có thông báo nào
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
