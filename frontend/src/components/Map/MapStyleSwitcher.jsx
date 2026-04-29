import {motion} from 'framer-motion';

export const styleVetor = [
  {
    id: "dark",
    name: "Obsidian Deep",
    url: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
  },
  {
    id: "light",
    name: "Aether Light",
    url: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
  },
  {
    id: "alidade_smooth_dark",
    name: "Alidade Dark",
    url: "https://tiles.stadiamaps.com/styles/alidade_smooth_dark.json",
  },
  {
    id: "stamen_terrain",
    name: "Topo Terrain",
    url: "https://tiles.stadiamaps.com/styles/stamen_terrain.json",
  },
  {
    id: "alidade_satellite",
    name: "Satellite View",
    url: "https://tiles.stadiamaps.com/styles/alidade_satellite.json",
  },
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
      className="flex flex-col gap-2 glass-panel p-3 border-white/10 shadow-2xl min-w-37.5 bg-obsidian/80 backdrop-blur-3xl"
    >
      <div className="flex items-center gap-2 mb-2 px-2">
        <div className="w-1.5 h-1.5 rounded-full bg-cyan-glow shadow-neon"></div>
        <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
          Kiểu Bản Đồ
        </h3>
      </div>

      <div className="space-y-1">
        {styleVetor.map((style) => {
          const isActive = currentStyleUrl === style.url;

          return (
            <motion.button
              key={style.id}
              whileHover={{x: 4}}
              whileTap={{scale: 0.98}}
              onClick={() => handleStyleSelection(style.url)}
              className={`w-full px-4 py-2.5 text-[11px] font-bold rounded-xl transition-all duration-300 text-left uppercase tracking-wider border ${
                isActive
                  ? "bg-cyan-glow text-obsidian border-cyan-glow shadow-neon"
                  : "bg-white/5 text-zinc-400 border-transparent hover:bg-white/10 hover:text-white"
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