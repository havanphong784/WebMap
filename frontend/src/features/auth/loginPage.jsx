import { useEffect } from "react";
import { signInWithPopup } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { auth, googleProvider } from "../../config/firebase";
import { syncUserWithBackend } from "../../shared/api/authApi.js";
import { useAuthStore } from "./context/authContext.jsx";
import { motion } from "framer-motion";
import { MapIcon, SecurityIcon, PublicIcon, PowerIcon } from "../../shared/components/common/icons.jsx";
import GlassPanel from "../../shared/components/common/glassPanel.jsx";
import ActionButton from "../../shared/components/common/actionButton.jsx";

export default function Login() {
  const navigate = useNavigate();
  const { user, loading } = useAuthStore();

  useEffect(() => {
    if (user && !loading) {
      navigate("/", { replace: true });
    }
  }, [user, loading, navigate]);

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await syncUserWithBackend(result.user);
    } catch (error) {
      console.error(error);
      alert("Đăng nhập thất bại: " + error.message);
    }
  };

  return (
    <div className="h-screen w-full flex items-center justify-center bg-map-bg overflow-hidden relative">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-glow/10 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-sunset/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="z-10 w-[90%] max-w-lg"
      >
        <GlassPanel className="p-12 flex flex-col items-center text-center border-glass-border bg-white/80 shadow-glass rounded-[40px]">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="w-20 h-20 bg-cyan-glow/20 rounded-3xl flex items-center justify-center mb-8 shadow-neon border border-cyan-glow/30"
          >
            <MapIcon size={40} className="text-cyan-glow" />
          </motion.div>

          <h1 className="text-5xl font-plus font-black tracking-tighter text-text-primary mb-3">
            AETHER <span className="text-cyan-glow shadow-neon">GEO</span>
          </h1>
          <p className="text-zinc-500 font-medium mb-12 max-w-xs uppercase tracking-[0.2em] text-[10px]">
            Hệ thống thám hiểm & Kết nối địa không gian thế hệ mới
          </p>

          <div className="w-full space-y-6 mb-12">
            <div className="flex items-center gap-4 text-left glass-panel p-4 border-glass-border bg-white/40">
              <SecurityIcon size={20} className="text-cyan-glow shrink-0" />
              <div>
                <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">Bảo mật cấp cao</h3>
                <p className="text-[10px] text-text-secondary">Xác thực Firebase an toàn tuyệt đối</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-left glass-panel p-4 border-glass-border bg-white/40">
              <PublicIcon size={20} className="text-cyan-glow shrink-0" />
              <div>
                <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">Mạng lưới toàn cầu</h3>
                <p className="text-[10px] text-text-secondary">Khám phá hàng triệu tọa độ độc bản</p>
              </div>
            </div>
          </div>

          <ActionButton
            onClick={handleGoogleLogin}
            className="w-full py-4 flex items-center justify-center gap-4 !rounded-2xl"
          >
            <img
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
              alt="Google"
              className="w-5 h-5 bg-white rounded-full p-0.5"
            />
            <span className="text-xs font-bold uppercase tracking-widest">Tiếp tục với Google</span>
          </ActionButton>

          <p className="mt-8 text-[10px] text-zinc-600 font-medium uppercase tracking-widest">
            Bằng cách tiếp tục, bạn đồng ý với <span className="text-zinc-400 cursor-pointer hover:text-cyan-glow transition-colors">Điều khoản dịch vụ</span>
          </p>
        </GlassPanel>
      </motion.div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 opacity-20">
        <PowerIcon size={14} className="text-cyan-glow" />
        <span className="text-[10px] font-bold tracking-[0.5em] text-white uppercase">Neural Grid Protocol v4.0</span>
      </div>
    </div>
  );
}

