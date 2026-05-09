import { memo } from 'react';
import { motion } from 'framer-motion';
import { isMobile } from '../../utils/deviceUtils.js';

const PageTransition = memo(({ children }) => {
  const mobile = isMobile();
  
  return (
    <motion.div
      initial={!mobile ? { opacity: 0, y: 15 } : { opacity: 0 }}
      animate={{ opacity: 1, y: 0 }}
      exit={!mobile ? { opacity: 0, y: -15 } : { opacity: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="h-full w-full"
    >
      {children}
    </motion.div>
  );
});

PageTransition.displayName = "PageTransition";

export default PageTransition;
