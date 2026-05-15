import {memo, useState} from "react";
import {Marker} from "react-map-gl/maplibre";
import {AnimatePresence, motion} from "framer-motion";
import {StarIcon} from "../../../shared/components/common/icons.jsx";

/**
 * UI marker cho 1 location đã được MapLibre unclustered.
 * Chỉ hiển thị image card + hover/expand. Không tự xử lý grouping.
 */
const LocationCard = memo(({location, onClick, viewMode = "mini"}) => {
  const [isHovered, setIsHovered] = useState(false);
  const isExpanded = viewMode === "full" || isHovered;
  const reviewCount = location.review_count || (location.group?.length) || 1;

  const handleClick = (e) => {
    e.stopPropagation();
    onClick?.(location);
  };

  return (
    <Marker
      longitude={Number(location.lng)}
      latitude={Number(location.lat)}
      anchor="bottom"
      style={{
        zIndex: isHovered ? 25 : (isExpanded ? 22 : 20),
        pointerEvents: "auto",
      }}
      onClick={(e) => {
        e.originalEvent.stopPropagation();
        e.originalEvent.preventDefault();
        handleClick(e.originalEvent);
      }}
    >
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleClick}
        className="relative cursor-pointer group"
      >
        {/* Badge hiện số reviews nếu > 1 */}
        {reviewCount > 1 && (
          <div className="absolute -top-1 -right-1 z-30 bg-cyan-glow text-white text-[9px] font-black min-w-[18px] h-[18px] flex items-center justify-center rounded-full shadow-neon border border-white/30 px-1">
            {reviewCount}
          </div>
        )}
        <motion.div
          layout
          initial={false}
          animate={{
            y: isExpanded ? -12 : 0,
            scale: isExpanded ? 1.05 : 1,
          }}
          className="relative"
        >
          <div
            className={`
              relative transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]
              bg-obsidian/95 border shadow-glass overflow-hidden
              ${isExpanded
                ? "w-56 p-2.5 rounded-3xl border-glass-border-bright shadow-neon/10"
                : "w-10 h-10 p-0 rounded-full ring-2 ring-cyan-glow/40 border-glass-border"
              }
            `}
          >
            <div
              className={`
                relative overflow-hidden transition-all duration-500 ease-in-out
                ${isExpanded ? "rounded-xl aspect-[16/10] mb-2.5" : "rounded-full w-full h-full"}
              `}
            >
              {location.image_url ? (
                <img
                  src={location.image_url}
                  alt={location.name}
                  className={`w-full h-full object-cover transition-transform duration-700 ${isExpanded ? "scale-110" : "scale-100"}`}
                />
              ) : (
                <div className="w-full h-full bg-cyan-glow/10 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-cyan-glow rounded-full shadow-neon animate-pulse" />
                </div>
              )}
            </div>

            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{opacity: 0, y: 10}}
                  animate={{opacity: 1, y: 0}}
                  exit={{opacity: 0, y: 5}}
                  transition={{duration: 0.3}}
                  className="px-1"
                >
                  <h4 className="text-[11px] font-jakarta font-black text-black truncate uppercase tracking-wider mb-1.5">
                    {location.name}
                  </h4>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <StarIcon
                          key={i}
                          size={9}
                          className={i < (location.rating || 5) ? "text-text-primary fill-text-primary" : "text-white/10"}
                        />
                      ))}
                    </div>
                    <span className="text-[9px] font-bold text-text-primary uppercase tracking-[0.1em] drop-shadow-neon-sm">
                      {location.category}
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div
            className={`
              absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-obsidian border-b border-r border-glass-border rotate-45 transition-opacity duration-300
              ${isExpanded ? "opacity-100" : "opacity-0"}
            `}
          />
        </motion.div>

        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 flex items-center justify-center">
          <div
            className={`w-2 h-2 bg-cyan-glow rounded-full shadow-neon ring-4 ring-cyan-glow/10 transition-transform duration-300 ${isHovered ? "scale-125" : "scale-100"}`}
          />
          <div className="absolute -bottom-1 w-1 h-1 bg-cyan-glow/40 rounded-full animate-ping" />
        </div>
      </div>
    </Marker>
  );
});

LocationCard.displayName = "LocationCard";

export default LocationCard;
