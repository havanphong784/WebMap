import {useEffect, useState} from "react";
import {useAuthStore} from "../../auth/context/authStore.js";
import {useLocationStore} from "../store/useLocationsStore.jsx";
import {getDownloadURL, ref, uploadBytesResumable} from "firebase/storage";
import {storage} from "../../../config/firebase.js";
import {getAddress} from "../utils/geocoding.js";
import {compressImage} from "../../../shared/utils/imageUtils.js";
import {
  CafeIcon,
  CloseIcon,
  EventIcon,
  FoodIcon,
  HashIcon,
  HotelIcon,
  PhotoIcon,
  PinIcon,
  PrivateIcon,
  PublicIcon,
  SendIcon,
  SpinnerIcon,
  StarIcon,
  TagIcon
} from "../../../shared/components/common/icons.jsx";
import GlassPanel from "../../../shared/components/common/glassPanel.jsx";
import ActionButton from "../../../shared/components/common/actionButton.jsx";
import {AnimatePresence, motion} from "framer-motion";
import { useToastStore } from "../../../shared/components/toast/useToastStore.jsx";

const SUGGESTED_TAGS = [
  "view đẹp", "cà phê", "ăn ngon", "check-in", "yên tĩnh",
  "giá rẻ", "ban đêm", "gia đình", "hẹn hò", "phong cảnh",
  "đồ uống", "wifi", "ngoài trời", "lịch sử", "mua sắm"
];

