import {useEffect, useState} from "react";
import {signInWithPopup} from "firebase/auth";
import {useLocation, useNavigate} from "react-router-dom";
import {auth, googleProvider} from "../../config/firebase";
import {useAuthStore} from "./context/authContext.jsx";
import {AnimatePresence, motion} from "framer-motion";
import {EyeIcon, EyeOffIcon, MapIcon, PowerIcon, PrivateIcon, UserIcon} from "../../shared/components/common/icons.jsx";
import GlassPanel from "../../shared/components/common/glassPanel.jsx";
import ActionButton from "../../shared/components/common/actionButton.jsx";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const {user, loading, loginWithEmail, registerWithEmail, resetPassword} = useAuthStore();

  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [authStatus, setAuthStatus] = useState({type: '', message: ''});

  useEffect(() => {
    if (user && !loading) {
      const from = location.state?.from || "/";
      const pathname = from?.pathname ?? '/';
      const search = from?.search ?? '';
      const hash = from?.hash ?? '';
      const candidate = `${pathname}${search}${hash}`;
      const safePath = candidate.startsWith('/') ? candidate : '/';

      navigate(safePath, {replace: true});
    }
  }, [user, loading, navigate]);

  const handleGoogleLogin = async () => {
    setAuthStatus({type: '', message: ''});
    try {
      const result = await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error(error);
      setAuthStatus({type: 'error', message: "Đăng nhập Google thất bại: " + error.code});
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    setAuthStatus({type: '', message: ''});
    setIsAuthLoading(true);
    try {
      let result;
      if (isRegister) {
        if (!name) {
          setAuthStatus({type: 'error', message: "Vui lòng nhập họ tên"});
          setIsAuthLoading(false);
          return;
        }
        result = await registerWithEmail(email, password, name);
      } else {
        result = await loginWithEmail(email, password);
      }
    } catch (error) {
      console.error(error);
      let msg = "Xác thực thất bại";
      if (error.code === 'auth/user-not-found') msg = "Email không tồn tại";
      if (error.code === 'auth/wrong-password') msg = "Mật khẩu không chính xác";
      if (error.code === 'auth/email-already-in-use') msg = "Email này đã được đăng ký";
      setAuthStatus({type: 'error', message: msg});
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      setAuthStatus({type: 'error', message: "Vui lòng nhập email trước để nhận link."});
      return;
    }
    setAuthStatus({type: '', message: ''});
    try {
      await resetPassword(email);
      setAuthStatus({type: 'success', message: "Link đặt lại mật khẩu đã được gửi vào email."});
    } catch (error) {
      console.error(error);
      setAuthStatus({type: 'error', message: "Lỗi gửi mail: " + error.code});
    }
  };

  return (
    <div className="h-screen w-full flex items-center justify-center bg-map-bg overflow-hidden relative">
      <div
        className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-glow/10 rounded-full blur-[120px] animate-pulse"></div>
      <div
        className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-sunset/10 rounded-full blur-[120px] animate-pulse"
        style={{animationDelay: '2s'}}></div>
      <motion.div
        initial={{opacity: 0, y: 20}}
        animate={{opacity: 1, y: 0}}
        className="z-10 w-[95%] max-w-lg"
      >
        <GlassPanel
          className="p-8 sm:p-12 flex flex-col items-center text-center border-glass-border bg-white/80 shadow-glass rounded-[40px]">
          <motion.div
            initial={{scale: 0.8}}
            animate={{scale: 1}}
            className="w-16 h-16 bg-cyan-glow/20 rounded-2xl flex items-center justify-center mb-6 shadow-neon border border-cyan-glow/30"
          >
            <MapIcon size={32} className="text-cyan-glow"/>
          </motion.div>

          <h1 className="text-4xl font-jakarta font-black tracking-tighter text-text-primary mb-2">
            AETHER <span className="text-cyan-glow shadow-neon">GEO</span>
          </h1>
          <p className="text-zinc-500 font-medium mb-8 uppercase tracking-[0.2em] text-[9px]">
            Hệ thống thám hiểm & Kết nối địa không gian
          </p>

          <form onSubmit={handleEmailAuth} className="w-full space-y-4 mb-8">
            <AnimatePresence>
              {isRegister && (
                <motion.div
                  initial={{opacity: 0, height: 0, marginBottom: 0}}
                  animate={{opacity: 1, height: 'auto', marginBottom: 16}}
                  exit={{opacity: 0, height: 0, marginBottom: 0}}
                  className="w-full text-left overflow-hidden"
                >
                  <label className="text-[9px] font-bold text-text-muted uppercase tracking-[0.2em] ml-4 mb-2 block">Họ
                    và tên</label>
                  <div className="relative group">
                    <UserIcon size={18}
                              className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-cyan-glow transition-colors"/>
                    <input
                      type="text"
                      placeholder="Nhập tên của bạn..."
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full text-text-muted pl-12 pr-4 py-3.5 rounded-2xl border border-glass-border bg-white/40 focus:bg-white/60 focus:border-cyan-glow/50 focus:ring-4 focus:ring-cyan-glow/10 outline-none transition-all text-sm font-medium"
                      required={isRegister}
                      autoComplete="name"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div className="w-full text-left">
              <label className="text-[9px] font-bold text-text-muted uppercase tracking-[0.2em] ml-4 mb-2 block">Địa chỉ
                Email</label>
              <div className="relative group">
                <UserIcon size={18}
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-cyan-glow transition-colors"/>
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-text-muted pl-12 pr-4 py-3.5 rounded-2xl border border-glass-border bg-white/40 focus:bg-white/60 focus:border-cyan-glow/50 focus:ring-4 focus:ring-cyan-glow/10 outline-none transition-all text-sm font-medium"
                  required
                  autoComplete="email"
                />
              </div>
            </div>
            <div className="w-full text-left">
              <div className="flex items-center justify-between ml-4 mb-2">
                <label className="text-[9px] font-bold text-text-muted uppercase tracking-[0.2em] block">Mật
                  khẩu</label>
                {!isRegister && (
                  <button
                    type="button"
                    onClick={handleResetPassword}
                    className="text-[9px] font-bold text-sunset hover:text-sunset/80 transition-colors uppercase tracking-widest"
                  >
                    Quên mật khẩu?
                  </button>
                )}
              </div>
              <div className="relative group">
                <PrivateIcon size={18}
                             className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-cyan-glow transition-colors"/>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full text-text-muted pl-12 pr-12 py-3.5 rounded-2xl border border-glass-border bg-white/40 focus:bg-white/60 focus:border-cyan-glow/50 focus:ring-4 focus:ring-cyan-glow/10 outline-none transition-all text-sm font-medium"
                  required
                  autoComplete={isRegister ? "new-password" : "current-password"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-cyan-glow transition-colors"
                >
                  {showPassword ? <EyeOffIcon size={18}/> : <EyeIcon size={18}/>}
                </button>
              </div>
            </div>

            <AnimatePresence>
              {authStatus.message && (
                <motion.div
                  initial={{opacity: 0, y: -10}}
                  animate={{opacity: 1, y: 0}}
                  exit={{opacity: 0, y: -10}}
                  className={`p-3 rounded-xl text-[11px] font-bold text-center uppercase tracking-wider ${authStatus.type === 'error' ? 'bg-sunset/10 text-sunset border border-sunset/20' : 'bg-cyan-glow/10 text-cyan-glow border border-cyan-glow/20'
                  }`}
                >
                  {authStatus.message}
                </motion.div>
              )}
            </AnimatePresence>

            <ActionButton
              type="submit"
              disabled={isAuthLoading}
              className="w-full py-3.5 !rounded-2xl shadow-neon"
            >
              <span className="text-xs font-bold uppercase tracking-widest">
                {isAuthLoading ? "Đang xử lý..." : (isRegister ? "Đăng ký ngay" : "Đăng nhập")}
              </span>
            </ActionButton>

            <div className="flex items-center gap-4 py-2">
              <div className="h-[1px] flex-1 bg-glass-border"></div>
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Hoặc</span>
              <div className="h-[1px] flex-1 bg-glass-border"></div>
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full py-3.5 flex items-center justify-center gap-4 rounded-2xl border border-glass-border bg-white/50 hover:bg-white/80 transition-all group"
            >
              <img
                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                alt="Google"
                className="w-5 h-5 bg-white rounded-full p-0.5 shadow-sm group-hover:scale-110 transition-transform"
              />
              <span
                className="text-xs font-bold uppercase tracking-widest text-text-secondary">Tiếp tục với Google</span>
            </button>
          </form>

          <button
            onClick={() => setIsRegister(!isRegister)}
            className="text-xs font-bold text-cyan-glow hover:text-cyan-glow/80 transition-colors uppercase tracking-widest"
          >
            {isRegister ? "Đã có tài khoản? Đăng nhập" : "Chưa có tài khoản? Đăng ký"}
          </button>

          <p className="mt-8 text-[10px] text-zinc-400 font-medium uppercase tracking-widest">
            Aether Neural Protocol v4.2
          </p>
        </GlassPanel>
      </motion.div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 opacity-20">
        <PowerIcon size={14} className="text-cyan-glow"/>
        <span className="text-[10px] font-bold tracking-[0.5em] text-white uppercase">Geo-Spatial Connection</span>
      </div>
    </div>
  );
}

