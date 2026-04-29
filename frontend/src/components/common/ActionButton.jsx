import { motion } from 'framer-motion';

const ActionButton = ({ children, variant = 'primary', className = '', ...props }) => {
  const baseClasses = "flex items-center justify-center gap-2 font-bold transition-all duration-300 active:scale-95";
  const variants = {
    primary: "bg-cyan-glow text-obsidian shadow-neon rounded-full py-3 px-6 hover:scale-105",
    glass: "glass-panel py-3 px-6 hover:bg-white/10",
    icon: "glass-panel p-3 rounded-full hover:bg-white/10",
  };

  return (
    <motion.button
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.95 }}
      className={`${baseClasses} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
};

export default ActionButton;
