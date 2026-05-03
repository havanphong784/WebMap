import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../auth/context/authContext.jsx";
import { useLocationStore } from "../map/store/useLocationsStore.jsx";
import GlassPanel from "../../shared/components/common/glassPanel.jsx";
import ActionButton from "../../shared/components/common/actionButton.jsx";
import {
  CommentIcon,
  FilterIcon,
  LikeIcon,
  PinIcon,
  PlusIcon,
  SearchIcon,
  SpinnerIcon,
  TrendingIcon
} from "../../shared/components/common/icons.jsx";
import Skeleton from "../../shared/components/common/skeleton.jsx";

const DiscoveryCard = ({ post, index, navigate, onLike }) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.04 }}
      className="break-inside-avoid relative group cursor-pointer glass-panel rounded-3xl border-glass-border overflow-hidden hover:border-cyan-glow/20 transition-all duration-500 mb-6"
      onClick={() => navigate("/", { state: { focusLocation: post } })}
    >
      <div className="relative overflow-hidden rounded-3xl">
        {!imageLoaded && (
          <Skeleton width="100%" height="300px" className="rounded-3xl" />
        )}
        <img
          src={post.image_url || `https://picsum.photos/400/600?random=${post.id}`}
          alt={post.name}
          onLoad={() => setImageLoaded(true)}
          className={`w-full rounded-3xl grayscale-[0.3] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700 ${imageLoaded ? 'opacity-100 block' : 'opacity-0 absolute inset-0'}`}
        />
        <div
          className={`absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 transition-opacity ${imageLoaded ? 'opacity-80 group-hover:opacity-100' : 'opacity-0'}`}>
        </div>

        <div className="absolute top-4 left-4 right-4 flex items-center gap-2 z-10">
          <div className="w-8 h-8 rounded-full border border-white/30 p-0.5 glass-panel bg-white/20 backdrop-blur-md overflow-hidden">
            <img
              src={post.user_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.user_id}`}
              className="w-full h-full rounded-full object-cover"
              alt={post.user_name}
            />
          </div>
          <span className="text-[10px] font-bold text-white uppercase tracking-wider drop-shadow-md">{post.user_name || 'Aether User'}</span>
        </div>

        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex items-center gap-1.5 text-cyan-glow mb-1">
            <PinIcon size={12} className="shadow-neon" />
            <span className="text-[10px] font-bold uppercase tracking-widest truncate">{post.address}</span>
          </div>
          <h3 className="text-xl font-plus font-bold text-text-primary mb-3 line-clamp-1">{post.name}</h3>

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <motion.button
                whileTap={{ scale: 0.8 }}
                onClick={(e) => onLike(e, post)}
                className={`flex items-center gap-1.5 glass-panel py-1.5 px-3 border transition-all duration-300 ${post.is_liked ? 'border-sunset/30 bg-sunset/10' : 'border-glass-border bg-glass-white'}`}
              >
                <LikeIcon
                  size={12}
                  className={post.is_liked ? "text-sunset fill-sunset drop-shadow-[0_0_4px_rgba(255,75,43,0.5)]" : "text-text-secondary"}
                />
                <span className={`text-[10px] font-bold ${post.is_liked ? 'text-sunset' : 'text-text-primary'}`}>
                  {post.likes_count || 0}
                </span>
              </motion.button>
              <div
                className="flex items-center gap-1.5 glass-panel py-1.5 px-3 border-glass-border bg-glass-white">
                <CommentIcon size={12} className="text-text-secondary" />
                <span className="text-[10px] font-bold text-text-primary">{post.comments_count || 0}</span>
              </div>
            </div>
            {post.category && (
              <span className="text-[9px] font-bold uppercase tracking-widest glass-panel px-2 py-1 border-cyan-glow/20 text-cyan-glow bg-cyan-glow/5">
                {post.category}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const DiscoveryFeed = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { trendingLocations, fetchTrending, toggleLike, isLoading, tags, fetchUniqueTags, fetchByTag } = useLocationStore();

  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchUniqueTags();
  }, [fetchUniqueTags]);

  useEffect(() => {
    if (activeCategory === 'All') {
      fetchTrending(user?.uid);
    } else {
      fetchByTag(activeCategory, user?.uid);
    }
  }, [fetchTrending, fetchByTag, activeCategory, user?.uid]);

  const categories = ['All', ...tags];

  const handleToggleLike = (e, post) => {
    e.stopPropagation();
    if (!user) {
      navigate('/login');
      return;
    }
    toggleLike(post.id, user.uid);
  };

  const filteredPosts = trendingLocations.filter(p => {
    const matchSearch = !searchQuery || p.name?.toLowerCase().includes(searchQuery.toLowerCase()) || p.address?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchSearch;
  });

  return (
    <div className="min-h-screen bg-map-bg pt-6 pb-32 px-6 overflow-y-auto no-scrollbar">
      <div className="flex items-center gap-4 mb-8 max-w-4xl mx-auto">
        <GlassPanel
          className="flex-1 flex items-center gap-3 py-3 px-5 rounded-full border-glass-border bg-white shadow-floating">
          <SearchIcon size={20} className="text-text-secondary shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Khám phá những địa điểm bí ẩn..."
            className="bg-transparent border-none outline-none flex-1 text-text-primary placeholder-text-dim font-medium text-sm"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-text-muted hover:text-text-primary transition-colors text-xs font-bold">✕</button>
          )}
        </GlassPanel>

        <motion.div
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate(user ? `/profile/${user?.uid}` : '/login')}
          className="w-12 h-12 rounded-full border-2 border-cyan-glow p-0.5 shadow-neon cursor-pointer overflow-hidden shrink-0"
        >
          <img src={user?.photoURL || "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y"}
            className="w-full h-full rounded-full object-cover"
            alt="profile" />
        </motion.div>
      </div>

      <div className="max-w-4xl mx-auto mb-8">
        <div className="flex items-center gap-3 mb-2">
          <TrendingIcon size={24} className="text-cyan-glow animate-pulse" />
          <h1 className="text-3xl font-plus font-black tracking-tight text-text-primary uppercase">Khám phá</h1>
        </div>
        <p className="text-text-secondary text-sm font-medium">
          Những địa điểm được cộng đồng Aether săn đón nhất.
          {searchQuery && <span className="text-cyan-glow ml-2">Đang tìm: "{searchQuery}"</span>}
        </p>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-8 no-scrollbar -mx-6 px-6 max-w-4xl md:mx-auto">
        {categories.map((cat) => (
          <motion.button
            key={cat}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveCategory(cat)}
            className={`
              whitespace-nowrap px-6 py-2.5 rounded-full border text-xs font-bold tracking-widest uppercase transition-all duration-300
              ${activeCategory === cat
                ? 'bg-cyan-glow text-white border-cyan-glow shadow-neon'
                : 'glass-panel border-glass-border text-text-secondary hover:text-text-primary hover:border-glass-border-bright'}
            `}
          >
            {cat}
          </motion.button>
        ))}
      </div>

      <div className="max-w-4xl mx-auto">
        {isLoading ? (
          <div className="columns-1 sm:columns-2 gap-6 space-y-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="break-inside-avoid glass-panel rounded-3xl border-glass-border overflow-hidden p-4 flex flex-col gap-4"
                style={{ height: `${320 + (i % 3) * 60}px` }}
              >
                <div className="flex-1 min-h-0 flex flex-col">
                  <Skeleton width="100%" height="100%" className="flex-1 rounded-2xl" />
                </div>
                <div className="shrink-0 space-y-3">
                  <Skeleton width="60%" height="1rem" />
                  <Skeleton width="90%" height="1.75rem" />
                  <div className="flex justify-between items-center pt-1">
                    <Skeleton width="35%" height="2rem" className="rounded-lg" />
                    <Skeleton width="25%" height="2rem" className="rounded-lg" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredPosts.length > 0 ? (
          <div className="columns-1 sm:columns-2 gap-x-6">
            <AnimatePresence>
              {filteredPosts.map((post, i) => (
                <DiscoveryCard
                  key={post.id}
                  post={post}
                  index={i}
                  navigate={navigate}
                  onLike={handleToggleLike}
                />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="text-center py-40 glass-panel border-glass-border bg-glass-white/50 rounded-3xl">
            <FilterIcon size={48} className="text-text-dim mx-auto mb-4 opacity-20" />
            <p className="text-text-secondary font-plus font-bold uppercase tracking-widest text-sm mb-2">
              {searchQuery ? `Không tìm thấy "${searchQuery}"` : 'Không tìm thấy địa điểm phù hợp'}
            </p>
            {(searchQuery || activeCategory !== 'All') && (
              <button
                onClick={() => { setSearchQuery(''); setActiveCategory('All'); }}
                className="text-cyan-glow text-xs font-bold uppercase tracking-widest hover:underline mt-2"
              >
                Xóa bộ lọc
              </button>
            )}
          </div>
        )}
      </div>

      <div className="fixed bottom-32 right-6 z-20">
        <ActionButton variant="primary" className="p-5! shadow-neon" onClick={() => navigate('/')}>
          <PlusIcon size={28} />
        </ActionButton>
      </div>
    </div>
  );
};

export default DiscoveryFeed;
