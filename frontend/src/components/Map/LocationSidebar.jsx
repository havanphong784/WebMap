import { useEffect, useState } from "react";
import { useLocationStore } from "../../store/useLocationsStore.jsx";
import { useAuthStore } from "../../context/AuthContext.jsx";

export default function LocationSidebar({ location: initialLocation, onClose }) {
  const { locations, fetchRoute, routeLoading, clearRoute, setRouteLoading, toggleLike, postComment } = useLocationStore();
  const { user } = useAuthStore();

  const location = locations.find(l => l.id === initialLocation?.id) || initialLocation;

  const [comments, setComments] = useState([]);
  const [commentLoading, setCommentLoading] = useState(false);

  useEffect(() => {
    if (location?.id) {
      loadComments();
    }
  }, [location?.id]);

  const loadComments = async () => {
    setCommentLoading(true);
    try {
      const response = await fetch(`http://localhost:3000/api/comments/${location.id}/comments`);
      const result = await response.json();
      if (result.success) setComments(result.data);
    } catch (err) {
      console.error("Lỗi tải bình luận:", err);
    } finally {
      setCommentLoading(false);
    }
  };

  const handleSendComment = async (e) => {
    if (e.key === 'Enter' && e.target.value.trim()) {
      const content = e.target.value;
      e.target.value = '';
      const result = await postComment(location.id, user.uid, content);
      if (result.success) {
        loadComments();
      }
    }
  };

  if (!location) return null;

  const handleDirections = () => {
    if (routeLoading) return;
    clearRoute();
    setRouteLoading(true);
    if (!navigator.geolocation) {
      setRouteLoading(false);
      alert("Trình duyệt không hỗ trợ định vị.");
      return;
    }
    navigator.geolocation.getCurrentPosition((pos) => {
      const start = [pos.coords.longitude, pos.coords.latitude];
      const end = [location.lng, location.lat];
      fetchRoute(start, end);
    }, () => {
      setRouteLoading(false);
      alert("Vui lòng cho phép truy cập vị trí.");
    });
  };

  return (
    <div className="absolute top-0 right-0 w-96 h-full bg-zinc-950/90 backdrop-blur-xl shadow-2xl border-l border-white/10 z-[100] flex flex-col animate-in slide-in-from-right duration-300">
      <div className="p-4 flex justify-between items-center border-b border-white/10">
        <h2 className="font-bold text-lg text-white">Chi tiết địa điểm</h2>
        <button onClick={onClose} className="text-zinc-400 hover:text-white p-2">✕</button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        <img src={location.image_url || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500"} className="w-full aspect-video object-cover rounded-xl mb-4 shadow-lg border border-white/10" />
        <h1 className="text-2xl font-black text-white">{location.name}</h1>
        
        <div className="flex items-center gap-4 my-4">
          <button 
            onClick={() => toggleLike(location.id, user.uid)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border transition ${location.is_liked ? 'bg-red-500/20 border-red-500 text-red-500' : 'border-white/10 text-zinc-400'}`}
          >
            <span>{location.is_liked ? '❤️' : '🤍'}</span>
            <span className="font-bold">{location.likes_count || 0}</span>
          </button>
          <button onClick={handleDirections} disabled={routeLoading} className="bg-blue-600 text-white px-4 py-2 rounded-full font-bold text-sm shadow-lg shadow-blue-900/20">
            {routeLoading ? "..." : "🚗 Chỉ đường"}
          </button>
        </div>

        <div className="flex gap-4 text-xs text-zinc-500 mb-6 px-1">
          <span>📅 {new Date(location.created_at).toLocaleDateString()}</span>
          <span>💬 {location.comments_count || 0} bình luận</span>
        </div>

        <p className="text-zinc-400 text-sm mb-8 leading-relaxed">{location.review_text}</p>

        <div className="border-t border-white/10 pt-6">
          <h3 className="text-white font-bold mb-4">💬 Bình luận</h3>
          
          <div className="flex gap-2 mb-6">
            <img src={user?.photoURL} className="w-8 h-8 rounded-full border border-white/20" />
            <input 
              type="text" placeholder="Viết bình luận..." 
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
              onKeyDown={handleSendComment}
            />
          </div>

          <div className="space-y-4">
            {commentLoading ? <p className="text-zinc-500 text-xs text-center py-4">Đang tải...</p> : 
              comments.length > 0 ? comments.map(c => (
                <div key={c.id} className="flex gap-3">
                  <img src={c.avatar_url || "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y"} className="w-8 h-8 rounded-full" />
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <p className="text-xs font-bold text-zinc-300">{c.name}</p>
                      <p className="text-[10px] text-zinc-600">{new Date(c.created_at).toLocaleDateString()}</p>
                    </div>
                    <p className="text-sm text-zinc-400 mt-0.5">{c.content}</p>
                  </div>
                </div>
              )) : <p className="text-zinc-600 text-xs text-center py-4">Chưa có bình luận nào.</p>
            }
          </div>
        </div>
      </div>
    </div>
  );
}
