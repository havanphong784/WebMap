import {Marker} from "react-map-gl/maplibre";
import {memo, useState} from "react";
import {motion} from "framer-motion";
import { StarIcon } from "../../../shared/components/common/icons.jsx";
import GlassPanel from "../../../shared/components/common/glassPanel.jsx";
import Skeleton, {SkeletonTheme} from "react-loading-skeleton";

const LocationCard = memo(({location, onClick}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <Marker
      longitude={Number(location.lng)}
      latitude={Number(location.lat)}
      anchor="bottom"
      style={{zIndex: isHovered ? 100 : 1}}
      onClick={(e) => {
        e.originalEvent.stopPropagation();
        onClick(location);
      }}
    >
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={(e) => {
          e.stopPropagation();
          onClick(location);
        }}
        className="relative cursor-pointer"
      >
        <motion.div
          animate={{
            scale: isHovered ? 1.05 : 1,
            y: isHovered ? -5 : 0
          }}
          transition={{type: "spring", stiffness: 300, damping: 20}}
        >
          <GlassPanel
            className="p-2 w-48 border-glass-border bg-white/90 backdrop-blur-xl shadow-glass rounded-2xl overflow-hidden ring-1 ring-glass-border">
            {location.image_url && (
              <div className="overflow-hidden rounded-xl p-0 mb-2 border border-glass-border aspect-video relative group">
                {!imageLoaded && (
                  <SkeletonTheme baseColor="rgba(0,0,0,0.05)" highlightColor="rgba(0,0,0,0.1)">
                    <Skeleton width="100%" height="100%" containerClassName="w-full h-full" borderRadius={12} />
                  </SkeletonTheme>
                )}
                <img
                  src={location.image_url}
                  alt={location.name}
                  loading="lazy"
                  onLoad={() => setImageLoaded(true)}
                  className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-110 ${imageLoaded ? 'opacity-100' : 'opacity-0 absolute inset-0'}`}
                />
                <div className={`absolute inset-0 bg-gradient-to-t from-black/60 to-transparent transition-opacity ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}></div>
              </div>
            )}

            <div className="px-1.5 py-1">
              <h4 className="text-[11px] font-bold text-text-primary leading-tight truncate uppercase tracking-wider mb-1"
                  title={location.name}>
                {location.name}
              </h4>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <StarIcon
                      key={i}
                      size={10}
                      className={i < location.rating ? "text-amber-400 fill-amber-400" : "text-white/10"}
                    />
                  ))}
                </div>
                <div className="text-[9px] font-bold text-cyan-glow uppercase tracking-widest opacity-60">
                  {location.category}
                </div>
              </div>
            </div>
          </GlassPanel>
        </motion.div>

        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 flex items-center justify-center">
          <div className="w-2 h-2 bg-cyan-glow rounded-full shadow-neon ring-4 ring-cyan-glow/10"></div>
          <div className="absolute -bottom-1 w-1 h-1 bg-cyan-glow/40 rounded-full animate-ping"></div>
        </div>
      </div>
    </Marker>
  );
});

LocationCard.displayName = "LocationCard";

export default LocationCard;

