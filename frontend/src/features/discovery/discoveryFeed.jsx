import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../auth/context/authContext.jsx";
import GlassPanel from "../../shared/components/common/glassPanel.jsx";
import ActionButton from "../../shared/components/common/actionButton.jsx";
import { apiClient } from "../../shared/api/apiClient.js";
import {
  SearchIcon,
  TrendingIcon,
  FilterIcon,
  PinIcon,
  LikeIcon,
  CommentIcon,
  PlusIcon,
  SpinnerIcon
} from "../../shared/components/common/icons.jsx";

const DiscoveryFeed = () => {
  const navigate = useNavigate();
  const {user} = useAuthStore();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');

  const categories = ['All', 'Urban', 'Nature', 'Abandoned', 'Hidden Gems', 'Night Life'];

  const fetchTrending = useCallback(async () => {
    setLoading(true);
    try {
      const result = await apiClient.get(`/locations/trending?user_id=${user?.uid || "guest"}`);
      if (result.success) {
        setPosts(result.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTrending();
  }, [fetchTrending]);

  const filteredPosts = activeCategory === 'All'
    ? posts
    : posts.filter(p => p.category?.toLowerCase() === activeCategory.toLowerCase());

  return (
    <div className="min-h-screen bg-obsidian pt-6 pb-32 px-6 overflow-y-auto no-scrollbar">
      <div className="flex items-center gap-4 mb-8 max-w-4xl mx-auto">
        <GlassPanel
          className="flex-1 flex items-center gap-3 py-3 px-5 rounded-full border-white/5 bg-white/5 shadow-2xl">
          <SearchIcon size={20} className="text-zinc-400"/>
          <input
            type="text"
            placeholder="Khám phá những địa điểm bí ẩn..."
            className="bg-transparent border-none outline-none flex-1 text-white placeholder-zinc-500 font-medium text-sm"
          />
        </GlassPanel>

        <motion.div
          whileHover={{scale: 1.1}}
          whileTap={{scale: 0.9}}
          onClick={() => navigate(`/profile/${user?.uid}`)}
          className="w-12 h-12 rounded-full border-2 border-cyan-glow p-0.5 shadow-neon cursor-pointer overflow-hidden"
        >
          <img src={user?.photoURL || "https://picsum.photos/100/100?random=1"} className="w-full h-full rounded-full"
               alt="profile"/>
        </motion.div>
      </div>

      <div className="max-w-4xl mx-auto mb-8">
        <div className="flex items-center gap-3 mb-2">
          <TrendingIcon size={24} className="text-cyan-glow animate-pulse"/>
          <h1 className="text-3xl font-plus font-black tracking-tight text-white uppercase">Khám phá</h1>
        </div>
        <p className="text-zinc-500 text-sm font-medium">Những địa điểm được cộng đồng Aether săn đón nhất tuần này.</p>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-8 no-scrollbar -mx-6 px-6 max-w-4xl md:mx-auto">
        {categories.map((cat) => (
          <motion.button
            key={cat}
            whileHover={{y: -2}}
            whileTap={{scale: 0.95}}
            onClick={() => setActiveCategory(cat)}
            className={`
              whitespace-nowrap px-6 py-2.5 rounded-full border text-xs font-bold tracking-widest uppercase transition-all duration-300
              ${activeCategory === cat
              ? 'bg-cyan-glow text-obsidian border-cyan-glow shadow-neon'
              : 'glass-panel border-white/5 text-zinc-500 hover:text-white hover:border-white/20'}
            `}
          >
            {cat}
          </motion.button>
        ))}
      </div>

      <div className="max-w-4xl mx-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-40 gap-4">
            <SpinnerIcon size={40} className="animate-spin text-cyan-glow"/>
            <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Đang tìm kiếm báu vật...</p>
          </div>
        ) : filteredPosts.length > 0 ? (
          <div className="columns-1 sm:columns-2 gap-6 space-y-6">
            {filteredPosts.map((post, i) => (
              <motion.div
                key={post.id}
                initial={{opacity: 0, y: 20}}
                animate={{opacity: 1, y: 0}}
                transition={{delay: i * 0.05}}
                className="break-inside-avoid relative group cursor-pointer glass-panel rounded-3xl border-white/5 overflow-hidden hover:border-cyan-glow/30 transition-all duration-500"
                onClick={() => navigate("/", {state: {focusLocation: post}})}
              >
                <img
                  src={post.image_url || `https://picsum.photos/400/600?random=${post.id}`}
                  alt={post.name}
                  className="w-full rounded-3xl grayscale-[0.3] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700"
                />
                <div
                  className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity"></div>

                <div className="absolute bottom-4 left-4 right-4">
                  <div className="flex items-center gap-1.5 text-cyan-glow mb-1">
                    <PinIcon size={12} className="shadow-neon"/>
                    <span className="text-[10px] font-bold uppercase tracking-widest truncate">{post.address}</span>
                  </div>
                  <h3 className="text-xl font-plus font-bold text-white mb-3 line-clamp-1">{post.name}</h3>

                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 glass-panel py-1 px-3 border-white/10 bg-white/5">
                        <LikeIcon size={12} className={post.is_liked ? "text-sunset fill-sunset" : "text-zinc-400"}/>
                        <span className="text-[10px] font-bold text-white">{post.likes_count || 0}</span>
                      </div>
                      <div className="flex items-center gap-1.5 glass-panel py-1 px-3 border-white/10 bg-white/5">
                        <CommentIcon size={12} className="text-zinc-400"/>
                        <span className="text-[10px] font-bold text-white">{post.comments_count || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-40 glass-panel border-white/5 bg-white/2">
            <FilterIcon size={48} className="text-zinc-800 mx-auto mb-4 opacity-20"/>
            <p className="text-zinc-500 font-plus font-bold uppercase tracking-widest text-sm">Không tìm thấy địa điểm phù hợp</p>
          </div>
        )}
      </div>

      <div className="fixed bottom-32 right-6 z-20">
        <ActionButton variant="primary" className="!p-5 shadow-neon" onClick={() => navigate('/')}>
          <PlusIcon size={28}/>
        </ActionButton>
      </div>
    </div>
  );
};

export default DiscoveryFeed;

