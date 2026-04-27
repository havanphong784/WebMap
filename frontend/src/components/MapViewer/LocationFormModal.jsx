import {useState} from "react";
import {useAuthStore} from "../../context/AuthContext.jsx";
import {useLocationStore} from "../../context/useLocationsStore.jsx";

export default function LocationFormModal({point, onClose}) {
  const addLocation = useLocationStore(state => state.addLocation);
  const isLoading = useLocationStore(state => state.isLoading);
  const {user} = useAuthStore();

  const rawAddress = point.address || {};
  const defaultName = rawAddress.amenity || rawAddress.shop || rawAddress.tourism || rawAddress.display_name?.split(',')[0] || "";
  const defaultAddressStr = rawAddress.display_name || "";

  const [name, setName] = useState(defaultName);
  const [address, setAddress] = useState(defaultAddressStr);
  const [category, setCategory] = useState("restaurant");
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState("");

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
      image_url: null
    });


    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div
          className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex justify-between items-center text-white">
          <h3 className="font-bold text-lg">✍️ Review địa điểm mới</h3>
          <button onClick={onClose}
                  className="text-white hover:text-gray-200 text-2xl font-bold leading-none">&times;</button>
        </div>

        <form onSubmit={handleSave} className="p-6 max-h-[80vh] overflow-y-auto custom-scrollbar">

          <div className="mb-4">
            <label className="block text-sm font-bold text-gray-700 mb-1">Tên địa điểm <span
              className="text-red-500">*</span></label>
            <input
              type="text" required value={name} onChange={e => setName(e.target.value)}
              className="w-full border-gray-300 border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-bold text-gray-700 mb-1">Địa chỉ</label>
            <textarea
              required value={address} onChange={e => setAddress(e.target.value)}
              className="w-full border-gray-300 border px-3 py-2 rounded-lg text-sm text-gray-600 h-16 resize-none outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <label className="block text-sm font-bold text-gray-700 mb-1">Danh mục</label>
              <select
                value={category} onChange={e => setCategory(e.target.value)}
                className="w-full border-gray-300 border px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="restaurant">🍜 Nhà hàng / Quán ăn</option>
                <option value="cafe">☕ Quán Cafe</option>
                <option value="hotel">🏨 Khách sạn</option>
                <option value="entertainment">🎢 Vui chơi / Giải trí</option>
                <option value="other">📍 Khác</option>
              </select>
            </div>

            <div className="flex-1">
              <label className="block text-sm font-bold text-gray-700 mb-1">Đánh giá</label>
              <select
                value={rating} onChange={e => setRating(e.target.value)}
                className="w-full border-gray-300 border px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-yellow-500 font-bold"
              >
                <option value="5">⭐⭐⭐⭐⭐ (Tuyệt vời)</option>
                <option value="4">⭐⭐⭐⭐ (Tốt)</option>
                <option value="3">⭐⭐⭐ (Bình thường)</option>
                <option value="2">⭐⭐ (Tệ)</option>
                <option value="1">⭐ (Quá tệ)</option>
              </select>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-bold text-gray-700 mb-1">Bài Review của bạn</label>
            <textarea
              placeholder="Chia sẻ trải nghiệm của bạn về địa điểm này..."
              value={review} onChange={e => setReview(e.target.value)}
              className="w-full border-gray-300 border px-3 py-2 rounded-lg h-24 resize-none outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2 border-t">
            <button type="button" onClick={onClose}
                    className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-bold">
              Hủy
            </button>
            <button type="submit" disabled={isLoading}
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold">
              {isLoading ? "Đang lưu..." : "Đăng Review"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
