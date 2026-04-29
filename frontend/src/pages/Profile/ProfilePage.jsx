import {useEffect, useState} from "react";
import {useNavigate, useParams} from "react-router-dom";
import {useAuthStore} from "../../context/AuthContext";

export default function ProfilePage() {
  const {uid} = useParams();
  const navigate = useNavigate();
  const {user: currentUser} = useAuthStore();
  const [profileUser, setProfileUser] = useState(null);
  const [userLocations, setUserLocations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfileData();
  }, [uid]);

  const fetchProfileData = async () => {
    setLoading(true);
    try {
      const [userRes, locRes] = await Promise.all([
        fetch(`http://localhost:3000/api/auth/${uid}`),
        fetch(`http://localhost:3000/api/locations/user/${uid}?current_user_id=${currentUser?.uid}`)
      ]);
      const userData = await userRes.json();
      const locData = await locRes.json();

      if (userData.success) setProfileUser(userData.user);
      if (locData.success) setUserLocations(locData.data);
    } catch (err) {
      console.error("Lỗi tải data:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-zinc-950 p-6 flex flex-col items-center justify-center space-y-4 animate-pulse">
      <div className="w-28 h-28 bg-zinc-900 rounded-full"/>
      <div className="h-6 w-32 bg-zinc-900 rounded"/>
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-24 selection:bg-blue-500/30">
      <div
        className="h-20 bg-zinc-950/90 backdrop-blur-xl border-b border-white/5 sticky top-0 z-40 px-6 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="bg-black/20 backdrop-blur-xl border border-white/10 p-3 rounded-full hover:bg-white/10 transition-all group"
        >
          <svg className="w-5 h-5 text-zinc-400 group-hover:text-white" fill="none" stroke="currentColor"
               viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
          </svg>
        </button>
        <h1 className="text-xl font-bold tracking-tight">Hồ Sơ</h1>
        <div className="w-11"/>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10 space-y-12">
        <div
          className="flex flex-col sm:flex-row items-center gap-8 bg-zinc-900 border border-white/5 rounded-3xl p-8 shadow-xl">
          <div className="relative group">
            <div
              className="w-28 h-28 rounded-full border-4 border-zinc-950 shadow-2xl overflow-hidden group-hover:border-blue-500 transition-colors duration-500">
              <img
                src={profileUser.avatar_url || "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQhss08c278ij8ETUWb_pKiO882Ko_kjbwerQ&s"}
                className="w-full h-full object-cover"/>
            </div>
          </div>

          <div className="flex-1 text-center sm:text-left space-y-1">
            <h1 className="text-4xl font-black tracking-tighter text-white">{profileUser.name}</h1>
            <p className="text-zinc-500 text-sm">{profileUser.email}</p>
          </div>

          <div className="flex gap-4 sm:flex-col sm:gap-2 sm:w-auto">
            <div
              className="flex-1 bg-zinc-950/50 border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center transition-all hover:border-white/10">
              <span className="text-4xl font-black text-white tracking-tighter">
                {profileUser.total_posts}
              </span>
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mt-1.5">Bài viết</span>
            </div>
            <div
              className="flex-1 bg-zinc-950/50 border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center transition-all hover:border-white/10">
              <span className="text-4xl font-black text-blue-500 tracking-tighter">
                {profileUser.total_likes_received}
              </span>
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mt-1.5">Lượt thích</span>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-3 border-b border-white/5 pb-4">
            <svg className="w-6 h-6 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
            <h2 className="text-lg font-bold">Địa điểm đã ghim </h2>
            <span className="text-xs px-2.5 py-1 bg-zinc-800 rounded-full font-mono text-zinc-400">
              {userLocations.length}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {userLocations.map(loc => (
              <div
                key={loc.id}
                onClick={() => navigate("/", {state: {focusLocation: loc}})}
                className="group bg-zinc-900 rounded-3xl border border-white/5 overflow-hidden hover:border-blue-500/50 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-blue-500/10 hover:-translate-y-1"
              >
                <div className="aspect-video relative overflow-hidden">
                  <img src={loc.image_url || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500"}
                       className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
                  <div
                    className="absolute top-4 right-4 bg-zinc-900/80 backdrop-blur-lg px-3 py-1.5 rounded-full text-xs font-semibold border border-white/10 flex items-center gap-1.5 shadow-md">
                    <svg className="w-4 h-4 text-zinc-500 group-hover:text-red-500" viewBox="0 0 24 24"
                         fill="currentColor">
                      <path
                        d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                    </svg>
                    {loc.likes_count || 0}
                  </div>
                </div>
                <div className="p-5 space-y-1.5">
                  <h3
                    className="font-bold text-sm text-white group-hover:text-blue-400 transition-colors">{loc.name}</h3>
                  <p className="text-zinc-500 text-xs line-clamp-2 leading-relaxed">{loc.address}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}