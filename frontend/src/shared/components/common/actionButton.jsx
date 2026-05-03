import { motion } from 'framer-motion';
import { SpinnerIcon } from './icons.jsx';

const ActionButton = ({ children, variant = 'primary', loading = false, className = '', disabled, ...props }) => {
  const baseClasses = "flex items-center justify-center gap-2 font-bold transition-all duration-300 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed disabled:active:scale-100";
  const variants = {
    primary: "bg-cyan-glow text-white shadow-neon rounded-full py-2.5 px-5 hover:scale-105",
    glass: "glass-panel py-2.5 px-5 hover:bg-glass-white text-text-primary",
    icon: "glass-panel p-2.5 rounded-full hover:bg-glass-white text-text-primary",
  };

  return (
    <motion.button
      whileHover={!disabled && !loading ? { y: -2 } : {}}
      whileTap={!disabled && !loading ? { scale: 0.95 } : {}}
      className={`${baseClasses} ${variants[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <SpinnerIcon size={18} className="animate-spin" />
      ) : (
        children
      )}
    </motion.button>
  );
};

export default ActionButton;

