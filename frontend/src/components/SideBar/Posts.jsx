export default function LocationSidebar({location, onClose}) {
  if (!location) return null;

  return (
    <div
      className="absolute top-0 right-0 w-124 h-full bg-zinc-950/90 backdrop-blur-xl shadow-2xl border-l border-white/10 z-[100] flex flex-col transform transition-transform duration-300">

      <div className="p-4 flex justify-between items-center border-b border-white/10">
        <h2 className="font-bold text-lg text-white">Chi tiết địa điểm</h2>
        <button
          onClick={onClose}
          className="text-zinc-400 hover:text-white hover:bg-white/10 p-2 rounded-full transition-colors"
        >
          ✕
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        <img
          src={location.image_url || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500&q=80"}
          alt={location.name}
          className="w-full aspect-video object-cover rounded-xl mb-4 shadow-lg border border-white/5"
        />

        <div className="mb-4">
          <h1 className="text-2xl font-black text-white leading-tight">{location.name}</h1>
          <div className="flex items-center gap-2 mt-2">
            <span className="bg-yellow-900/50 text-yellow-400 text-sm font-bold px-2 py-1 rounded">
              ⭐ {location.rating}/5
            </span>
            <span className="text-xs text-zinc-400 bg-zinc-800 px-2 py-1 rounded-full uppercase tracking-wider">
              {location.category}
            </span>
          </div>
        </div>

        <div className="flex gap-2 text-zinc-300 text-sm mb-6 bg-blue-900/20 p-3 rounded-lg border border-blue-900/30">
          <span>📍</span>
          <p>{location.address}</p>
        </div>

        <div className="mb-8">
          <h3 className="font-bold text-zinc-100 mb-2 border-b border-white/10 pb-1">Bài Review</h3>
          <p className="text-zinc-400 leading-relaxed text-sm">
            {location.review_text || "Người dùng chưa để lại bài đánh giá nào."}
          </p>
        </div>

        <div className="border-t border-white/10 pt-4">
          <h3 className="font-bold text-zinc-100 mb-3">💬 Bình luận</h3>
          <div
            className="bg-zinc-900 text-zinc-500 p-4 rounded-lg text-center text-sm border border-dashed border-zinc-700">
            Tính năng bình luận sẽ sớm ra mắt...
          </div>
        </div>
      </div>
    </div>
  );
}