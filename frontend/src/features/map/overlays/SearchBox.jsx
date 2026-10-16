import { useState } from "react";
import { searchAddress } from "../utils/geocoding.js";
import { AnimatePresence, motion } from "framer-motion";
import GlassPanel from "../../../shared/components/common/glassPanel.jsx";
import ActionButton from "../../../shared/components/common/actionButton.jsx";
import {
  SearchIcon,
  CloseIcon,
  SpinnerIcon,
  PinIcon,
  LocateIcon
} from "../../../shared/components/common/icons.jsx";

export default function SearchBox({ onSelectLocation }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectingPlaceId, setSelectingPlaceId] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    const data = await searchAddress(query);
    setResults(data);
    setIsLoading(false);
  };

  const handleSelect = async (item) => {
    setSelectingPlaceId(item.place_id || item.id || item.display_name);
    try {
      await onSelectLocation(item);
      setResults([]);
      setQuery((item.name || item.display_name || "").split(',')[0]);
    } finally {
      setSelectingPlaceId(null);
    }
  };

  const clearSearch = () => {
    setQuery("");
    setResults([]);
  };

  return (
    <div className="absolute left-1/2 top-[calc(1rem+var(--app-safe-top))] z-30 w-[calc(100%-1.5rem-var(--app-safe-left)-var(--app-safe-right))] max-w-lg -translate-x-1/2 sm:top-[calc(1.5rem+var(--app-safe-top))]">
      <form onSubmit={handleSearch} className="relative">
        <GlassPanel
          animate={false}
          variant="floating"
          radius="full"
          pad="none"
          className="flex min-h-12 items-center gap-2 px-3 sm:gap-3 sm:px-5"
        >
          <SearchIcon size={19} className={isLoading ? "text-cyan-glow animate-pulse" : "text-text-muted"} />

          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm địa điểm trên Goong..."
            className="min-w-0 flex-1 bg-transparent text-sm font-medium text-text-primary outline-none placeholder:text-text-muted"
          />

          <AnimatePresence>
            {query && (
              <motion.button
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                onClick={clearSearch}
                type="button"
                className="rounded-full p-1 text-text-muted transition-colors hover:bg-black/5 hover:text-text-primary"
                aria-label="Xóa tìm kiếm"
              >
                <CloseIcon size={18} />
              </motion.button>
            )}
          </AnimatePresence>

          <div className="h-6 w-px bg-glass-border"></div>

          <ActionButton type="submit" variant="ghost" size="iconSm" className="shadow-none" aria-label="Tìm kiếm">
            {isLoading
              ? <SpinnerIcon size={18} className="animate-spin text-cyan-glow" />
              : <LocateIcon size={18} className="text-text-muted" />}
          </ActionButton>
        </GlassPanel>
      </form>

      <AnimatePresence>
        {results.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mt-2 max-h-[min(22rem,calc(100vh-8rem))] overflow-y-auto rounded-3xl border border-glass-border bg-white/95 p-2 shadow-floating backdrop-blur-3xl custom-scrollbar sm:mt-3"
          >
            {results.map((item, index) => (
              <motion.li
                key={`${item.place_id || item.osm_id || item.display_name}-${index}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
                onClick={() => handleSelect(item)}
                className="flex cursor-pointer items-start gap-3 rounded-2xl px-4 py-3 transition-colors hover:bg-black/5"
              >
                <div className="mt-1 rounded-xl bg-black/5 p-2 text-text-muted transition-colors">
                  {selectingPlaceId === (item.place_id || item.id || item.display_name)
                    ? <SpinnerIcon size={16} className="animate-spin text-cyan-glow" />
                    : <PinIcon size={16} />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="mb-1 truncate text-sm font-bold leading-tight text-text-primary">
                    {item.name || item.display_name.split(',')[0]}
                  </p>
                  <p className="line-clamp-2 text-[11px] leading-tight text-text-muted">
                    {item.secondary_text || item.display_name.split(',').slice(1).join(',').trim()}
                  </p>
                  {Number.isFinite(Number(item.distance_meters)) && (
                    <p className="mt-1 text-[10px] font-bold text-cyan-glow">
                      {Math.round(Number(item.distance_meters))} m
                    </p>
                  )}
                </div>
              </motion.li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
