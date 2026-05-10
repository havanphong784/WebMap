import { motion } from 'framer-motion';
import { SpinnerIcon } from './icons.jsx';
import {cn} from "../../utils/classNames.js";

const ActionButton = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  className = '',
  disabled,
  type = 'button',
  ...props
}) => {
  const baseClasses = "relative inline-flex shrink-0 items-center justify-center gap-2 font-bold outline-none transition-all duration-300 focus-visible:ring-2 focus-visible:ring-cyan-glow/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white active:scale-95 disabled:pointer-events-none disabled:opacity-60 disabled:active:scale-100";
  const variants = {
    primary: "bg-cyan-glow text-white shadow-neon hover:brightness-105",
    secondary: "bg-white text-text-primary border border-glass-border shadow-glass hover:border-glass-border-bright",
    glass: "glass-panel border-glass-border bg-white/80 text-text-primary hover:bg-white",
    ghost: "bg-transparent text-text-secondary hover:bg-black/5 hover:text-text-primary",
    icon: "glass-panel border-glass-border bg-white/85 text-text-primary hover:bg-white",
    danger: "bg-sunset text-white shadow-sunset hover:brightness-105",
  };
  const sizes = {
    sm: "min-h-9 px-3 text-[11px] rounded-xl",
    md: "min-h-11 px-5 text-sm rounded-2xl",
    lg: "min-h-12 px-6 text-sm rounded-2xl",
    iconSm: "h-9 w-9 rounded-xl",
    icon: "h-11 w-11 rounded-2xl",
    iconLg: "h-12 w-12 rounded-2xl",
  };

  return (
    <motion.button
      whileHover={!disabled && !loading ? { y: -2 } : {}}
      whileTap={!disabled && !loading ? { scale: 0.95 } : {}}
      className={cn(baseClasses, variants[variant] || variants.primary, sizes[size] || sizes.md, className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      type={type}
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

