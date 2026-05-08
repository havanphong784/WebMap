import {useCallback, useEffect, useMemo, useState} from "react";
import {useNavigate, useParams} from "react-router-dom";
import {useAuthStore} from "../auth/context/authContext.jsx";
import {useLocationStore} from "../map/store/useLocationsStore.jsx";
import {apiClient} from "../../shared/api/apiClient.js";
import {motion} from "framer-motion";
import {ArrowIcon, LikeIcon, PhotoIcon, PinIcon, PowerIcon, StarIcon} from "../../shared/components/common/icons.jsx";
import UserBadge from "../../shared/components/UserBadge.jsx";
import GlassPanel from "../../shared/components/common/glassPanel.jsx";
import ActionButton from "../../shared/components/common/actionButton.jsx";
import Skeleton, {SkeletonTheme} from "react-loading-skeleton";
import AchievementList from "./components/AchievementList.jsx";

export default function ProfilePage() {
  const {uid: uidParam} = useParams();
  const navigate = useNavigate();
  const {user: currentUser, logout, unreadAchievements, setUnreadAchievements} = useAuthStore();
  const {userLocations, fetchUserLocations, removeLocation, isLoading: locationsLoading} = useLocationStore();
  const uid = uidParam || currentUser?.uid;

  const [profileUser, setProfileUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [dailyTasks, setDailyTasks] = useState([]);
  const [activeTab, setActiveTab] = useState('posts'); // 'posts' or 'achievements'
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);

  useEffect(() => {
    if (!uid) {
      navigate('/login', {replace: true});
    }
  }, [uid, navigate]);

  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const fetchProfileData = useCallback(async () => {
    if (!uid) return;
    setLoading(true);
    try {
      const response = await apiClient.get(`/auth/${uid}`);
      if (response.success) setProfileUser(response.user);
      await fetchUserLocations(uid, currentUser?.uid);

      const achResponse = await apiClient.get(`/achievements/${uid}`);
      if (achResponse.success) {
        setAchievements(achResponse.data.achievements);
        setDailyTasks(achResponse.data.dailyTasks);
      }

      if (currentUser?.uid && uid !== currentUser.uid) {
        const followRes = await apiClient.get(`/follows/status?followerId=${currentUser.uid}&followedId=${uid}`);
        if (followRes.success) setIsFollowing(followRes.data.isFollowing);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.uid, uid, fetchUserLocations]);

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  const handleToggleFollow = useCallback(async () => {
    if (!currentUser) return navigate('/login');
    setIsFollowLoading(true);
    try {
      const res = await apiClient.post('/follows/toggle', { follower_id: currentUser.uid, followed_id: uid });
      if (res.success) setIsFollowing(res.data.followed);
    } catch (err) {
      console.error(err);
    } finally {
      setIsFollowLoading(false);
    }
  }, [currentUser, uid, navigate]);

  const handleDeleteLocation = useCallback(async (e, locId) => {
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
  }, [removeLocation, currentUser?.uid]);

  const handleLogout = async () => {
    await logout();
    navigate('/login', {replace: true});
  };


  const stats = useMemo(() => [
    {label: 'Bài viết', value: profileUser?.total_posts || 0, icon: PhotoIcon},
    {label: 'Kinh nghiệm', value: profileUser?.xp || 0, icon: StarIcon},
    {label: 'Lượt thích', value: profileUser?.total_likes_received || 0, icon: LikeIcon, color: 'text-sunset'},
  ], [profileUser?.total_posts, profileUser?.xp, profileUser?.total_likes_received]);

  if (!loading && !profileUser) return (
    <div className="min-h-screen bg-map-bg flex flex-col items-center justify-center space-y-6">
      <p className="text-text-muted font-jakarta font-bold uppercase tracking-widest text-sm">Không tìm thấy người
        dùng</p>
      <ActionButton variant="glass" onClick={() => navigate('/')}>Về trang chủ</ActionButton>
    </div>
  );

  const isOwnProfile = currentUser?.uid === uid;

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
      </div>

      <div className="px-4 sm:px-6 -mt-16 sm:-mt-20 relative z-10">
        <div className="flex flex-col items-center">
          <motion.div
            initial={{y: 20, opacity: 0}}
            animate={{y: 0, opacity: 1}}
            className="relative"
          >
            {loading ? (
              <SkeletonTheme baseColor="rgba(255,255,255,0.05)" highlightColor="rgba(255,255,255,0.1)">
                <Skeleton circle width={144} height={144} className="border-4 border-map-bg shadow-2xl" />
              </SkeletonTheme>
            ) : (
              <UserBadge user={profileUser} size={144}/>
            )}
          </motion.div>

          <motion.div
            initial={{opacity: 0}}
            animate={{opacity: 1}}
            transition={{delay: 0.2}}
            className="text-center mt-6 w-full max-w-sm"
          >
            {loading ? (
              <SkeletonTheme baseColor="rgba(255,255,255,0.05)" highlightColor="rgba(255,255,255,0.1)">
                <div className="flex flex-col items-center gap-3">
                  <Skeleton width={180} height={36} />
                  <Skeleton width={140} height={16} />
                  <Skeleton width={100} height={20} borderRadius={20} className="mt-2" />
                </div>
              </SkeletonTheme>
            ) : (
              <>
                <h1
                  className="text-4xl font-jakarta font-black tracking-tight text-text-primary">{profileUser?.name || 'Explorer'}</h1>
                <p className="text-text-secondary font-medium mt-1">{profileUser?.email}</p>
                <div className="flex items-center justify-center gap-3 mt-4">
                  <div
                    className="px-4 py-1.5 rounded-full glass-panel border-cyan-glow/20 bg-cyan-glow/5 text-cyan-glow text-[10px] font-bold uppercase tracking-widest shadow-neon">
                    {profileUser?.tier || 'Scout'}
                  </div>
                  {isOwnProfile ? (
                    <motion.button
                      whileHover={{scale: 1.05}}
                      whileTap={{scale: 0.95}}
                      onClick={handleLogout}
                      className="px-4 py-1.5 rounded-full border border-sunset/30 bg-sunset/5 text-sunset text-[10px] font-bold uppercase tracking-widest hover:bg-sunset/10 transition-colors flex items-center gap-2"
                    >
                      <PowerIcon size={12}/>
                      Đăng xuất
                    </motion.button>
                  ) : (
                    <motion.button
                      whileHover={{scale: 1.05}}
                      whileTap={{scale: 0.95}}
                      onClick={handleToggleFollow}
                      disabled={isFollowLoading}
                      className={`px-4 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center gap-2 ${isFollowing ? 'border-text-secondary bg-white/10 text-text-primary' : 'border-cyan-glow/50 bg-cyan-glow/10 text-cyan-glow hover:bg-cyan-glow/20'}`}
                    >
                      {isFollowLoading ? '...' : isFollowing ? 'Đang theo dõi' : 'Theo dõi'}
                    </motion.button>
                  )}
                </div>
              </>
            )}
          </motion.div>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-4 mt-8 sm:mt-10 max-w-2xl mx-auto">
          {loading ? (
            <SkeletonTheme baseColor="rgba(255,255,255,0.05)" highlightColor="rgba(255,255,255,0.1)">
              {[...Array(3)].map((_, i) => (
                <GlassPanel key={i} className="py-4 px-2 flex flex-col items-center gap-2 border-white/5 bg-white/5">
                  <Skeleton circle width={20} height={20} />
                  <Skeleton width={32} height={20} />
                  <Skeleton width={48} height={8} />
                </GlassPanel>
              ))}
            </SkeletonTheme>
          ) : stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{opacity: 0, y: 20}}
              animate={{opacity: 1, y: 0}}
              transition={{delay: 0.3 + (i * 0.1)}}
            >
              <GlassPanel
                className="py-3 sm:py-4 px-1 sm:px-2 text-center border-glass-border bg-white/40 hover:bg-white/60 transition-colors shadow-sm">
                <stat.icon size={16} className={`${stat.color || 'text-cyan-glow'} mx-auto mb-1.5 sm:mb-2`}/>
                <div
                  className="text-lg sm:text-2xl font-jakarta font-black tracking-tighter text-text-primary">{stat.value}</div>
                <div
                  className="text-[8px] sm:text-[10px] uppercase tracking-widest text-text-muted font-bold">{stat.label}</div>
              </GlassPanel>
            </motion.div>
          ))}
        </div>

        <div className="mt-16 max-w-5xl mx-auto">
          <div className="flex items-center gap-8 mb-8 border-b border-glass-border">
            <button
              onClick={() => setActiveTab('posts')}
              className={`pb-4 text-xs font-jakarta font-black uppercase tracking-[0.2em] relative transition-all duration-300 ${activeTab === 'posts' ? 'text-cyan-glow' : 'text-text-muted hover:text-text-primary'}`}
            >
              Địa điểm ({userLocations.length})
              {activeTab === 'posts' && <motion.div layoutId="tabLine"
                                                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-glow shadow-neon"/>}
            </button>
            <button
              onClick={async () => {
                setActiveTab('achievements');
                if (isOwnProfile && unreadAchievements > 0) {
                  try {
                    await apiClient.post(`/achievements/mark-seen/${currentUser.uid}`);
                    setUnreadAchievements(0);
                  } catch (err) {
                    console.error("Lỗi mark seen:", err);
                  }
                }
              }}
              className={`pb-4 text-xs font-jakarta font-black uppercase tracking-[0.2em] relative transition-all duration-300 ${activeTab === 'achievements' ? 'text-sunset' : 'text-text-muted hover:text-text-primary'}`}
            >
              <div className="flex items-center gap-2">
                Thành tựu & Nhiệm vụ
                {isOwnProfile && unreadAchievements > 0 && (
                  <span className="w-1.5 h-1.5 bg-sunset rounded-full shadow-sunset animate-pulse"/>
                )}
              </div>
              {activeTab === 'achievements' && <motion.div layoutId="tabLine"
                                                           className="absolute bottom-0 left-0 right-0 h-0.5 bg-sunset shadow-sunset"/>}
            </button>
          </div>

          {activeTab === 'posts' ? (
            <>
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  <SkeletonTheme baseColor="rgba(255,255,255,0.05)" highlightColor="rgba(255,255,255,0.1)">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="glass-panel rounded-3xl border-white/5 overflow-hidden p-0 h-64">
                        <Skeleton width="100%" height="100%" />
                      </div>
                    ))}
                  </SkeletonTheme>
                </div>
              ) : userLocations.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {userLocations.map((loc, i) => (
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
                            className="absolute top-4 left-4 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-300 bg-sunset/90 sm:bg-sunset/80 hover:bg-sunset text-white p-2.5 sm:p-2 rounded-xl text-[10px] font-bold uppercase tracking-wider backdrop-blur-md sm:backdrop-blur-sm disabled:opacity-50 z-20"
                          >
                            {deletingId === loc.id ? '...' : 'Xóa'}
                          </button>
                        )}

                        <div className="absolute bottom-4 left-4 right-4">
                          <div className="flex items-center gap-1.5 text-cyan-glow mb-1">
                            <PinIcon size={12} className="shadow-neon"/>
                            <span
                              className="text-[10px] font-bold uppercase tracking-widest truncate">{loc.address}</span>
                          </div>
                          <h3
                            className="text-lg font-jakarta font-bold text-text-primary group-hover:text-cyan-glow transition-colors line-clamp-1">
                            {loc.name}
                          </h3>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 glass-panel border-white/5 bg-white/2">
                  <PhotoIcon size={48} className="text-zinc-800 mx-auto mb-4 opacity-20"/>
                  <p className="text-zinc-500 font-jakarta font-bold uppercase tracking-widest text-sm">
                    Chưa có bài viết nào được đăng
                  </p>
                </div>
              )}
            </>
          ) : (
            <AchievementList
              achievements={achievements}
              dailyTasks={dailyTasks}
              loading={loading}
            />
          )}
        </div>
      </div>
    </div>
  );
}
