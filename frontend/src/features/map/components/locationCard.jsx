import { Marker } from "react-map-gl/maplibre";
import { memo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { PhotoIcon, StarIcon } from "../../../shared/components/common/icons.jsx";

const LocationCard = memo(({ location, onClick, viewMode = 'mini', count = 1, allInGroup = [] }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const isExpanded = viewMode === 'full' || isHovered;

  const handleInteraction = (e) => {
    e.stopPropagation();
    onClick(count > 1 ? { ...location, group: allInGroup } : location);
  };

  return (
    <Marker
      longitude={Number(location.lng)}
      latitude={Number(location.lat)}
      anchor="bottom"
      style={{ zIndex: isHovered ? 2000 : (isExpanded ? 100 : 1) }}
      onClick={(e) => {
        e.originalEvent.stopPropagation();
        handleInteraction(e.originalEvent);
      }}
    >
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleInteraction}
        className="relative cursor-pointer group"
      >
        <motion.div
          layout
          initial={false}
          animate={{
            y: isExpanded ? -12 : 0,
            scale: isExpanded ? 1.05 : 1,
          }}
          className="relative"
        >
          {count > 1 && isExpanded && (
            <>
              {/* Lớp xa nhất (Dưới cùng) */}
              <div
                className="absolute inset-0 bg-obsidian/40 backdrop-blur-sm border border-cyan-glow/10 rounded-3xl -rotate-2 -translate-y-4 scale-[0.96] transition-all duration-700 opacity-60 group-hover:-translate-y-6 group-hover:rotate-[-4deg]" />
              {/* Lớp giữa */}
              <div
                className="absolute inset-0 bg-obsidian/60 backdrop-blur-md border border-white/5 rounded-3xl rotate-1 -translate-y-2 scale-[0.98] transition-all duration-500 opacity-80 group-hover:-translate-y-3 group-hover:rotate-[2deg]" />
            </>
          )}

          <div
            className={`
              relative transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]
              bg-obsidian/95 border shadow-glass overflow-hidden
              ${isExpanded
                ? 'w-56 p-2.5 rounded-3xl border-glass-border-bright shadow-neon/10'
                : `w-10 h-10 p-0 rounded-full ${count > 1 ? 'ring-4 ring-cyan-glow/20 border-cyan-glow' : 'ring-2 ring-cyan-glow/40 border-glass-border'}`
              }
            `}
          >
            {!isExpanded && count > 1 && (
              <div
                className="absolute -top-1 -right-1 bg-cyan-glow text-white text-[8px] font-black w-3 h-3 flex items-center justify-center rounded-full shadow-neon z-10">
                {count}
              </div>
            )}

            <div className={`
              relative overflow-hidden transition-all duration-500 ease-in-out
              ${isExpanded ? 'rounded-xl aspect-[16/10] mb-2.5' : 'rounded-full w-full h-full'}
            `}>
              {location.image_url ? (
                <img
                  src={location.image_url}
                  alt={location.name}
                  onLoad={() => setImageLoaded(true)}
                  className={`w-full h-full object-cover transition-transform duration-700 ${isExpanded ? 'scale-110' : 'scale-100'}`}
                />
              ) : (
                <div className="w-full h-full bg-cyan-glow/10 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-cyan-glow rounded-full shadow-neon animate-pulse" />
                </div>
              )}

              {isExpanded && count > 1 && (
                <div
                  className="absolute top-2 right-2 px-2 py-1 bg-black/60 backdrop-blur-md rounded-full flex items-center gap-1 border border-white/20">
                  <PhotoIcon size={10} className="text-white" />
                  <span className="text-[10px] font-black text-white">+{count - 1}</span>
                </div>
              )}
            </div>

            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  transition={{ duration: 0.3 }}
                  className="px-1"
                >
                  <h4
                    className="text-[11px] font-jakarta font-black text-black truncate uppercase tracking-wider mb-1.5">
                    {location.name}
                  </h4>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <StarIcon key={i} size={9}
                          className={i < (location.rating || 5) ? "text-text-primary fill-text-primary" : "text-white/10"} />
                      ))}
                    </div>
                    <span
                      className="text-[9px] font-bold text-text-primary uppercase tracking-[0.1em] drop-shadow-neon-sm">
                      {location.category}
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className={`
            absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-obsidian border-b border-r border-glass-border rotate-45 transition-opacity duration-300
            ${isExpanded ? 'opacity-100' : 'opacity-0'}
          `} />
        </motion.div>

        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 flex items-center justify-center">
          <div
            className={`w-2 h-2 bg-cyan-glow rounded-full shadow-neon ring-4 ring-cyan-glow/10 transition-transform duration-300 ${isHovered ? 'scale-125' : 'scale-100'}`}></div>
          <div className="absolute -bottom-1 w-1 h-1 bg-cyan-glow/40 rounded-full animate-ping"></div>
        </div>
      </div>
    </Marker>
  );
});

LocationCard.displayName = "LocationCard";

export default LocationCard;
