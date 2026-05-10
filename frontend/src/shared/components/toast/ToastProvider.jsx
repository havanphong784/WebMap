import {AnimatePresence, motion} from 'framer-motion';
import {useToastStore} from './useToastStore.jsx';
import {AlertCircleIcon, InfoIcon, ShieldCheckIcon} from 'lucide-react'; // Fallback icons if custom ones not available

const ToastProvider = () => {
  const {toasts, removeToast} = useToastStore();

  return (
    <div className="fixed left-3 right-3 top-20 z-[9999] flex flex-col gap-2 pointer-events-none sm:left-auto sm:right-4 sm:top-4">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            layout
            initial={{opacity: 0, x: 50, scale: 0.95}}
            animate={{opacity: 1, x: 0, scale: 1}}
            exit={{opacity: 0, x: 20, scale: 0.95, transition: {duration: 0.2}}}
            className={`pointer-events-auto relative flex w-full items-center gap-3.5 overflow-hidden rounded-2xl border border-glass-border bg-white/95 px-4 py-3.5 shadow-glass backdrop-blur-2xl sm:min-w-[300px] sm:max-w-sm group ${
              toast.type === 'error'
                ? 'shadow-[0_4px_30px_rgba(255,75,43,0.15)] border-l-4 border-l-sunset'
                : toast.type === 'success'
                  ? 'shadow-[0_4px_30px_rgba(0,243,255,0.15)] border-l-4 border-l-cyan-glow'
                  : 'shadow-glass'
            }`}
          >
            <div
              className={`absolute inset-0 opacity-10 pointer-events-none transition-opacity duration-500 group-hover:opacity-20 ${
                toast.type === 'error' ? 'bg-gradient-to-r from-sunset to-transparent' :
                  toast.type === 'success' ? 'bg-gradient-to-r from-cyan-glow to-transparent' :
                    'bg-gradient-to-r from-white/20 to-transparent'
              }`}/>

            <div className="shrink-0 relative z-10 p-1.5 rounded-full bg-white/[0.03] border border-white/[0.05]">
              {toast.type === 'error' && <AlertCircleIcon size={18} className="text-sunset drop-shadow-sunset"/>}
              {toast.type === 'success' && <ShieldCheckIcon size={18} className="text-cyan-glow drop-shadow-neon"/>}
              {toast.type === 'info' && <InfoIcon size={18} className="text-text-secondary"/>}
            </div>

            <p
              className="text-[12px] font-jakarta font-bold text-text-primary tracking-wide flex-1 relative z-10 leading-snug">
              {toast.message}
            </p>

            <button
              onClick={() => removeToast(toast.id)}
              className="relative z-10 shrink-0 rounded-full border border-transparent bg-black/[0.03] p-1.5 text-text-muted transition-colors hover:border-black/10 hover:bg-black/[0.06] hover:text-text-primary"
              aria-label="Đóng thông báo"
            >
              ✕
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default ToastProvider;
