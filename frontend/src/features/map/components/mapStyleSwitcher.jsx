import {motion} from "framer-motion";
import colorfull from "../style/colorful";


const styleVetor = [
  colorfull,

];

export default function MapStyleSwitcher({currentStyleUrl, onStyleChange, isStandalone = true}) {
  const handleStyleSelection = (url) => {
    onStyleChange(url);
  };

  const listContent = (
    <motion.div
      initial={{opacity: 0, scale: 0.9, x: 20}}
      animate={{opacity: 1, scale: 1, x: 0}}
      exit={{opacity: 0, scale: 0.9, x: 20}}
      className="flex flex-col gap-2 glass-panel p-3 border-glass-border shadow-glass w-48 bg-glass-obsidian backdrop-blur-3xl"
    >
      <div className="flex items-center gap-2 mb-2 px-2">
        <div className="w-1.5 h-1.5 rounded-full bg-cyan-glow shadow-neon"></div>
        <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
          Kiểu Bản Đồ
        </h3>
      </div>

      <div className="flex flex-col gap-2">
        {styleVetor.map((style, index) => {
          const isActive = currentStyleUrl === style;

          return (
            <motion.button
              key={"ff" + index}
              whileHover={{x: 4}}
              whileTap={{scale: 0.98}}
              onClick={() => handleStyleSelection(style)}
              className={`w-full px-4 py-2.5 text-[11px] font-bold rounded-xl transition-all duration-300 text-left uppercase tracking-wider border ${isActive
                ? "bg-cyan-glow text-obsidian border-cyan-glow shadow-neon"
                : "bg-glass-white text-text-secondary border-transparent hover:bg-white/10 hover:text-text-primary"
              }`}
            >
              {style.name}
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );

  if (!isStandalone) return listContent;

  return (
    <div className="absolute bottom-8 left-4 md:top-4 md:bottom-auto z-[100]">
      {listContent}
    </div>
  );
}
