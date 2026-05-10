import { memo } from 'react';
import {motion} from 'framer-motion';
import {cn} from "../../utils/classNames.js";

const variants = {
  default: 'glass-panel border-glass-border bg-white/80',
  solid: 'border border-glass-border bg-white shadow-glass',
  subtle: 'border border-glass-border bg-white/65 backdrop-blur-2xl shadow-glass',
  floating: 'border border-glass-border bg-white/90 backdrop-blur-3xl shadow-floating',
};

const radii = {
  sm: 'rounded-xl',
  md: 'rounded-2xl',
  lg: 'rounded-[1.5rem]',
  xl: 'rounded-[2rem]',
  full: 'rounded-full',
};

const padding = {
  none: 'p-0',
  sm: 'p-2',
  md: 'p-4',
  lg: 'p-6',
};

const GlassPanel = memo(({
  children,
  className = '',
  variant = 'default',
  radius = 'lg',
  pad = 'sm',
  animate = true,
  ...props
}) => {
  const motionProps = animate
    ? {initial: {opacity: 0, y: 20}, animate: {opacity: 1, y: 0}}
    : {};

  return (
    <motion.div
      {...motionProps}
      className={cn(
        variants[variant] || variants.default,
        radii[radius] || radii.lg,
        padding[pad] || padding.sm,
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
});

GlassPanel.displayName = "GlassPanel";

export default GlassPanel;

