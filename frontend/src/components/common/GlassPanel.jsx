import {motion} from 'framer-motion';

const GlassPanel = ({children, className = '', ...props}) => {
  return (
    <motion.div
      initial={{opacity: 0, y: 20}}
      animate={{opacity: 1, y: 0}}
      className={`glass-panel p-2 ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export default GlassPanel;
