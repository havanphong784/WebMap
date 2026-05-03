import {useCallback, useEffect, useState} from "react";
import {useNavigate, useParams} from "react-router-dom";
import {useAuthStore} from "../auth/context/authContext.jsx";
import {useLocationStore} from "../map/store/useLocationsStore.jsx";
import {apiClient} from "../../shared/api/apiClient.js";
import {motion} from "framer-motion";
import {
  ArrowIcon,
  LikeIcon,
  PhotoIcon,
  PinIcon,
  SecurityIcon,
  StarIcon
} from "../../shared/components/common/icons.jsx";
import GlassPanel from "../../shared/components/common/glassPanel.jsx";
import ActionButton from "../../shared/components/common/actionButton.jsx";
import Skeleton from "../../shared/components/common/skeleton.jsx";

export default function ProfilePage() {
  const {uid: uidParam} = useParams();
  const navigate = useNavigate();
  const {user: currentUser, logout} = useAuthStore();
  const {userLocations, fetchUserLocations, removeLocation, isLoading: locationsLoading} = useLocationStore();
  const uid = uidParam || currentUser?.uid;

  const [profileUser, setProfileUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    if (!uid) {
      navigate('/login', {replace: true});
    }
  }, [uid, navigate]);

  const fetchProfileData = useCallback(async () => {
    if (!uid) return;
    setLoading(true);
    try {
      const userData = await apiClient.get(`/auth/${uid}`);
      if (userData.success) setProfileUser(userData.user);
      await fetchUserLocations(uid, currentUser?.uid);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.uid, uid, fetchUserLocations]);

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  const handleDeleteLocation = async (e, locId) => {
    e.stopPropagation();
    if (!window.confirm('Bạn có chắc muốn xóa địa điểm này?')) return;
    setDeletingId(locId);
    try {
      await removeLocation(locId, currentUser.uid);
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };


  if (!loading && !profileUser) return (
    <div className="min-h-screen bg-map-bg flex flex-col items-center justify-center space-y-6">
      <p className="text-text-muted font-plus font-bold uppercase tracking-widest text-sm">Không tìm thấy người dùng</p>
      <ActionButton variant="glass" onClick={() => navigate('/')}>Về trang chủ</ActionButton>
    </div>
  );

  const isOwnProfile = currentUser?.uid === uid;
  const stats = [
    {label: 'Bài viết', value: profileUser?.total_posts || 0, icon: PhotoIcon},
    {label: 'Điểm', value: Number(profileUser?.total_likes_received || 0) * 10, icon: StarIcon},
    {label: 'Lượt thích', value: profileUser?.total_likes_received || 0, icon: LikeIcon, color: 'text-sunset'},
  ];

  return (
    <div className="min-h-screen bg-map-bg text-text-primary pb-32">
      <div className="relative h-64 w-full overflow-hidden">
        <motion.img
          initial={{scale: 1.2}}
          animate={{scale: 1}}
          src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200"
          className="w-full h-full object-cover grayscale-[0.3]"
          alt="cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-map-bg via-map-bg/40 to-transparent"></div>
        <div className="absolute top-6 left-6 z-50">
          <ActionButton variant="icon" onClick={() => navigate(-1)} className="rotate-180">
            <ArrowIcon size={24}/>
          </ActionButton>
        </div>
        {isOwnProfile && (
          <div className="absolute top-6 right-6 z-50">
            <ActionButton
              variant="icon"
              onClick={async () => {
                await logout();
                navigate('/login', {replace: true});
              }}
              className="!text-sunset hover:!bg-sunset/10 hover:!border-sunset/30"
              title="Đăng xuất"
            >
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
            <div className="w-36 h-36 rounded-full border-4 border-map-bg p-1 bg-cyan-glow shadow-neon">
              <img
                src={profileUser?.avatar_url || currentUser?.photoURL || "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y"}
                className="w-full h-full rounded-full object-cover"
                alt="profile"
              />
            </div>
            <div
              className="absolute bottom-1 right-1 bg-cyan-glow text-white px-3 py-1 rounded-full text-[10px] font-bold shadow-neon border-2 border-map-bg">
              EXP
            </div>
          </motion.div>

          <motion.div
            initial={{opacity: 0}}
            animate={{opacity: 1}}
            transition={{delay: 0.2}}
            className="text-center mt-6 w-full max-w-sm"
          >
            {loading ? (
              <div className="flex flex-col items-center gap-3">
                <Skeleton width="12rem" height="2.5rem"/>
                <Skeleton width="10rem" height="1rem"/>
                <Skeleton width="8rem" height="1.5rem" className="rounded-full mt-2"/>
              </div>
            ) : (
              <>
                <h1 className="text-4xl font-plus font-black tracking-tight text-text-primary">{profileUser?.name || 'Explorer'}</h1>
                <p className="text-text-secondary font-medium mt-1">{profileUser?.email}</p>
                <div
                  className="inline-block mt-3 px-4 py-1.5 rounded-full glass-panel border-cyan-glow/20 bg-cyan-glow/5 text-cyan-glow text-[10px] font-bold uppercase tracking-widest shadow-neon">
                  Elite Explorer
                </div>
              </>
            )}
          </motion.div>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-10 max-w-2xl mx-auto">
          {loading ? (
            [...Array(3)].map((_, i) => (
              <GlassPanel key={i} className="py-4 px-2 flex flex-col items-center gap-2 border-white/5 bg-white/5">
                <Skeleton circle width="1.25rem" height="1.25rem"/>
                <Skeleton width="2rem" height="1.5rem"/>
                <Skeleton width="3rem" height="0.5rem"/>
              </GlassPanel>
            ))
          ) : stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{opacity: 0, y: 20}}
              animate={{opacity: 1, y: 0}}
              transition={{delay: 0.3 + (i * 0.1)}}
            >
              <GlassPanel
                className="py-4 px-2 text-center border-glass-border bg-white/40 hover:bg-white/60 transition-colors shadow-sm">
                <stat.icon size={18} className={`${stat.color || 'text-cyan-glow'} mx-auto mb-2`}/>
                <div className="text-2xl font-plus font-black tracking-tighter text-text-primary">{stat.value}</div>
                <div className="text-[10px] uppercase tracking-widest text-text-muted font-bold">{stat.label}</div>
              </GlassPanel>
            </motion.div>
          ))}
        </div>

        <div className="mt-16 max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-8 border-b border-glass-border pb-4">
            <div className="w-1.5 h-6 bg-cyan-glow rounded-full shadow-neon"></div>
            <h2 className="text-xl font-plus font-bold uppercase tracking-tight text-text-primary">Địa điểm đã chinh phục</h2>
            <span className="ml-auto glass-panel px-3 py-1 text-[10px] font-mono text-text-muted border-glass-border">
              {userLocations.length} GHIM
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {loading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="glass-panel rounded-3xl border-white/5 overflow-hidden p-0 space-y-0 h-64">
                  <Skeleton width="100%" height="100%"/>
                </div>
              ))
            ) : userLocations.map((loc, i) => (
              <motion.div
                key={loc.id}
                initial={{opacity: 0, scale: 0.9}}
                whileInView={{opacity: 1, scale: 1}}
                viewport={{once: true}}
                transition={{delay: (i % 3) * 0.1}}
                onClick={() => navigate("/", {state: {focusLocation: loc}})}
                className="group relative glass-panel rounded-3xl border-glass-border overflow-hidden hover:border-cyan-glow/30 transition-all duration-500 cursor-pointer shadow-lg"
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

                  {isOwnProfile && (
                    <button
                      onClick={(e) => handleDeleteLocation(e, loc.id)}
                      disabled={deletingId === loc.id}
                      className="absolute top-4 left-4 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-sunset/80 hover:bg-sunset text-white p-2 rounded-xl text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm disabled:opacity-50"
                    >
                      {deletingId === loc.id ? '...' : 'Xóa'}
                    </button>
                  )}

                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="flex items-center gap-1.5 text-cyan-glow mb-1">
                      <PinIcon size={12} className="shadow-neon"/>
                      <span className="text-[10px] font-bold uppercase tracking-widest truncate">{loc.address}</span>
                    </div>
                    <h3
                      className="text-lg font-plus font-bold text-text-primary group-hover:text-cyan-glow transition-colors line-clamp-1">
                      {loc.name}
                    </h3>
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
