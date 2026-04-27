import {useState} from "react";
import {useAuthStore} from "../../context/AuthContext.jsx";
import {useLocationStore} from "../../context/useLocationsStore.jsx";

export default function LocationFormModal({point, onClose}) {
  const addLocation = useLocationStore((state) => state.addLocation);
  const isLoading = useLocationStore((state) => state.isLoading);
  const {user} = useAuthStore();

  const rawAddress = point.address || {};
  const defaultName = rawAddress.amenity || rawAddress.shop || rawAddress.tourism || rawAddress.display_name?.split(',')[0] || "";
  const defaultAddressStr = rawAddress.display_name || "";

  const [name, setName] = useState(defaultName);
  const [address] = useState(defaultAddressStr);
  const [category, setCategory] = useState("other");
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState("");
  const [isPublic, setIsPublic] = useState(true);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!user) return alert("Vui lòng đăng nhập!");

    await addLocation({
      user_id: user.uid,
      name,
      address,
      category,
      review_text: review,
      rating: Number(rating),
      lat: point.lat,
      lng: point.lng,
      image_url: null,
      is_public: isPublic,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-[2px] z-[200] flex items-center justify-center p-4">
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div
          className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 text-white flex justify-between items-center">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <span>✍️</span> Đánh giá địa điểm
          </h3>
          <button
            onClick={onClose}
            className="hover:bg-white/20 p-1 rounded-full transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-5">

          {/* Tên địa điểm */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Tên địa
              điểm</label>
            <input
              type="text" required value={name} onChange={(e) => setName(e.target.value)}
              className="w-full bg-gray-50 border-gray-200 border px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
            />
          </div>

          {/* Địa chỉ (Readonly) */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Địa chỉ</label>
            <textarea
              readOnly
              value={address}
              className="w-full bg-gray-100 text-gray-500 border-gray-200 border px-4 py-2.5 rounded-xl text-sm cursor-not-allowed resize-none outline-none"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Danh mục */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Danh mục</label>
              <select
                value={category} onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-white border-gray-200 border px-3 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              >
                <option value="other">📍 Khác</option>
                <option value="restaurant">🍜 Nhà hàng</option>
                <option value="cafe">☕ Quán Cafe</option>
                <option value="hotel">🏨 Khách sạn</option>
                <option value="entertainment">🎢 Giải trí</option>
              </select>
            </div>

            {/* Đánh giá */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Đánh giá</label>
              <select
                value={rating} onChange={(e) => setRating(e.target.value)}
                className="w-full bg-white border-gray-200 border px-3 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-amber-600 font-bold transition-all"
              >
                <option value="5">⭐⭐⭐⭐⭐</option>
                <option value="4">⭐⭐⭐⭐</option>
                <option value="3">⭐⭐⭐</option>
                <option value="2">⭐⭐</option>
                <option value="1">⭐</option>
              </select>
            </div>
          </div>

          {/* Nội dung Review */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Nội dung đánh
              giá</label>
            <textarea
              placeholder="Bạn cảm thấy thế nào về nơi này?"
              value={review} onChange={(e) => setReview(e.target.value)}
              className="w-full border-gray-200 border px-4 py-3 rounded-xl h-24 resize-none outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          {/* Quyền riêng tư */}
          <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
            <label className="block text-xs font-bold text-blue-800 mb-2 uppercase">Quyền riêng tư</label>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="radio"
                  name="privacy"
                  checked={isPublic === true}
                  onChange={() => setIsPublic(true)}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm text-gray-700 group-hover:text-blue-700">Công khai</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="radio"
                  name="privacy"
                  checked={isPublic === false}
                  onChange={() => setIsPublic(false)}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm text-gray-700 group-hover:text-blue-700">Riêng tư</span>
              </label>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
                    className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-all">
              Hủy
            </button>
            <button type="submit" disabled={isLoading}
                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/30 transition-all active:scale-95">
              {isLoading ? "Đang lưu..." : "Đăng Review"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}