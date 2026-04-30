import {useCallback, useEffect, useState} from "react";
import {useNavigate, useParams} from "react-router-dom";
import {useAuthStore} from "../auth/context/authContext.jsx";
import {apiClient} from "../../shared/api/apiClient.js";
import {motion} from "framer-motion";
import {
  ArrowIcon,
  LikeIcon,
  PhotoIcon,
  PinIcon,
  SecurityIcon,
  SpinnerIcon,
  StarIcon
} from "../../shared/components/common/icons.jsx";
import GlassPanel from "../../shared/components/common/glassPanel.jsx";
import ActionButton from "../../shared/components/common/actionButton.jsx";

export default function ProfilePage() {
  const {uid} = useParams();
  const navigate = useNavigate();
  const {user: currentUser} = useAuthStore();
  const [profileUser, setProfileUser] = useState(null);
  const [userLocations, setUserLocations] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProfileData = useCallback(async () => {
    setLoading(true);
    try {
      const [userData, locData] = await Promise.all([
        apiClient.get(`/auth/${uid}`),
        apiClient.get(`/locations/user/${uid}?current_user_id=${currentUser?.uid || ""}`)
      ]);

      if (userData.success) setProfileUser(userData.user);
      if (locData.success) setUserLocations(locData.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [currentUser, uid]);

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  if (loading) return (
    <div className="min-h-screen bg-obsidian flex flex-col items-center justify-center space-y-6">
      <SpinnerIcon size={48} className="animate-spin text-cyan-glow"/>
      <p className="text-zinc-500 font-plus font-bold uppercase tracking-widest text-xs">Đang tải hồ sơ...</p>
    </div>
  );

  const stats = [
    {label: 'Bài viết', value: profileUser?.total_posts || 0, icon: PhotoIcon},
    {label: 'Điểm', value: profileUser?.total_likes_received * 10 || 0, icon: StarIcon},
    {label: 'Lượt thích', value: profileUser?.total_likes_received || 0, icon: LikeIcon, color: 'text-sunset'},
  ];

  return (
    <div className="min-h-screen bg-obsidian text-white pb-32">
      <div className="relative h-64 w-full overflow-hidden">
        <motion.img
          initial={{scale: 1.2}}
          animate={{scale: 1}}
          src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200"
          className="w-full h-full object-cover grayscale-[0.3]"
          alt="cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/40 to-transparent"></div>
        <div className="absolute top-6 left-6 z-50">
          <ActionButton variant="icon" onClick={() => navigate(-1)} className="rotate-180">
            <ArrowIcon size={24}/>
          </ActionButton>
        </div>
        {currentUser?.uid === uid && (
          <div className="absolute top-6 right-6 z-50">
            <ActionButton variant="icon">
              <SecurityIcon size={20}/>
            </ActionButton>
          </div>
        )}
      </div>

      <div className="px-6 -mt-20 relative z-10">
        <div className="flex flex-col items-center">
          <motion.div
            initial={{y: 20, opacity: 0}}
            animate={{y: 0, opacity: 1}}
            className="relative"
          >
            <div className="w-36 h-36 rounded-full border-4 border-obsidian p-1 bg-cyan-glow shadow-neon">
              <img
                src={profileUser.avatar_url || "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQhss08c278ij8ETUWb_pKiO882Ko_kjbwerQ&s"}
                className="w-full h-full rounded-full object-cover"
                alt="profile"
              />
            </div>
            <div
              className="absolute bottom-1 right-1 bg-cyan-glow text-obsidian px-3 py-1 rounded-full text-[10px] font-bold shadow-neon border-2 border-obsidian">
              EXP
            </div>
          </motion.div>

          <motion.div
            initial={{opacity: 0}}
            animate={{opacity: 1}}
            transition={{delay: 0.2}}
            className="text-center mt-6"
          >
            <h1 className="text-4xl font-plus font-black tracking-tight">{profileUser.name}</h1>
            <p className="text-zinc-500 font-medium mt-1">{profileUser.email}</p>
            <div
              className="inline-block mt-3 px-4 py-1.5 rounded-full glass-panel border-cyan-glow/20 bg-cyan-glow/5 text-cyan-glow text-[10px] font-bold uppercase tracking-widest shadow-neon">
              Elite Explorer
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-10 max-w-2xl mx-auto">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{opacity: 0, y: 20}}
              animate={{opacity: 1, y: 0}}
              transition={{delay: 0.3 + (i * 0.1)}}
            >
              <GlassPanel
                className="py-4 px-2 text-center border-white/5 bg-white/5 hover:bg-white/10 transition-colors">
                <stat.icon size={18} className={`${stat.color || 'text-cyan-glow'} mx-auto mb-2`}/>
                <div className="text-2xl font-plus font-black tracking-tighter">{stat.value}</div>
                <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">{stat.label}</div>
              </GlassPanel>
            </motion.div>
          ))}
        </div>

        <div className="mt-16 max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-8 border-b border-white/5 pb-4">
            <div className="w-1.5 h-6 bg-cyan-glow rounded-full shadow-neon"></div>
            <h2 className="text-xl font-plus font-bold uppercase tracking-tight">Địa điểm đã chinh phục</h2>
            <span className="ml-auto glass-panel px-3 py-1 text-[10px] font-mono text-zinc-500 border-white/10">
              {userLocations.length} GHIM
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {userLocations.map((loc, i) => (
              <motion.div
                key={loc.id}
                initial={{opacity: 0, scale: 0.9}}
                whileInView={{opacity: 1, scale: 1}}
                viewport={{once: true}}
                transition={{delay: (i % 3) * 0.1}}
                onClick={() => navigate("/", {state: {focusLocation: loc}})}
                className="group relative glass-panel rounded-3xl border-white/5 overflow-hidden hover:border-cyan-glow/30 transition-all duration-500 cursor-pointer shadow-2xl"
              >
                <div className="aspect-[4/3] relative overflow-hidden">
                  <img
                    src={loc.image_url || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500"}
                    className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700"
                    alt={loc.name}
                  />
                  <div
                    className="absolute inset-0 bg-gradient-to-t from-obsidian via-transparent to-transparent opacity-60"></div>

                  <div
                    className="absolute top-4 right-4 glass-panel px-3 py-1.5 rounded-full text-[10px] font-bold border-white/10 flex items-center gap-2 shadow-xl bg-black/40">
                    <LikeIcon size={14} className={loc.is_liked ? "text-sunset fill-sunset" : "text-zinc-500"}/>
                    <span className={loc.is_liked ? "text-white" : "text-zinc-400"}>{loc.likes_count || 0}</span>
                  </div>

                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="flex items-center gap-1.5 text-cyan-glow mb-1">
                      <PinIcon size={12} className="shadow-neon"/>
                      <span className="text-[10px] font-bold uppercase tracking-widest truncate">{loc.address}</span>
                    </div>
                    <h3
                      className="text-lg font-plus font-bold text-white group-hover:text-cyan-glow transition-colors line-clamp-1">{loc.name}</h3>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {userLocations.length === 0 && (
            <div className="text-center py-20 glass-panel border-white/5 bg-white/2">
              <PhotoIcon size={48} className="text-zinc-800 mx-auto mb-4 opacity-20"/>
              <p className="text-zinc-500 font-plus font-bold uppercase tracking-widest text-sm">Chưa có bài viết nào
                được đăng</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