export default function LocationFormModal({point, onClose, onSaved}) {
  const addLocation = useLocationStore((state) => state.addLocation);
  const isLoading = useLocationStore((state) => state.isLoading);
  const {user} = useAuthStore();
  const addToast = useToastStore(state => state.addToast);

  const isAddressObject = typeof point.address === 'object' && point.address !== null;
  const rawAddress = isAddressObject ? point.address : {};
  
  const defaultName = point.name || 
                     rawAddress.amenity || 
                     rawAddress.shop || 
                     rawAddress.tourism || 
                     (typeof point.address === 'string' ? point.address.split(',')[0] : rawAddress.display_name?.split(',')[0]) || 
                     "";

  const [name, setName] = useState(defaultName);
  const [address, setAddress] = useState(typeof point.address === 'string' ? point.address : rawAddress.display_name || "");
  const [category, setCategory] = useState(point.category || "other");
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [compressedFile, setCompressedFile] = useState(null);

  useEffect(() => {
    let objectUrl = null;

    const processImage = async () => {
      if (point.imageFile) {
        setImageFile(point.imageFile);
        objectUrl = URL.createObjectURL(point.imageFile);
        setPreviewUrl(objectUrl);
        
        // Start background compression immediately
        setIsCompressing(true);
        const result = await compressImage(point.imageFile);
        setCompressedFile(result);
        setIsCompressing(false);
      }
    };
    processImage();

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [point.imageFile]);

  useEffect(() => {
    const updateAddress = async () => {
      if (typeof point.address === 'string') {
        setAddress(point.address);
        setName(prev => prev || point.name || point.address.split(',')[0]);
        return;
      }

      if (point.address?.display_name) {
        setAddress(point.address.display_name);
        const newDefaultName = point.address.amenity || point.address.shop || point.address.tourism || point.address.display_name?.split(',')[0] || "";
        setName(prev => prev || newDefaultName);
      } else if (point.lat && point.lng) {
        const fetchedAddress = await getAddress(point.lat, point.lng);
        if (fetchedAddress?.display_name) {
          setAddress(fetchedAddress.display_name);
          const newDefaultName = fetchedAddress.amenity || fetchedAddress.shop || fetchedAddress.tourism || fetchedAddress.display_name?.split(',')[0] || "";
          setName(prev => prev || newDefaultName);
        }
      }
    };
    updateAddress();
  }, [point.address, point.lat, point.lng, point.name]);

  const [tags, setTags] = useState(point.tags || []);
  const [tagInput, setTagInput] = useState("");

  const handleAddTag = (tagValue) => {
    const cleaned = tagValue.trim().toLowerCase().replace(/^#+/, "");
    if (!cleaned || tags.includes(cleaned) || tags.length >= 8) return;
    setTags(prev => [...prev, cleaned]);
    setTagInput("");
  };

  const handleTagInputKeyDown = (e) => {
    if ((e.key === "Enter" || e.key === ",") && tagInput.trim()) {
      e.preventDefault();
      handleAddTag(tagInput);
    }
    if (e.key === "Backspace" && !tagInput && tags.length > 0) {
      setTags(prev => prev.slice(0, -1));
    }
  };

  const removeTag = (tagToRemove) => {
    setTags(prev => prev.filter(t => t !== tagToRemove));
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      addToast("Vui lòng chọn tệp hình ảnh!", "error");
      e.target.value = "";
      return;
    }

    setPreviewUrl(URL.createObjectURL(file));
    setImageFile(file);
    
    // Background compression for manually selected image
    setIsCompressing(true);
    const result = await compressImage(file);
    setCompressedFile(result);
    setIsCompressing(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!user) return addToast("Vui lòng đăng nhập!", "error");

    setIsUploading(true);
    setUploadProgress(0);
    let finalImageUrl = null;

    try {
      if (imageFile) {
        let fileToUpload = compressedFile;
        
        // If compression isn't done yet, wait for it or just compress now
        if (!fileToUpload) {
          setIsCompressing(true);
          fileToUpload = await compressImage(imageFile);
          setCompressedFile(fileToUpload);
          setIsCompressing(false);
        }
        
        const imageRef = ref(storage, `locations/${user.uid}/${Date.now()}.webp`);
        const metadata = {
          contentType: 'image/webp',
          cacheControl: 'public,max-age=31536000',
        };

        const uploadTask = uploadBytesResumable(imageRef, fileToUpload, metadata);

        await new Promise((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              setUploadProgress(Math.round(progress));
            },
            (error) => {
              console.error("Upload error:", error);
              reject(error);
            },
            async () => {
              finalImageUrl = await getDownloadURL(uploadTask.snapshot.ref);
              resolve();
            }
          );
        });
      }

      const result = await addLocation({
        name,
        address,
        category,
        review_text: review,
        rating: Number(rating),
        lat: point.lat,
        lng: point.lng,
        image_url: finalImageUrl,
        is_public: isPublic,
        tags
      });

      if (result?.success) {
        addToast("Đã đăng địa điểm mới", "success");
        onSaved?.(result.data);
        onClose();
      } else {
        addToast(result?.message || "Không thể lưu địa điểm, vui lòng thử lại!", "error");
      }
    } catch (error) {
      console.error("Lỗi khi upload ảnh hoặc lưu data:", error);
      addToast("Có lỗi xảy ra, vui lòng thử lại!", "error");
    } finally {
      setIsUploading(false);
      setIsCompressing(false);
      setUploadProgress(0);
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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{opacity: 0, scale: 0.9, y: 20}}
        animate={{opacity: 1, scale: 1, y: 0}}
        className="w-full max-w-lg h-full max-h-[90vh] overflow-hidden flex flex-col"
      >
        <GlassPanel
          className="w-full h-full flex flex-col border-glass-border bg-glass-obsidian shadow-glass overflow-hidden p-0 rounded-3xl">
          <div
            className="px-8 py-5 border-b border-glass-border flex justify-between items-center shrink-0 z-10">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-cyan-glow/10 text-cyan-glow">
                <PinIcon size={20}/>
              </div>
              <h3
                className="font-jakarta font-bold text-lg text-text-primary uppercase tracking-wider">Đánh
                giá địa điểm</h3>
            </div>
            <button
              onClick={onClose}
              className="text-text-muted hover:text-text-primary p-2 glass-panel !rounded-full border-glass-border transition-all"
            >
              <CloseIcon size={20}/>
            </button>
          </div>

          <form onSubmit={handleSave} className="flex-1 overflow-y-auto no-scrollbar p-8 space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] mb-2">Tên địa
                  điểm</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-glass-white border border-glass-border text-text-primary px-5 py-3.5 rounded-xl outline-none focus:border-cyan-glow/30 transition-all font-medium"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-2">Địa
                  chỉ</label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-glass-white border border-glass-border text-text-secondary px-5 py-3.5 rounded-xl text-xs leading-relaxed italic outline-none focus:border-cyan-glow/30 transition-all resize-none h-20 custom-scrollbar"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] mb-2">Danh
                  mục</label>
                <div className="relative">
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-glass-white border border-glass-border text-text-primary px-4 py-3.5 rounded-xl outline-none focus:border-cyan-glow/30 cursor-pointer font-medium appearance-none"
                  >
                    {categories.map(cat => (
                      <option key={cat.value} value={cat.value} className="bg-obsidian">{cat.label}</option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted">
                    <PinIcon size={14}/>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] mb-2">Xếp
                  hạng</label>
                <div
                  className="flex items-center justify-center gap-2 bg-glass-white border border-glass-border px-4 py-3.5 rounded-xl">
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
              <label className="block text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] mb-2">Cảm
                nhận</label>
              <textarea
                placeholder="Nơi này có gì đặc biệt..."
                value={review}
                onChange={(e) => setReview(e.target.value)}
                className="w-full bg-glass-white border border-glass-border text-text-primary px-5 py-4 rounded-xl h-32 resize-none outline-none focus:border-cyan-glow/30 transition-all font-medium custom-scrollbar"
              />
            </div>

            <div className="space-y-3">
              <label
                className="flex items-center gap-2 text-[10px] font-bold text-text-muted uppercase tracking-[0.2em]">
                <TagIcon size={12} className="text-cyan-glow"/>
                Tags ({tags.length}/8)
              </label>

              <div
                className="min-h-[52px] flex flex-wrap gap-2 items-center bg-glass-white border border-glass-border rounded-xl px-4 py-3 focus-within:border-cyan-glow/30 transition-all">
                <AnimatePresence>
                  {tags.map(tag => (
                    <motion.span
                      key={tag}
                      initial={{opacity: 0, scale: 0.7}}
                      animate={{opacity: 1, scale: 1}}
                      exit={{opacity: 0, scale: 0.7}}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-glow/10 border border-cyan-glow/25 text-cyan-glow text-[11px] font-bold"
                    >
                      <HashIcon size={9}/>
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-0.5 text-cyan-glow/50 hover:text-cyan-glow transition-colors"
                      >
                        <CloseIcon size={10}/>
                      </button>
                    </motion.span>
                  ))}
                </AnimatePresence>
                {tags.length < 8 && (
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagInputKeyDown}
                    onBlur={() => tagInput.trim() && handleAddTag(tagInput)}
                    placeholder={tags.length === 0 ? "Nhập tag, Enter để thêm..." : ""}
                    className="flex-1 min-w-[120px] bg-transparent outline-none text-[12px] text-text-primary placeholder-text-dim font-medium"
                  />
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {SUGGESTED_TAGS.filter(s => !tags.includes(s)).slice(0, 8).map(suggestion => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => handleAddTag(suggestion)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/[0.03] border border-glass-border text-text-muted hover:bg-cyan-glow/5 hover:border-cyan-glow/20 hover:text-cyan-glow transition-all text-[10px] font-bold"
                  >
                    <HashIcon size={8}/>
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-4 p-1.5 bg-glass-white rounded-2xl border border-glass-border">
              <button
                type="button"
                onClick={() => setIsPublic(true)}
                className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl transition-all duration-500 ${isPublic ? 'bg-cyan-glow/10 text-cyan-glow shadow-neon' : 'text-text-muted hover:text-text-secondary'}`}
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
              <label className="block text-[10px] font-bold text-text-muted uppercase tracking-[0.2em]">Hình ảnh</label>
              {previewUrl ? (
                <div className="relative group overflow-hidden rounded-2xl border border-white/10 shadow-2xl">
                  <img src={previewUrl} className="w-full h-48 object-cover" alt="preview"/>
                  <div
                    className="absolute inset-0 bg-black/20 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewUrl(prev => {
                        if (prev && prev.startsWith('blob:')) URL.revokeObjectURL(prev);
                        return null;
                      });
                      setImageFile(null);
                    }}
                    className="absolute top-3 right-3 z-10 bg-sunset text-white p-2.5 rounded-full shadow-neon-sm hover:scale-110 active:scale-90 transition-all sm:opacity-0 sm:group-hover:opacity-100 opacity-100"
                  >
                    <CloseIcon size={18}/>
                  </button>
                </div>
              ) : (
                <label
                  className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-glass-border rounded-2xl cursor-pointer bg-glass-white hover:bg-white/5 hover:border-cyan-glow/30 transition-all group">
                  <div className="p-5 rounded-full bg-glass-white group-hover:scale-110 transition-transform mb-3">
                    <PhotoIcon size={24} className="text-text-muted group-hover:text-cyan-glow transition-colors"/>
                  </div>
                  <span
                    className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em]">Chọn ảnh từ thiết bị (hoặc chọn "Tệp" để giữ tọa độ)</span>
                  <input type="file" accept="*" className="hidden" onChange={handleImageChange}/>
                </label>
              )}
            </div>

            <div className="flex gap-4 pt-4 pb-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-4 glass-panel border-glass-border bg-glass-white text-text-secondary hover:text-text-primary hover:bg-white/10 transition-all font-bold uppercase tracking-widest text-xs rounded-xl"
              >
                Hủy
              </button>
              <ActionButton
                type="submit"
                disabled={isLoading || isUploading}
                className="flex-1 !py-4 gap-2 rounded-xl relative overflow-hidden group"
              >
                {isUploading && !isCompressing && (
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${uploadProgress}%` }}
                    transition={{ type: "spring", bounce: 0, duration: 0.3 }}
                    className="absolute inset-0 bg-white/20 pointer-events-none"
                  />
                )}
                
                {isLoading || isUploading ? (
                  <div className="flex items-center gap-2 z-10">
                    <SpinnerIcon size={18} className="animate-spin text-white"/>
                    <span className="uppercase tracking-widest text-[10px] font-black">
                      {isCompressing ? 'Đang nén ảnh...' : isUploading ? `Đang tải... ${uploadProgress}%` : 'Đang lưu...'}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 z-10">
                    <SendIcon size={18}/>
                    <span className="uppercase tracking-widest text-xs">Đăng Review</span>
                  </div>
                )}
              </ActionButton>
            </div>
          </form>
        </GlassPanel>
      </motion.div>
    </div>
  );
}
