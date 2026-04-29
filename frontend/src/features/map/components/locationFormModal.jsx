import {useState} from "react";
import { useAuthStore } from "../../auth/context/authContext.jsx";
import { useLocationStore } from "../store/useLocationsStore.jsx";
import {getDownloadURL, ref, uploadBytes} from "firebase/storage";
import { storage } from "../../../config/firebase.js";
import {
  CafeIcon,
  CloseIcon,
  EventIcon,
  FoodIcon,
  HotelIcon,
  PhotoIcon,
  PinIcon,
  PrivateIcon,
  PublicIcon,
  SendIcon,
  SpinnerIcon,
  StarIcon
} from "../../../shared/components/common/icons.jsx";
import GlassPanel from "../../../shared/components/common/glassPanel.jsx";
import ActionButton from "../../../shared/components/common/actionButton.jsx";
import {motion} from "framer-motion";

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

  const categories = [
    {value: "restaurant", label: "Nhà hàng", icon: FoodIcon},
    {value: "cafe", label: "Quán Cafe", icon: CafeIcon},
    {value: "hotel", label: "Khách sạn", icon: HotelIcon},
    {value: "entertainment", label: "Giải trí", icon: EventIcon},
    {value: "other", label: "Khác", icon: PinIcon},
  ];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[2000] flex items-center justify-center p-4">
      <motion.div
        initial={{opacity: 0, scale: 0.9, y: 20}}
        animate={{opacity: 1, scale: 1, y: 0}}
        className="w-full max-w-lg h-full max-h-[85vh] overflow-hidden flex flex-col"
      >
        <GlassPanel
          className="w-full h-full flex flex-col border-white/10 bg-obsidian/90 shadow-2xl overflow-hidden p-0 rounded-3xl">
          <div
            className="px-8 py-5 border-b border-white/5 flex justify-between items-center shrink-0 bg-obsidian/50 backdrop-blur-3xl z-10">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-cyan-glow/10 text-cyan-glow">
                <PinIcon size={20}/>
              </div>
              <h3 className="font-plus font-bold text-lg text-white uppercase tracking-wider">Đánh giá địa điểm</h3>
            </div>
            <button
              onClick={onClose}
              className="text-zinc-500 hover:text-white p-2 glass-panel !rounded-full border-white/5 transition-all"
            >
              <CloseIcon size={20}/>
            </button>
          </div>

          <form onSubmit={handleSave} className="flex-1 overflow-y-auto no-scrollbar p-8 space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-2">Tên địa
                  điểm</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white/5 border border-white/5 text-white px-5 py-3.5 rounded-xl outline-none focus:border-cyan-glow/30 transition-all font-medium"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-2">Địa
                  chỉ</label>
                <div
                  className="w-full bg-white/5 border border-white/5 text-zinc-400 px-5 py-3.5 rounded-xl text-xs leading-relaxed italic">
                  {address}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-2">Danh
                  mục</label>
                <div className="relative">
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-white/5 border border-white/5 text-white px-4 py-3.5 rounded-xl outline-none focus:border-cyan-glow/30 cursor-pointer font-medium appearance-none"
                  >
                    {categories.map(cat => (
                      <option key={cat.value} value={cat.value} className="bg-obsidian">{cat.label}</option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">
                    <PinIcon size={14}/>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-2">Xếp
                  hạng</label>
                <div
                  className="flex items-center justify-center gap-2 bg-white/5 border border-white/5 px-4 py-3.5 rounded-xl">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className={`transition-all duration-300 ${star <= rating ? 'text-amber-400 scale-110' : 'text-white/10 hover:text-white/30'}`}
                    >
                      <StarIcon size={18} fill={star <= rating ? "currentColor" : "none"}/>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-2">Cảm
                nhận</label>
              <textarea
                placeholder="Nơi này có gì đặc biệt..."
                value={review}
                onChange={(e) => setReview(e.target.value)}
                className="w-full bg-white/5 border border-white/5 text-white px-5 py-4 rounded-xl h-32 resize-none outline-none focus:border-cyan-glow/30 transition-all font-medium custom-scrollbar"
              />
            </div>

            <div className="flex gap-4 p-1.5 bg-white/5 rounded-2xl border border-white/5">
              <button
                type="button"
                onClick={() => setIsPublic(true)}
                className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl transition-all duration-500 ${isPublic ? 'bg-cyan-glow/10 text-cyan-glow shadow-neon' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                <PublicIcon size={16}/>
                <span className="text-xs font-bold uppercase tracking-wider">Công khai</span>
              </button>
              <button
                type="button"
                onClick={() => setIsPublic(false)}
                className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl transition-all duration-500 ${!isPublic ? 'bg-zinc-500/10 text-zinc-300' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                <PrivateIcon size={16}/>
                <span className="text-xs font-bold uppercase tracking-wider">Riêng tư</span>
              </button>
            </div>

            <div className="space-y-3">
              <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">Hình ảnh</label>
              {previewUrl ? (
                <div className="relative group overflow-hidden rounded-2xl border border-white/10 shadow-2xl">
                  <img src={previewUrl} className="w-full h-48 object-cover" alt="preview"/>
                  <div
                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewUrl(null);
                        setImageFile(null);
                      }}
                      className="bg-red-500 text-white p-3 rounded-full shadow-lg hover:scale-110 transition-transform"
                    >
                      <CloseIcon size={20}/>
                    </button>
                  </div>
                </div>
              ) : (
                <label
                  className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-white/5 rounded-2xl cursor-pointer bg-white/2 hover:bg-white/5 hover:border-cyan-glow/30 transition-all group">
                  <div className="p-5 rounded-full bg-white/5 group-hover:scale-110 transition-transform mb-3">
                    <PhotoIcon size={24} className="text-zinc-500 group-hover:text-cyan-glow transition-colors"/>
                  </div>
                  <span
                    className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">Chọn ảnh từ thiết bị</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageChange}/>
                </label>
              )}
            </div>

            <div className="flex gap-4 pt-4 pb-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-4 glass-panel border-white/5 bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 transition-all font-bold uppercase tracking-widest text-xs rounded-xl"
              >
                Hủy
              </button>
              <ActionButton
                type="submit"
                disabled={isLoading || isUploading}
                className="flex-1 !py-4 gap-2 rounded-xl"
              >
                {isLoading || isUploading ? (
                  <SpinnerIcon size={18} className="animate-spin"/>
                ) : <SendIcon size={18}/>}
                <span className="uppercase tracking-widest text-xs">Đăng Review</span>
              </ActionButton>
            </div>
          </form>
        </GlassPanel>
      </motion.div>
    </div>
  );
}
