import {memo, useState} from "react";
import {motion} from "framer-motion";
import {
  CommentIcon,
  LikeIcon,
  PinIcon
} from "../../../shared/components/common/icons.jsx";
import Skeleton from "react-loading-skeleton";
import UserBadge from "../../../shared/components/UserBadge.jsx";

const DiscoveryCard = memo(({post, index, navigate, onLike}) => {
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
      <div className="relative overflow-hidden rounded-3xl aspect-[4/5]">
        {!imageLoaded && (
          <div className="absolute inset-0">
            <Skeleton width="100%" height="100%" borderRadius={24}/>
          </div>
        )}
        {post.image_url ? (
          <img
            src={post.image_url}
            alt={post.name}
            loading="lazy"
            decoding="async"
            onLoad={() => setImageLoaded(true)}
            className={`w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700 ${imageLoaded ? "opacity-100 block" : "opacity-0 absolute inset-0"}`}
          />
        ) : (
          <div className="w-full h-full bg-obsidian-soft/30 flex flex-col items-center justify-center gap-3 rounded-3xl"
               onMouseEnter={() => setImageLoaded(true)}>
            <div className="w-12 h-12 rounded-full bg-white/[0.05] border border-white/10 flex items-center justify-center">
              <PinIcon size={20} className="text-text-dim/40"/>
            </div>
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-text-dim/50">Khong co anh</span>
          </div>
        )}
        <div className={`absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 transition-opacity ${imageLoaded ? "opacity-80 group-hover:opacity-100" : "opacity-0"}`}/>

        <div className="absolute top-4 left-4 right-4 flex items-center gap-2 z-10">
          <UserBadge user={postUser} size={32} hideLevelBadge={true}/>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-white uppercase tracking-wider drop-shadow-md leading-none">{post.user_name || "Aether User"}</span>
            <span className="text-[7px] font-bold text-cyan-glow uppercase tracking-widest mt-0.5">{post.user_tier || "Scout"}</span>
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
                className={`flex items-center gap-1.5 glass-panel py-1.5 px-3 border transition-all duration-300 ${post.is_liked ? "border-sunset/30 bg-sunset/10" : "border-glass-border bg-glass-white"}`}
              >
                <LikeIcon
                  size={12}
                  className={post.is_liked ? "text-sunset fill-sunset drop-shadow-[0_0_4px_rgba(255,75,43,0.5)]" : "text-text-secondary"}
                />
                <span className={`text-[10px] font-bold ${post.is_liked ? "text-sunset" : "text-text-primary"}`}>
                  {post.likes_count || 0}
                </span>
              </motion.button>
              <div className="flex items-center gap-1.5 glass-panel py-1.5 px-3 border-glass-border bg-glass-white">
                <CommentIcon size={12} className="text-text-secondary"/>
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
});

DiscoveryCard.displayName = "DiscoveryCard";

export default DiscoveryCard;

