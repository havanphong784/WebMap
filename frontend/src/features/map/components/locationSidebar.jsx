import {AnimatePresence, motion} from "framer-motion";
import {useCallback, useEffect, useRef, useState} from "react";
import {useLocationStore} from "../store/useLocationsStore.jsx";
import {useAuthStore} from "../../auth/context/authContext.jsx";
import {apiClient} from "../../../shared/api/apiClient.js";
import GlassPanel from "../../../shared/components/common/glassPanel.jsx";
import ActionButton from "../../../shared/components/common/actionButton.jsx";
import {
  CloseIcon,
  CommentIcon,
  DateIcon,
  HashIcon,
  LikeIcon,
  PinIcon,
  RouteIcon,
  SendIcon,
  ShareIcon,
  TagIcon,
} from "../../../shared/components/common/icons.jsx";
import {parseDBDate} from "../../../shared/utils/dateUtils.js";
import Skeleton from "../../../shared/components/common/skeleton.jsx";
import UserBadge from "../../../shared/components/UserBadge.jsx";

export default function LocationSidebar({location, onClose}) {
  const {user} = useAuthStore();
  const locations = useLocationStore(state => state.locations);
  const {fetchRoute, routeLoading, toggleLike, postComment} = useLocationStore();

  const displayLocation = locations.find(l => l.id === location?.id) || location;

  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [toast, setToast] = useState(null);
  const scrollRef = useRef(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 1600);
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/?lat=${location.lat}&lng=${location.lng}&locationId=${location.id}`;
    const shareData = {
      title: location.name,
      text: `Khám phá địa điểm "${location.name}" trên Aether Geo!`,
      url: shareUrl,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareUrl);
        showToast('✓ Đã sao chép link!');
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        await navigator.clipboard.writeText(shareUrl);
        showToast('✓ Đã sao chép link!');
      }
    }
  };

  const fetchComments = useCallback(async () => {
    if (!location?.id) return;
    setLoadingComments(true);
    try {
      const result = await apiClient.get(`/comments/${location.id}/comments`);
      if (result.success) setComments(result.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingComments(false);
    }
  }, [location]);

  useEffect(() => {
    if (location) {
      fetchComments();
    }
  }, [fetchComments, location]);

  const handleSendComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || !user) return;

    const res = await postComment(location.id, user.uid, commentText);
    if (res?.success) {
      setCommentText("");
      fetchComments();
    }
  };

  if (!location) return null;

  const locationOwner = {
    firebase_uid: displayLocation.user_id,
    name: displayLocation.user_name,
    avatar_url: displayLocation.user_avatar,
    xp: displayLocation.user_xp,
    level: displayLocation.user_level,
    tier: displayLocation.user_tier
  };

  const level = Math.floor(Math.sqrt((locationOwner.xp || 0) / 10)) + 1;

  return (
    <motion.div
      initial={{x: window.innerWidth < 640 ? 0 : "-100%", y: window.innerWidth < 640 ? "100%" : 0, opacity: 0}}
      animate={{x: 0, y: 0, opacity: 1}}
      exit={{x: window.innerWidth < 640 ? 0 : "-100%", y: window.innerWidth < 640 ? "100%" : 0, opacity: 0}}
      transition={{type: "spring", damping: 25, stiffness: 120}}
      className="fixed inset-x-0 bottom-0 sm:inset-y-0 sm:left-0 z-[2000] w-full sm:w-[520px] p-2 sm:p-5 pointer-events-none"
    >
      <GlassPanel
        className="h-[85vh] sm:h-full flex flex-col border-glass-border bg-white/95 backdrop-blur-[80px] shadow-floating overflow-hidden pointer-events-auto rounded-t-[2.5rem] sm:rounded-[2.8rem] ring-1 ring-glass-border relative group/sidebar">

        {/* Mobile Drag Handle */}
        <div className="w-12 h-1.5 bg-black/10 rounded-full mx-auto mt-4 sm:hidden shrink-0"/>

        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"></div>

        <div
          className="absolute -top-40 -left-40 w-80 h-80 bg-cyan-glow/5 blur-[120px] rounded-full pointer-events-none animate-pulse"></div>

        <div className="relative p-4 shrink-0">
          <div
            className="relative h-56 rounded-[1.8rem] overflow-hidden shadow-lg border border-black/5 group/img">
            <motion.div
              initial={{scale: 1.1}}
              animate={{scale: 1}}
              transition={{duration: 1.5, ease: "easeOut"}}
              className="w-full h-full"
            >
              <img
                src={displayLocation.image_url || `https://picsum.photos/1200/900?random=${displayLocation.id}`}
                className="w-full h-full object-cover transition-all duration-700 group-hover/img:scale-110"
                alt={displayLocation.name}
              />
            </motion.div>

            <div
              className="absolute inset-0 bg-obsidian/10 group-hover/img:bg-transparent transition-colors duration-500"></div>

            <div className="absolute top-3 left-3 right-3 flex justify-between items-center z-10">
              <motion.button
                whileHover={{scale: 1.1, rotate: 90}}
                whileTap={{scale: 0.9}}
                onClick={onClose}
                className="p-2 glass-panel !rounded-lg border-glass-border-bright bg-white/80 text-text-primary shadow-glass backdrop-blur-2xl hover:bg-white transition-colors"
              >
                <CloseIcon size={14}/>
              </motion.button>
              <div className="flex gap-2">
                <motion.button
                  whileHover={{scale: 1.1, y: -2}}
                  whileTap={{scale: 0.9}}
                  onClick={handleShare}
                  className="p-2 glass-panel !rounded-lg border-glass-border-bright bg-white/80 text-text-primary shadow-glass backdrop-blur-2xl hover:bg-white transition-colors"
                >
                  <ShareIcon size={12}/>
                </motion.button>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 pb-2 relative z-10">
          <div className="flex items-center justify-between mb-4">
            <motion.div
              initial={{x: -10, opacity: 0}}
              animate={{x: 0, opacity: 1}}
              className="flex items-center gap-3"
            >
              <UserBadge user={locationOwner} size={36}/>
              <div className="flex flex-col">
                <span className="text-[13px] font-jakarta font-bold text-text-primary leading-none">
                  {displayLocation.user_name || 'Explorer'}
                </span>
                <span className={`text-[8px] font-bold uppercase tracking-widest mt-1 ${
                  level >= 50 ? 'text-sunset' : level >= 10 ? 'text-cyan-glow' : 'text-text-muted'
                }`}>
                  Lvl.{level} {level >= 25 ? 'Pathfinder' : 'Scout'}
                </span>
              </div>
            </motion.div>

            <motion.div
              initial={{x: 10, opacity: 0}}
              animate={{x: 0, opacity: 1}}
              className="flex gap-1.5"
            >
              <div
                className="px-2 py-0.5 rounded-md glass-panel border-cyan-glow/20 bg-cyan-glow/5 text-cyan-glow text-[7px] font-black uppercase tracking-wider">
                {displayLocation.category}
              </div>
              <div
                className="px-2 py-0.5 rounded-md glass-panel border-glass-border bg-glass-white text-text-muted text-[7px] font-black uppercase tracking-wider">
                {displayLocation.is_public ? 'Public' : 'Private'}
              </div>
            </motion.div>
          </div>

          <motion.h2
            initial={{y: 5, opacity: 0}}
            animate={{y: 0, opacity: 1}}
            className="text-xl font-jakarta font-black tracking-tight text-text-primary leading-tight mb-2"
          >
            {displayLocation.name}
          </motion.h2>

          {displayLocation.tags?.length > 0 && (
            <motion.div
              initial={{y: 8, opacity: 0}}
              animate={{y: 0, opacity: 1}}
              transition={{delay: 0.6}}
              className="flex items-center gap-2 mt-3 flex-wrap"
            >
              <TagIcon size={11} className="text-text-dim shrink-0"/>
              {displayLocation.tags.map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-black/[0.04] border border-glass-border text-text-muted hover:bg-cyan-glow/5 hover:border-cyan-glow/20 hover:text-cyan-glow transition-all duration-300 text-[10px] font-bold cursor-default"
                >
                  <HashIcon size={8}/>
                  {tag}
                </span>
              ))}
            </motion.div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 pt-0 space-y-5" ref={scrollRef}>
          {/* Review Section - Compact */}
          <motion.div
            initial={{opacity: 0}}
            animate={{opacity: 1}}
            className="relative group/review"
          >
            <div
              className="relative p-4 glass-panel border-glass-border bg-white/30 rounded-[1.2rem] hover:bg-white/50 transition-all duration-300">
              <div className="absolute top-0 right-0 p-2 opacity-[0.05]">
                <CommentIcon size={40} className="text-text-primary"/>
              </div>
              <p className="text-text-primary text-[13px] leading-relaxed font-medium italic relative z-10">
                "{displayLocation.review_text || "Chưa có review chi tiết."}"
              </p>
            </div>
          </motion.div>

          <div className="grid grid-cols-2 gap-3">
            <div
              className="flex gap-3 items-start p-3 glass-panel border-glass-border bg-white/10 rounded-xl group hover:bg-white/20 transition-colors">
              <PinIcon size={14} className="text-cyan-glow shrink-0 mt-0.5"/>
              <div className="min-w-0">
                <h4 className="text-[7px] font-black text-text-muted uppercase tracking-wider mb-0.5">Địa chỉ</h4>
                <p
                  className="text-[11px] text-text-primary font-bold leading-tight truncate">{displayLocation.address}</p>
              </div>
            </div>

            <div
              className="flex gap-3 items-start p-3 glass-panel border-glass-border bg-white/10 rounded-xl group hover:bg-white/20 transition-colors">
              <DateIcon size={14} className="text-sunset shrink-0 mt-0.5"/>
              <div className="min-w-0">
                <h4 className="text-[7px] font-black text-text-muted uppercase tracking-wider mb-0.5">Ngày đăng</h4>
                <p className="text-[11px] text-text-primary font-bold leading-tight">
                  {parseDBDate(displayLocation.created_at).toLocaleDateString('vi-VN')}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 p-3.5 glass-panel border-glass-border bg-white/20 rounded-xl">
            <div className="flex-1 flex flex-col gap-0.5 border-r border-glass-border">
              <span className="text-[8px] font-black text-text-muted uppercase tracking-widest">Vĩ độ</span>
              <span
                className="text-[14px] font-mono text-cyan-glow font-bold">{Number(displayLocation.lat).toFixed(6)}°</span>
            </div>
            <div className="flex-1 flex flex-col gap-0.5 pl-4">
              <span className="text-[8px] font-black text-text-muted uppercase tracking-widest">Kinh độ</span>
              <span
                className="text-[14px] font-mono text-cyan-glow font-bold">{Number(displayLocation.lng).toFixed(6)}°</span>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h4
                className="text-[10px] font-black text-text-primary uppercase tracking-[0.35em] flex items-center gap-3">
                <div className="w-1.5 h-4 bg-gradient-to-b from-sunset to-sunset/20 rounded-full shadow-sunset"></div>
                Thảo luận ({displayLocation.comments_count || 0})
              </h4>
            </div>

            {user && (
              <motion.form
                initial={{y: 10, opacity: 0}}
                animate={{y: 0, opacity: 1}}
                onSubmit={handleSendComment}
                className="flex gap-2"
              >
                <div
                  className="flex-1 glass-panel flex items-center px-4 py-0.5 border-glass-border bg-glass-white rounded-xl focus-within:border-cyan-glow/30 focus-within:bg-white/[0.04] transition-all duration-500">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Gửi tin nhắn..."
                    className="bg-transparent border-none outline-none flex-1 text-[12px] text-text-primary placeholder-text-dim py-2.5 font-medium"
                  />
                  <button type="submit" disabled={!commentText.trim()}
                          className="text-cyan-glow disabled:text-zinc-800 transition-all hover:scale-110 active:scale-90">
                    <SendIcon size={18} className="drop-shadow-neon"/>
                  </button>
                </div>
              </motion.form>
            )}

            <div className="space-y-6 pb-2">
              {loadingComments ? (
                <div className="space-y-6">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex gap-3">
                      <Skeleton circle width="2.5rem" height="2.5rem" className="shrink-0"/>
                      <div className="flex-1 space-y-2">
                        <div className="flex justify-between">
                          <Skeleton width="40%" height="1rem"/>
                          <Skeleton width="20%" height="0.75rem"/>
                        </div>
                        <Skeleton width="100%" height="3rem" className="rounded-xl rounded-tl-none"/>
                      </div>
                    </div>
                  ))}
                </div>
              ) : comments.length > 0 ? (
                comments.map((c, i) => (
                  <motion.div
                    key={c.id}
                    initial={{opacity: 0}}
                    animate={{opacity: 1}}
                    className="flex gap-2.5 group"
                  >
                    <UserBadge user={c} size={32}/>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[11px] font-bold text-text-primary truncate mr-2">{c.name}</span>
                        <span className="text-[7px] text-text-muted font-bold uppercase shrink-0">
                          {parseDBDate(c.created_at).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                      <div
                        className="bg-white/10 rounded-lg rounded-tl-none p-2.5 border border-glass-border text-[11px] text-text-secondary leading-relaxed">
                        {c.content}
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-12 bg-white/[0.01] rounded-2xl border border-glass-border border-dashed">
                  <CommentIcon size={20} className="text-text-dim mx-auto mb-3"/>
                  <p className="text-text-muted text-[8px] font-black uppercase tracking-[0.4em]">Trống thảo luận</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div
          className="p-4 border-t border-glass-border-bright bg-white/90 backdrop-blur-3xl space-y-4 shrink-0 relative">
          <div
            className="absolute inset-x-0 -top-6 h-6 bg-gradient-to-t from-map-bg/80 to-transparent pointer-events-none"></div>

          <div className="flex gap-3">
            <ActionButton
              loading={routeLoading}
              onClick={() => {
                navigator.geolocation.getCurrentPosition((pos) => {
                  fetchRoute([pos.coords.longitude, pos.coords.latitude], [location.lng, location.lat]);
                });
              }}
              className="flex-[3] !py-3 gap-3 shadow-neon rounded-xl! group/btn overflow-hidden relative"
            >
              <div
                className="absolute inset-0 bg-linear-to-r from-white/0 via-white/5 to-white/0 -translate-x-full group-hover/btn:animate-[shimmer_2s_infinite]"></div>
              <RouteIcon size={16}
                         className="group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform"/>
              <span className="uppercase text-[12px] font-black">Chỉ đường</span>
            </ActionButton>

            <motion.button
              whileHover={{scale: 1.05, y: -2}}
              whileTap={{scale: 0.95}}
              onClick={() => toggleLike(displayLocation.id, user?.uid)}
              className={`flex-1 flex items-center justify-center rounded-xl glass-panel border-glass-border transition-all duration-500 ${displayLocation.is_liked ? 'bg-sunset/10 text-sunset border-sunset/20 shadow-sunset' : 'text-text-muted hover:text-text-primary hover:bg-glass-white'}`}
            >
              <LikeIcon size={20} fill={displayLocation.is_liked ? "currentColor" : "none"}
                        className={displayLocation.is_liked ? "drop-shadow-[0_0_8px_rgba(255,75,43,0.3)]" : ""}/>
            </motion.button>
          </div>
        </div>
      </GlassPanel>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{opacity: 0, y: 20}}
            animate={{opacity: 1, y: 0}}
            exit={{opacity: 0, y: 20}}
            className="absolute bottom-28 left-1/2 -translate-x-1/2 bg-cyan-glow text-white px-5 py-2.5 rounded-full text-[11px] font-black uppercase tracking-widest shadow-neon z-50 whitespace-nowrap"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

