import {useState} from "react";
import {useAuthStore} from "../../context/AuthContext.jsx";
import {useLocationStore} from "../../context/useLocationsStore.jsx"
import {getDownloadURL, ref, uploadBytes} from "firebase/storage";
import {storage} from "../../config/firebase";


export default function LocationFormModal({point, onClose}) {
  const addLocation = useLocationStore((state) => state.addLocation);
  const isLoading = useLocationStore((state) => state.isLoading);
  const {user} = useAuthStore();

  const rawAddress = point.address || {};
  const defaultName = rawAddress.amenity || rawAddress.shop || rawAddress.tourism || rawAddress.display_name?.split(',')[0] || "";
  const [name, setName] = useState(defaultName);
  const [address] = useState(rawAddress.display_name || "");
  const [category, setCategory] = useState("other");
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) setPreviewUrl(URL.createObjectURL(file));
    setImageFile(file);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!user) return alert("Vui lòng đăng nhập!");

    setIsUploading(true);
    let finalImageUrl = null;

    try {
      if (imageFile) {
        const imageRef = ref(storage, `locations/${user.uid}/${Date.now()}_${imageFile.name}`);
        await uploadBytes(imageRef, imageFile);
        finalImageUrl = await getDownloadURL(imageRef);
      }

      await addLocation({
        user_id: user.uid,
        name,
        address,
        category,
        review_text: review,
        rating: Number(rating),
        lat: point.lat,
        lng: point.lng,
        image_url: finalImageUrl,
        is_public: isPublic
      });

      onClose();
    } catch (error) {
      console.error("Lỗi khi upload ảnh hoặc lưu data:", error);
      alert("Có lỗi xảy ra, vui lòng thử lại!");
    } finally {
      setIsUploading(false);
    }
  };


  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <div
        className="bg-zinc-900/95 backdrop-blur-xl w-full max-w-lg max-h-[90vh] rounded-2xl shadow-2xl border border-white/10 flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center shrink-0">
          <h3 className="font-bold text-lg text-white tracking-wide">✍️ Review địa điểm</h3>
          <button onClick={onClose}
                  className="text-zinc-400 hover:text-white hover:bg-white/10 p-2 rounded-full transition-all">
            ✕
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-5 overflow-y-auto custom-scrollbar">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Tên địa
                điểm</label>
              <input type="text" required value={name} onChange={(e) => setName(e.target.value)}
                     className="w-full bg-zinc-950 border border-zinc-700 text-zinc-100 px-4 py-2.5 rounded-lg outline-none focus:border-blue-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Địa chỉ</label>
              <textarea readOnly value={address}
                        className="w-full bg-zinc-950/50 text-zinc-500 border border-zinc-800 px-4 py-2.5 rounded-lg text-sm resize-none"
                        rows={2}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Danh mục</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-700 text-zinc-100 px-3 py-2.5 rounded-lg outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="other">📍 Khác</option>
                <option value="restaurant">🍜 Nhà hàng</option>
                <option value="cafe">☕ Quán Cafe</option>
                <option value="hotel">🏨 Khách sạn</option>
                <option value="entertainment">🎢 Giải trí</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Đánh giá</label>
              <select value={rating} onChange={(e) => setRating(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-700 text-amber-400 font-bold px-3 py-2.5 rounded-lg outline-none focus:border-blue-500 cursor-pointer"
              >
                {[5, 4, 3, 2, 1].map(r => <option key={r} value={r}>{"⭐".repeat(r)}</option>)}
              </select>
            </div>
          </div>

          <textarea placeholder="Chia sẻ trải nghiệm của bạn..." value={review}
                    onChange={(e) => setReview(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 text-zinc-100 px-4 py-3 rounded-lg h-24 resize-none outline-none focus:border-blue-500"
          />

          <div className="flex gap-4 p-3 bg-zinc-950 rounded-lg border border-zinc-800">
            <label className="flex items-center gap-2 cursor-pointer flex-1">
              <input type="radio" name="privacy" checked={isPublic === true} onChange={() => setIsPublic(true)}
                     className="accent-blue-500"/>
              <span className="text-sm text-zinc-300">🌍 Công khai</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer flex-1">
              <input type="radio" name="privacy" checked={isPublic === false} onChange={() => setIsPublic(false)}
                     className="accent-blue-500"/>
              <span className="text-sm text-zinc-300">🔒 Riêng tư</span>
            </label>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider">Thêm Ảnh</label>
            {previewUrl ? (
              <div className="relative group">
                <img src={previewUrl} className="w-full h-32 object-cover rounded-lg border border-zinc-700"/>
                <button type="button" onClick={() => {
                  setPreviewUrl(null);
                  setImageFile(null);
                }}
                        className="absolute top-2 right-2 bg-red-500/80 text-white p-1 rounded-full text-xs">✕
                </button>
              </div>
            ) : (
              <label
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-zinc-700 rounded-lg cursor-pointer bg-zinc-950 hover:border-zinc-500 transition-colors">
                <span className="text-xl">📸</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleImageChange}/>
              </label>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
                    className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg font-bold transition-all">Hủy
            </button>
            <button type="submit" disabled={isLoading || isUploading}
                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold transition-all shadow-[0_0_15px_rgba(37,99,235,0.3)]">
              {isLoading || isUploading ? "Đang xử lí..." : "Đăng Review"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}