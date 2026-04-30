import {motion} from "framer-motion";
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
  LikeIcon,
  MoreIcon,
  PinIcon,
  RouteIcon,
  SendIcon,
  ShareIcon,
  SpinnerIcon,
} from "../../../shared/components/common/icons.jsx";

export default function LocationSidebar({location, onClose}) {
  const {user} = useAuthStore();
  const {fetchRoute, routeLoading, toggleLike, postComment} = useLocationStore();
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const scrollRef = useRef(null);

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

  return (
    <motion.div
      initial={{x: "-100%", opacity: 0, scale: 0.95}}
      animate={{x: 0, opacity: 1, scale: 1}}
      exit={{x: "-100%", opacity: 0, scale: 0.95}}
      transition={{type: "spring", damping: 25, stiffness: 120}}
      className="fixed inset-y-0 left-0 z-[2000] w-full sm:w-[520px] p-4 sm:p-5 pointer-events-none"
    >
      <GlassPanel
        className="h-full flex flex-col border-white/[0.08] bg-obsidian/95 backdrop-blur-[80px] shadow-[0_50px_100px_rgba(0,0,0,0.8),0_0_50px_rgba(0,245,255,0.03)] overflow-hidden pointer-events-auto rounded-[2.8rem] ring-1 ring-white/10 relative group/sidebar">
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>

        <div
          className="absolute -top-40 -left-40 w-80 h-80 bg-cyan-glow/5 blur-[120px] rounded-full pointer-events-none animate-pulse"></div>

        <div className="relative p-5 shrink-0">
          <div
            className="relative h-72 rounded-[2rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 group/img">
            <motion.div
              initial={{scale: 1.1}}
              animate={{scale: 1}}
              transition={{duration: 1.5, ease: "easeOut"}}
              className="w-full h-full"
            >
              <img
                src={location.image_url || `https://picsum.photos/1200/900?random=${location.id}`}
                className="w-full h-full object-cover transition-all duration-700 group-hover/img:scale-110"
                alt={location.name}
              />
            </motion.div>

            <div
              className="absolute inset-0 bg-black/10 group-hover/img:bg-transparent transition-colors duration-500"></div>

            <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
              <motion.button
                whileHover={{scale: 1.1, rotate: 90}}
                whileTap={{scale: 0.9}}
                onClick={onClose}
                className="p-2.5 glass-panel !rounded-xl border-white/20 bg-black/40 text-white shadow-2xl backdrop-blur-2xl hover:bg-black/60 transition-colors"
              >
                <CloseIcon size={16}/>
              </motion.button>
              <div className="flex gap-2">
                <motion.button
                  whileHover={{scale: 1.1, y: -2}}
                  whileTap={{scale: 0.9}}
                  className="p-2.5 glass-panel !rounded-xl border-white/20 bg-black/40 text-white shadow-2xl backdrop-blur-2xl hover:bg-black/60 transition-colors"
                >
                  <ShareIcon size={14}/>
                </motion.button>
                <motion.button
                  whileHover={{scale: 1.1, y: -2}}
                  whileTap={{scale: 0.9}}
                  className="p-2.5 glass-panel !rounded-xl border-white/20 bg-black/40 text-white shadow-2xl backdrop-blur-2xl hover:bg-black/60 transition-colors"
                >
                  <MoreIcon size={14}/>
                </motion.button>
              </div>
            </div>
          </div>
        </div>

        <div className="px-7 pb-2 relative z-10">
          <motion.div
            initial={{y: 10, opacity: 0}}
            animate={{y: 0, opacity: 1}}
            transition={{delay: 0.4}}
            className="flex items-center gap-2 mb-3"
          >
            <div
              className="px-3 py-1 rounded-lg glass-panel border-cyan-glow/30 bg-cyan-glow/10 text-cyan-glow text-[8px] font-black uppercase tracking-[0.2em]">
              {location.category}
            </div>
            <div
              className="px-3 py-1 rounded-lg glass-panel border-white/10 bg-white/5 text-white/60 text-[8px] font-black uppercase tracking-[0.2em]">
              {location.is_public ? 'Công khai' : 'Riêng tư'}
            </div>
          </motion.div>
          <motion.h2
            initial={{y: 10, opacity: 0}}
            animate={{y: 0, opacity: 1}}
            transition={{delay: 0.5}}
            className="text-2xl font-plus font-black tracking-tight text-white leading-tight"
          >
            {location.name}
          </motion.h2>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-7 pt-2 space-y-7" ref={scrollRef}>
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4">
              <div className="flex gap-4 items-start group">
                <div
                  className="p-2.5 rounded-lg bg-white/5 border border-white/10 text-cyan-glow group-hover:bg-cyan-glow/10 transition-all duration-500 shrink-0 mt-1">
                  <PinIcon size={16}/>
                </div>
                <div className="flex-1">
                  <h4 className="text-[8px] font-black text-zinc-600 uppercase tracking-[0.2em] mb-0.5">Vị trí</h4>
                  <p
                    className="text-[13px] text-zinc-100 font-semibold leading-relaxed tracking-tight break-words">{location.address}</p>
                </div>
              </div>

              <div className="flex gap-4 items-center group">
                <div
                  className="p-2.5 rounded-lg bg-white/5 border border-white/10 text-sunset group-hover:bg-sunset/10 transition-all duration-500 shrink-0">
                  <DateIcon size={16}/>
                </div>
                <div className="flex-1">
                  <h4 className="text-[8px] font-black text-zinc-600 uppercase tracking-[0.2em] mb-0.5">Ngày khám
                    phá</h4>
                  <p className="text-[13px] text-zinc-100 font-semibold tracking-tight">
                    {new Date(location.created_at).toLocaleDateString('vi-VN', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 p-3.5 glass-panel border-white/5 bg-white/[0.02] rounded-xl">
              <div className="flex-1 flex flex-col gap-0.5 border-r border-white/5">
                <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Vĩ độ</span>
                <span
                  className="text-[14px] font-mono text-cyan-glow font-bold">{Number(location.lat).toFixed(6)}°</span>
              </div>
              <div className="flex-1 flex flex-col gap-0.5 pl-4">
                <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Kinh độ</span>
                <span
                  className="text-[14px] font-mono text-cyan-glow font-bold">{Number(location.lng).toFixed(6)}°</span>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-[9px] font-black text-white uppercase tracking-[0.3em] flex items-center gap-3">
                <div
                  className="w-1 h-3.5 bg-gradient-to-b from-cyan-glow to-cyan-glow/20 rounded-full shadow-neon"></div>
                Riview
              </h4>
              <div className="relative group">
                <div
                  className="p-4 border border-white/5 bg-white/[0.01] rounded-xl group-hover:bg-white/[0.03] transition-all duration-500">
                  <p className="text-zinc-400 text-[13px] leading-relaxed italic font-medium">
                    "{location.review_text || "Chưa có review."}"
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h4 className="text-[10px] font-black text-white uppercase tracking-[0.35em] flex items-center gap-3">
                <div className="w-1.5 h-4 bg-gradient-to-b from-sunset to-sunset/20 rounded-full shadow-sunset"></div>
                Thảo luận ({location.comments_count || 0})
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
                  className="flex-1 glass-panel flex items-center px-4 py-0.5 border-white/10 bg-white/5 rounded-xl focus-within:border-cyan-glow/40 focus-within:bg-white/[0.06] transition-all duration-500">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Gửi tin nhắn..."
                    className="bg-transparent border-none outline-none flex-1 text-[12px] text-white placeholder-zinc-700 py-2.5 font-medium"
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
                <div className="flex flex-col items-center justify-center py-8 gap-3">
                  <SpinnerIcon size={24} className="animate-spin text-cyan-glow"/>
                  <p className="text-[8px] font-black text-zinc-600 uppercase tracking-[0.4em]">Đang tải...</p>
                </div>
              ) : comments.length > 0 ? (
                comments.map((c, i) => (
                  <motion.div
                    key={c.id}
                    initial={{opacity: 0, x: -10}}
                    animate={{opacity: 1, x: 0}}
                    transition={{delay: i * 0.05}}
                    className="flex gap-3 group"
                  >
                    <div className="relative shrink-0">
                      <div
                        className="w-10 h-10 rounded-lg border border-white/5 p-1 overflow-hidden group-hover:border-cyan-glow/40 transition-all duration-500 bg-white/5">
                        <img src={c.avatar_url || `https://picsum.photos/150/150?random=${c.id}`}
                             className="w-full h-full rounded-md object-cover" alt="avatar"/>
                      </div>
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span
                          className="text-[12px] font-black text-white tracking-tight group-hover:text-cyan-glow transition-colors">{c.name}</span>
                        <span
                          className="text-[8px] text-zinc-600 font-black uppercase tracking-widest">{new Date(c.created_at).toLocaleDateString()}</span>
                      </div>
                      <div
                        className="bg-white/[0.02] backdrop-blur-xl rounded-xl rounded-tl-none p-3.5 border border-white/5 text-[12px] text-zinc-400 leading-relaxed group-hover:bg-white/[0.04] transition-all duration-300">
                        {c.content}
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-12 bg-white/[0.01] rounded-2xl border border-white/5 border-dashed">
                  <CommentIcon size={20} className="text-zinc-800 mx-auto mb-3"/>
                  <p className="text-zinc-600 text-[8px] font-black uppercase tracking-[0.4em]">Trống thảo luận</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-5 border-t border-white/10 bg-obsidian/80 backdrop-blur-3xl space-y-5 shrink-0 relative">
          <div
            className="absolute inset-x-0 -top-6 h-6 bg-linear-to-t from-obsidian/80 to-transparent pointer-events-none"></div>

          <div className="flex gap-3">
            <ActionButton
              loading={routeLoading}
              onClick={() => {
                navigator.geolocation.getCurrentPosition((pos) => {
                  fetchRoute([pos.coords.longitude, pos.coords.latitude], [location.lng, location.lat]);
                });
              }}
              className="flex-[3] !py-3 gap-3 shadow-[0_15px_40px_rgba(0,245,255,0.2)] rounded-xl! group/btn overflow-hidden relative"
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
              onClick={() => toggleLike(location.id, user?.uid)}
              className={`flex-1 flex items-center justify-center rounded-xl glass-panel border-white/10 transition-all duration-500 ${location.is_liked ? 'bg-sunset/15 text-sunset border-sunset/40 shadow-[0_15px_40px_rgba(255,100,100,0.15)]' : 'text-zinc-500 hover:text-white hover:bg-white/10'}`}
            >
              <LikeIcon size={20} fill={location.is_liked ? "currentColor" : "none"}
                        className={location.is_liked ? "drop-shadow-[0_0_8px_rgba(255,100,100,0.4)]" : ""}/>
            </motion.button>
          </div>
        </div>
      </GlassPanel>
    </motion.div>
  );
}

