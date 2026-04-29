import { motion, AnimatePresence } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocationStore } from "../store/useLocationsStore.jsx";
import { useAuthStore } from "../../auth/context/authContext.jsx";
import { apiClient } from "../../../shared/api/apiClient.js";
import GlassPanel from "../../../shared/components/common/glassPanel.jsx";
import ActionButton from "../../../shared/components/common/actionButton.jsx";
import {
  CloseIcon,
  PinIcon,
  RouteIcon,
  LikeIcon,
  CommentIcon,
  StarIcon,
  DateIcon,
  SpinnerIcon,
  SendIcon,
  ShareIcon,
  MoreIcon,
} from "../../../shared/components/common/icons.jsx";

export default function LocationSidebar({ location, onClose }) {
  const { user } = useAuthStore();
  const { fetchRoute, toggleLike, postComment } = useLocationStore();
  const [activeTab, setActiveTab] = useState('info');
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
    if (location && activeTab === "comments") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchComments();
    }
  }, [activeTab, fetchComments, location]);

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
      initial={{ x: "-100%", opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: "-100%", opacity: 0 }}
      transition={{ type: "spring", damping: 28, stiffness: 200 }}
      className="fixed inset-y-0 left-0 z-[2000] w-full sm:w-[480px] p-4 sm:p-6 pointer-events-none"
    >
      <GlassPanel className="h-full flex flex-col border-white/10 bg-obsidian/95 backdrop-blur-[40px] shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden pointer-events-auto rounded-[3rem] ring-1 ring-white/10 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-glow/5 via-transparent to-sunset/5 pointer-events-none"></div>

        <div className="relative h-80 shrink-0 overflow-hidden">
          <motion.div
            initial={{ scale: 1.2, filter: 'blur(10px)' }}
            animate={{ scale: 1, filter: 'blur(0px)' }}
            transition={{ duration: 0.8 }}
            className="w-full h-full"
          >
            <img
              src={location.image_url || `https://picsum.photos/1000/800?random=${location.id}`}
              className="w-full h-full object-cover grayscale-[0.1] hover:grayscale-0 transition-all duration-1000"
              alt={location.name}
            />
          </motion.div>
          <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/30 to-transparent"></div>

          <div className="absolute top-8 left-8 right-8 flex justify-between items-center z-10">
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="p-3.5 glass-panel !rounded-2xl border-white/20 bg-black/50 text-white shadow-2xl backdrop-blur-xl"
            >
              <CloseIcon size={20} />
            </motion.button>
            <div className="flex gap-2">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-3.5 glass-panel !rounded-2xl border-white/20 bg-black/50 text-white shadow-2xl backdrop-blur-xl"
              >
                <ShareIcon size={18} />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-3.5 glass-panel !rounded-2xl border-white/20 bg-black/50 text-white shadow-2xl backdrop-blur-xl"
              >
                <MoreIcon size={18} />
              </motion.button>
            </div>
          </div>

          <div className="absolute bottom-8 left-10 right-10">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex items-center gap-2 mb-4"
            >
              <div className="px-4 py-1.5 rounded-full glass-panel border-cyan-glow/40 bg-cyan-glow/20 text-cyan-glow text-[10px] font-black uppercase tracking-[0.2em] shadow-neon">
                {location.category}
              </div>
              <div className="px-4 py-1.5 rounded-full glass-panel border-white/10 bg-white/5 text-white text-[10px] font-black uppercase tracking-[0.2em]">
                {location.is_public ? 'Công khai' : 'Riêng tư'}
              </div>
            </motion.div>
            <motion.h2
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-4xl font-plus font-black tracking-tighter text-white leading-[1.1] drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]"
            >
              {location.name}
            </motion.h2>
          </div>
        </div>

        <div className="flex px-10 border-b border-white/5 bg-white/2 backdrop-blur-md">
          {['info', 'comments'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-5 text-[11px] font-black uppercase tracking-[0.3em] transition-all relative ${activeTab === tab ? 'text-cyan-glow' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              {tab === 'info' ? 'Tổng quan' : `Bình luận (${location.comments_count || 0})`}
              {activeTab === tab && (
                <motion.div layoutId="sidebarTab" className="absolute bottom-0 left-0 right-0 h-[3px] bg-cyan-glow shadow-neon rounded-full" />
              )}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar p-10 space-y-10" ref={scrollRef}>
          <AnimatePresence mode="wait">
            {activeTab === 'info' ? (
              <motion.div
                key="info"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-10"
              >
                <div className="grid grid-cols-1 gap-8">
                  <div className="flex gap-6 items-start group">
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-cyan-glow shadow-neon group-hover:scale-110 transition-transform duration-500">
                      <PinIcon size={24} />
                    </div>
                    <div>
                      <h4 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] mb-2">Vị trí thực tế</h4>
                      <p className="text-base text-zinc-200 font-medium leading-relaxed tracking-tight">{location.address}</p>
                    </div>
                  </div>

                  <div className="flex gap-6 items-start group">
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-sunset shadow-sunset group-hover:scale-110 transition-transform duration-500">
                      <DateIcon size={24} />
                    </div>
                    <div>
                      <h4 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] mb-2">Ngày cập nhật</h4>
                      <p className="text-base text-zinc-200 font-medium tracking-tight">
                        {new Date(location.created_at).toLocaleDateString('vi-VN', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-5">
                  <h4 className="text-xs font-black text-white uppercase tracking-[0.3em] flex items-center gap-3">
                    <div className="w-1.5 h-5 bg-cyan-glow rounded-full shadow-neon"></div>
                    Trải nghiệm cá nhân
                  </h4>
                  <div className="relative group">
                    <div className="absolute -left-5 top-0 bottom-0 w-1 bg-gradient-to-b from-cyan-glow/40 to-transparent rounded-full"></div>
                    <GlassPanel className="p-6 border-white/5 bg-white/2 rounded-3xl group-hover:border-white/10 transition-all duration-500">
                      <p className="text-zinc-400 text-sm leading-[1.8] italic font-medium">
                        "{location.review_text || "Chưa có lời tự sự nào cho địa điểm này. Hãy để lại dấu chân của bạn bằng cách thêm bình luận đầu tiên!"}"
                      </p>
                    </GlassPanel>
                  </div>
                </div>

                <div className="flex items-center justify-between p-6 glass-panel border-white/5 bg-white/2 rounded-3xl">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Độ cao kỹ thuật</span>
                    <span className="text-xl font-mono text-cyan-glow font-bold">{Number(location.lat).toFixed(5)}° N</span>
                  </div>
                  <div className="h-10 w-[1px] bg-white/10"></div>
                  <div className="flex flex-col gap-1 text-right">
                    <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Kinh độ kỹ thuật</span>
                    <span className="text-xl font-mono text-cyan-glow font-bold">{Number(location.lng).toFixed(5)}° E</span>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="comments"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                {loadingComments ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <SpinnerIcon size={40} className="animate-spin text-cyan-glow" />
                    <p className="text-[11px] font-black text-zinc-600 uppercase tracking-[0.3em]">Đang đồng bộ dữ liệu...</p>
                  </div>
                ) : comments.length > 0 ? (
                  <div className="space-y-8 pb-4">
                    {comments.map((c, i) => (
                      <motion.div
                        key={c.id}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08 }}
                        className="flex gap-5 group"
                      >
                        <div className="relative shrink-0">
                          <div className="w-12 h-12 rounded-2xl border-2 border-white/10 p-1 overflow-hidden shadow-2xl group-hover:border-cyan-glow/50 transition-colors duration-500">
                            <img src={c.avatar_url || `https://picsum.photos/100/100?random=${c.id}`} className="w-full h-full rounded-xl object-cover" alt="u" />
                          </div>
                          {c.is_owner && <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-cyan-glow rounded-full border-2 border-obsidian flex items-center justify-center"><StarIcon size={8} fill="currentColor" className="text-obsidian" /></div>}
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-black text-white tracking-tight">{c.name}</span>
                            <span className="text-[10px] text-zinc-600 font-black uppercase tracking-widest">{new Date(c.created_at).toLocaleDateString()}</span>
                          </div>
                          <div className="bg-white/5 backdrop-blur-md rounded-3xl rounded-tl-none p-4 border border-white/5 text-sm text-zinc-400 leading-relaxed group-hover:bg-white/10 transition-all duration-300">
                            {c.content}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-24 bg-white/2 rounded-[2.5rem] border border-white/5 border-dashed">
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CommentIcon size={32} className="text-zinc-700" />
                    </div>
                    <p className="text-zinc-500 text-[11px] font-black uppercase tracking-[0.4em]">Tầng thảo luận trống</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="p-10 border-t border-white/10 bg-black/40 backdrop-blur-3xl space-y-8 shrink-0">
          {activeTab === 'comments' && user && (
            <motion.form
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              onSubmit={handleSendComment}
              className="flex gap-4"
            >
              <div className="flex-1 glass-panel flex items-center px-6 py-2 border-white/10 bg-white/5 rounded-2xl focus-within:border-cyan-glow/50 focus-within:bg-white/10 transition-all duration-500">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Để lại lời nhắn cho thám hiểm giả..."
                  className="bg-transparent border-none outline-none flex-1 text-sm text-white placeholder-zinc-700 py-3.5 font-medium"
                />
                <button type="submit" disabled={!commentText.trim()} className="text-cyan-glow disabled:text-zinc-800 transition-all hover:scale-110 active:scale-90">
                  <SendIcon size={22} className="drop-shadow-neon" />
                </button>
              </div>
            </motion.form>
          )}

          <div className="flex gap-4">
            <ActionButton
              onClick={() => {
                navigator.geolocation.getCurrentPosition((pos) => {
                  fetchRoute([pos.coords.longitude, pos.coords.latitude], [location.lng, location.lat]);
                });
              }}
              className="flex-[2] !py-4.5 gap-4 shadow-[0_0_30px_rgba(0,245,255,0.3)] !rounded-[1.5rem] group"
            >
              <RouteIcon size={20} className="group-hover:translate-x-1 transition-transform" />
              <span className="uppercase tracking-[0.3em] text-xs font-black">Thiết lập lộ trình</span>
            </ActionButton>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => toggleLike(location.id, user?.uid)}
              className={`flex-1 flex items-center justify-center rounded-[1.5rem] glass-panel border-white/10 transition-all duration-500 ${location.is_liked ? 'bg-sunset/20 text-sunset border-sunset/40 shadow-[0_0_30px_rgba(255,100,100,0.3)]' : 'text-zinc-500 hover:text-white hover:bg-white/10'}`}
            >
              <LikeIcon size={24} fill={location.is_liked ? "currentColor" : "none"} className={location.is_liked ? "drop-shadow-sunset" : ""} />
            </motion.button>
          </div>
        </div>
      </GlassPanel>
    </motion.div>
  );
}

