import {useEffect, useState} from "react";
import {AnimatePresence, motion} from "framer-motion";
import {useNavigate} from "react-router-dom";
import {useAuthStore} from "../auth/context/authContext.jsx";
import {useLocationStore} from "../map/store/useLocationsStore.jsx";
import GlassPanel from "../../shared/components/common/glassPanel.jsx";
import ActionButton from "../../shared/components/common/actionButton.jsx";
import {
  CommentIcon,
  FilterIcon,
  LikeIcon,
  PinIcon,
  PlusIcon,
  SearchIcon,
  TrendingIcon
} from "../../shared/components/common/icons.jsx";
import Skeleton, {SkeletonTheme} from "react-loading-skeleton";
import UserBadge from "../../shared/components/UserBadge.jsx";

const DiscoveryCard = ({post, index, navigate, onLike}) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  const postUser = {
    firebase_uid: post.user_id,
    name: post.user_name,
    avatar_url: post.user_avatar,
    xp: post.user_xp,
    level: post.user_level,
    tier: post.user_tier
  };

  return (
    <motion.div
      layout
      initial={{opacity: 0, y: 20}}
      animate={{opacity: 1, y: 0}}
      exit={{opacity: 0, scale: 0.95}}
      transition={{delay: index * 0.04}}
      className="break-inside-avoid relative group cursor-pointer glass-panel rounded-3xl border-glass-border overflow-hidden hover:border-cyan-glow/20 transition-all duration-500 mb-6"
      onClick={() => navigate("/", {state: {focusLocation: post}})}
    >
      <div className="relative overflow-hidden rounded-3xl">
        {!imageLoaded && (
          <Skeleton width="100%" height={300} borderRadius={24}/>
        )}
        {post.image_url ? (
          <img
            src={post.image_url}
            alt={post.name}
            loading="lazy"
            decoding="async"
            onLoad={() => setImageLoaded(true)}
            className={`w-full rounded-3xl grayscale-[0.3] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700 ${imageLoaded ? 'opacity-100 block' : 'opacity-0 absolute inset-0'}`}
          />
        ) : (
          <div className="w-full h-64 bg-obsidian-soft/30 flex flex-col items-center justify-center gap-3 rounded-3xl"
               onMouseEnter={() => setImageLoaded(true)}>
            <div
              className="w-12 h-12 rounded-full bg-white/[0.05] border border-white/10 flex items-center justify-center">
              <PinIcon size={20} className="text-text-dim/40"/>
            </div>
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-text-dim/50">Không có ảnh</span>
          </div>
        )}
        <div
          className={`absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 transition-opacity ${imageLoaded ? 'opacity-80 group-hover:opacity-100' : 'opacity-0'}`}>
        </div>

        <div className="absolute top-4 left-4 right-4 flex items-center gap-2 z-10">
          <UserBadge user={postUser} size={32} hideLevelBadge={true}/>
          <div className="flex flex-col">
            <span
              className="text-[10px] font-bold text-white uppercase tracking-wider drop-shadow-md leading-none">{post.user_name || 'Aether User'}</span>
            <span
              className="text-[7px] font-bold text-cyan-glow uppercase tracking-widest mt-0.5">{post.user_tier || 'Scout'}</span>
          </div>
        </div>

        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex items-center gap-1.5 text-cyan-glow mb-1">
            <PinIcon size={12} className="shadow-neon"/>
            <span className="text-[10px] font-bold uppercase tracking-widest truncate">{post.address}</span>
          </div>
          <h3 className="text-xl font-jakarta font-bold text-text-primary mb-3 line-clamp-1">{post.name}</h3>

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <motion.button
                whileTap={{scale: 0.8}}
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
                <CommentIcon size={12} className="text-text-secondary"/>
                <span className="text-[10px] font-bold text-text-primary">{post.comments_count || 0}</span>
              </div>
            </div>
            {post.category && (
              <span
                className="text-[9px] font-bold uppercase tracking-widest glass-panel px-2 py-1 border-cyan-glow/20 text-cyan-glow bg-cyan-glow/5">
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
  const {user} = useAuthStore();
  const {
    trendingLocations,
    fetchTrending,
    toggleLike,
    isLoading,
    tags,
    fetchUniqueTags,
    fetchByTag,
    followingLocations,
    fetchFollowing
  } = useLocationStore();

  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [feedType, setFeedType] = useState('global');

  useEffect(() => {
    fetchUniqueTags();
  }, [fetchUniqueTags]);

  useEffect(() => {
    if (feedType === 'global') {
      if (activeCategory === 'All') {
        fetchTrending(user?.uid);
      } else {
        fetchByTag(activeCategory, user?.uid);
      }
    } else {
      fetchFollowing(user?.uid);
    }
  }, [fetchTrending, fetchByTag, fetchFollowing, activeCategory, user?.uid, feedType]);

  const categories = ['All', ...tags];

  const handleToggleLike = (e, post) => {
    e.stopPropagation();
    if (!user) {
      navigate('/login');
      return;
    }
    toggleLike(post.id, user.uid);
  };

  const currentLocationsList = feedType === 'global' ? trendingLocations : followingLocations;

  const filteredPosts = currentLocationsList.filter(p => {
    const matchSearch = !searchQuery || p.name?.toLowerCase().includes(searchQuery.toLowerCase()) || p.address?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchSearch;
  });

  return (
    <div className="min-h-screen bg-map-bg pt-4 sm:pt-6 pb-32 px-4 sm:px-6 overflow-y-auto no-scrollbar">
      <div className="flex items-center gap-2 sm:gap-4 mb-6 sm:mb-8 max-w-4xl mx-auto">
        <GlassPanel
          className="flex-1 flex items-center gap-2 sm:gap-3 py-2.5 sm:py-3 px-4 sm:px-5 rounded-full border-glass-border bg-white shadow-floating">
          <SearchIcon size={18} className="text-text-secondary shrink-0"/>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Khám phá những địa điểm bí ẩn..."
            className="bg-transparent border-none outline-none flex-1 text-text-primary placeholder-text-dim font-medium text-sm"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')}
                    className="text-text-muted hover:text-text-primary transition-colors text-xs font-bold">✕</button>
          )}
        </GlassPanel>

        <motion.div
          whileHover={{scale: 1.1}}
          whileTap={{scale: 0.9}}
          onClick={() => navigate(user ? `/profile/${user?.uid}` : '/login')}
          className="cursor-pointer shrink-0"
        >
          {user ? (
            <UserBadge user={user} size={48} hideLevelBadge={true}/>
          ) : (
            <div
              className="w-12 h-12 rounded-full border-2 border-dashed border-glass-border flex items-center justify-center text-text-dim">
              ?
            </div>
          )}
        </motion.div>
      </div>

      <div className="max-w-4xl mx-auto mb-6 sm:mb-8">
        <div className="flex items-center gap-8 border-b border-glass-border mb-6">
          <button
            onClick={() => setFeedType('global')}
            className={`pb-4 text-sm font-jakarta font-black uppercase tracking-[0.2em] relative transition-all duration-300 ${feedType === 'global' ? 'text-cyan-glow' : 'text-text-muted hover:text-text-primary'}`}
          >
            Cộng đồng
            {feedType === 'global' && <motion.div layoutId="feedTab"
                                                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-glow shadow-neon"/>}
          </button>
          {user && (
            <button
              onClick={() => setFeedType('following')}
              className={`pb-4 text-sm font-jakarta font-black uppercase tracking-[0.2em] relative transition-all duration-300 ${feedType === 'following' ? 'text-sunset' : 'text-text-muted hover:text-text-primary'}`}
            >
              Đang theo dõi
              {feedType === 'following' && <motion.div layoutId="feedTab"
                                                       className="absolute bottom-0 left-0 right-0 h-0.5 bg-sunset shadow-sunset"/>}
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
          <TrendingIcon size={20} className="text-cyan-glow animate-pulse sm:size-24"/>
          <h1 className="text-2xl sm:text-3xl font-jakarta font-black tracking-tight text-text-primary uppercase">
            {feedType === 'global' ? 'Khám phá' : 'Đang theo dõi'}
          </h1>
        </div>
        <p className="text-text-secondary text-sm font-medium">
          {feedType === 'global'
            ? 'Những địa điểm được cộng đồng Aether săn đón nhất.'
            : 'Những địa điểm mới nhất từ những người bạn theo dõi.'}
          {searchQuery && <span className="text-cyan-glow ml-2">Đang tìm: "{searchQuery}"</span>}
        </p>
      </div>

      {feedType === 'global' && (
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
                ? 'bg-cyan-glow text-white border-cyan-glow shadow-neon'
                : 'glass-panel border-glass-border text-text-secondary hover:text-text-primary hover:border-glass-border-bright'}
              `}
            >
              {cat}
            </motion.button>
          ))}
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
            <SkeletonTheme baseColor="rgba(255,255,255,0.05)" highlightColor="rgba(255,255,255,0.1)">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="glass-panel overflow-hidden border-glass-border">
                  <Skeleton height={200}/>
                  <div className="p-5 space-y-3">
                    <div className="flex justify-between items-start">
                      <Skeleton width={120} height={16}/>
                      <Skeleton width={40} height={16}/>
                    </div>
                    <Skeleton width="100%" height={24}/>
                    <Skeleton width="60%" height={12}/>
                    <div className="flex gap-2 pt-2">
                      <Skeleton circle width={32} height={32}/>
                      <div className="flex-1">
                        <Skeleton width={80} height={10}/>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </SkeletonTheme>
          </div>
        ) : filteredPosts.length > 0 ? (
          <div className="sm:columns-2 columns-1 gap-x-6">
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
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-32 sm:py-40 glass-panel border border-glass-border bg-glass-obsidian rounded-3xl flex flex-col items-center justify-center relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-cyan-glow/5 opacity-50"></div>
            
            <motion.div 
              animate={{ y: [-5, 5, -5] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="relative z-10 p-6 rounded-full bg-white/[0.02] border border-white/[0.05] mb-6 group-hover:border-cyan-glow/20 transition-colors duration-500"
            >
              <FilterIcon size={48} className="text-cyan-glow/40 drop-shadow-neon" />
            </motion.div>
            
            <p className="relative z-10 text-text-primary font-jakarta font-black uppercase tracking-[0.2em] text-sm sm:text-base mb-3 drop-shadow-md">
              {searchQuery ? `Không tìm thấy "${searchQuery}"` : 'Trống rỗng...'}
            </p>
            
            <p className="relative z-10 text-text-muted text-xs font-medium max-w-xs mx-auto mb-6">
              {searchQuery 
                ? "Thử thay đổi từ khóa hoặc xóa bộ lọc để xem thêm địa điểm." 
                : "Chưa có địa điểm nào trong khu vực này. Hãy là người đầu tiên khám phá!"}
            </p>

            {(searchQuery || activeCategory !== 'All') ? (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setActiveCategory('All');
                }}
                className="relative z-10 text-obsidian bg-cyan-glow px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all shadow-neon hover:scale-105 active:scale-95"
              >
                Xóa bộ lọc
              </button>
            ) : (
              <button
                onClick={() => navigate('/')}
                className="relative z-10 text-cyan-glow bg-cyan-glow/10 border border-cyan-glow/30 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-cyan-glow/20 transition-all shadow-glass hover:scale-105 active:scale-95"
              >
                Trở về bản đồ
              </button>
            )}
          </motion.div>
        )}
      </div>

      <div className="fixed bottom-32 right-6 z-20">
        <ActionButton variant="primary" className="p-5! shadow-neon" onClick={() => navigate('/')}>
          <PlusIcon size={28}/>
        </ActionButton>
      </div>
    </div>
  );
};

export default DiscoveryFeed;
