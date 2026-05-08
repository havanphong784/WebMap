import {motion} from "framer-motion";
import {useNavigate} from "react-router-dom";
import {useAuthStore} from "../auth/context/authContext.jsx";
import GlassPanel from "../../shared/components/common/glassPanel.jsx";
import {CheckIcon, MapIcon} from "../../shared/components/common/icons.jsx";
import {useNotificationStore} from "./store/useNotificationStore.jsx";
import {useCallback, useEffect} from "react";
import {formatFullTime} from "../../shared/utils/dateUtils.js";
import Skeleton, {SkeletonTheme} from "react-loading-skeleton";
import UserBadge from "../../shared/components/UserBadge.jsx";
import PageShell from "../../shared/components/layout/pageShell.jsx";
import {notificationTypeConfig} from "./config/notificationTypeConfig.js";

export default function NotificationsPage() {
  const navigate = useNavigate();
  const {user} = useAuthStore();
  const {notifications, fetchNotifications, markRead, markAllRead, unreadCount, loading} = useNotificationStore();

  useEffect(() => {
    if (user?.uid) {
      fetchNotifications(user.uid);
    }
  }, [user, fetchNotifications]);

  const formatTime = useCallback((dateStr) => formatFullTime(dateStr), []);

  return (
    <PageShell>
      <div className="sticky top-0 z-10 bg-obsidian/90 backdrop-blur-xl border-b border-glass-border px-6 py-5">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-jakarta font-black tracking-tight text-text-primary uppercase italic">Thông
              báo</h1>
            {unreadCount > 0 && (
              <p className="text-cyan-glow text-[10px] font-black mt-1 uppercase tracking-widest opacity-80">
                {unreadCount} thông báo mới
              </p>
            )}
          </div>
          {unreadCount > 0 && (
            <motion.button
              whileHover={{scale: 1.05}}
              whileTap={{scale: 0.95}}
              onClick={() => markAllRead(user.uid)}
              className="flex items-center gap-2 px-3 py-1.5 glass-panel bg-white/10 border-glass-border hover:bg-cyan-glow/10 hover:border-cyan-glow/30 transition-all group shrink-0"
            >
              <CheckIcon size={12} className="text-cyan-glow group-hover:scale-125 transition-transform"/>
              <span className="text-text-primary text-[9px] font-black uppercase tracking-widest whitespace-nowrap">
                Đọc tất cả
              </span>
            </motion.button>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 pt-6 space-y-3">
        {loading ? (
          <SkeletonTheme baseColor="rgba(255,255,255,0.05)" highlightColor="rgba(255,255,255,0.1)">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="p-5 flex items-start gap-4 glass-panel border-glass-border">
                <Skeleton circle width={56} height={56} className="shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Skeleton width={60} height={12} />
                    <Skeleton width={100} height={12} />
                  </div>
                  <Skeleton width="85%" height={20} />
                  <Skeleton width="45%" height={24} borderRadius={8} />
                </div>
              </div>
            ))}
          </SkeletonTheme>
        ) : notifications.map((notif, i) => {
          const config = notificationTypeConfig[notif.type] || notificationTypeConfig.LIKE;
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
                  if (notif.type === 'FOLLOW') {
                    navigate(`/profile/${notif.sender_id}`);
                  } else {
                    navigate('/', {state: {focusLocation: {lat: notif.lat, lng: notif.lng, id: notif.location_id}}});
                  }
                }}
              >
                {!notif.is_read && (
                  <div className="absolute top-0 left-0 w-1 h-full bg-cyan-glow shadow-neon"/>
                )}

                <div className="relative shrink-0 flex items-center justify-center">
                  <UserBadge
                    user={{
                      xp: notif.sender_xp,
                      avatar_url: notif.sender_avatar,
                      name: notif.sender_name
                    }}
                    size={48}
                  />
                  <div
                    className={`absolute -bottom-1 -right-1 p-1.5 rounded-lg border backdrop-blur-md z-30 ${config.bg}`}>
                    <Icon
                      size={12}
                      className={`${config.color} drop-shadow-md`}
                      fill={['LIKE', 'COMMENT', 'FOLLOW', 'like', 'comment'].includes(notif.type) ? 'currentColor' : 'none'}
                    />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span
                      className={`text-[8px] font-black px-2 py-0.5 rounded border uppercase tracking-[0.15em] ${config.bg} ${config.color}`}>
                      {config.label}
                    </span>
                    <span className="text-[9px] text-text-muted font-black uppercase tracking-[0.2em]">
                      {formatTime(notif.created_at)}
                    </span>
                  </div>

                  <p className="text-[13px] text-text-primary leading-snug font-medium">
                    <span
                      className="font-black text-cyan-glow uppercase tracking-tight">{notif.sender_name || 'Người dùng'}</span>{' '}
                    <span className="text-text-secondary opacity-90 italic">{notif.message}</span>
                  </p>

                  {notif.type !== 'FOLLOW' && (
                    <div
                      className="mt-2.5 py-1 px-3 bg-white/[0.03] rounded-lg border border-glass-border inline-flex items-center gap-2 group-hover:border-cyan-glow/30 transition-colors">
                      <span
                        className="text-[10px] font-black text-text-muted uppercase tracking-widest truncate max-w-[200px]">
                        📍 {notif.location_name || 'Địa điểm'}
                      </span>
                    </div>
                  )}
                </div>
              </GlassPanel>
            </motion.div>
          );
        })}

        {!loading && notifications.length === 0 && (
          <div className="text-center py-40 glass-panel border-glass-border rounded-3xl">
            <MapIcon size={48} className="text-text-dim mx-auto mb-4 opacity-20"/>
            <p className="text-text-secondary font-jakarta font-bold uppercase tracking-widest text-sm">
              Chưa có thông báo nào
            </p>
          </div>
        )}
      </div>
    </PageShell>
  );
}
