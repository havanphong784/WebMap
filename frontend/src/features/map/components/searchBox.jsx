import {useState} from "react";
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

export default function SearchBox({onSelectLocation}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    const data = await searchAddress(query);
    setResults(data);
    setIsLoading(false);
  };

  const handleSelect = (item) => {
    onSelectLocation(parseFloat(item.lon), parseFloat(item.lat), item.display_name);
    setResults([]);
    setQuery(item.display_name.split(',')[0]);
  }

  const clearSearch = () => {
    setQuery("");
    setResults([]);
  }

  return (
    <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-lg shadow-floating">
      <form onSubmit={handleSearch} className="relative">
        <GlassPanel className="flex items-center gap-3 py-2.5 px-5 rounded-full border-glass-border bg-white/90 shadow-floating">
          <SearchIcon size={20} className={isLoading ? "text-cyan-glow animate-pulse" : "text-text-muted"}/>

          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm địa điểm, người dùng..."
            className="bg-transparent border-none outline-none flex-1 text-text-primary placeholder-text-dim font-medium text-sm"
          />

          <AnimatePresence>
            {query && (
              <motion.button
                initial={{opacity: 0, scale: 0.5}}
                animate={{opacity: 1, scale: 1}}
                exit={{opacity: 0, scale: 0.5}}
                onClick={clearSearch}
                type="button"
                className="text-text-muted hover:text-text-primary transition-colors"
              >
                <CloseIcon size={18}/>
              </motion.button>
            )}
          </AnimatePresence>

          <div className="w-[1px] h-6 bg-glass-border"></div>

          <ActionButton variant="icon" className="!p-1 bg-transparent border-none shadow-none">
            {isLoading ? <SpinnerIcon size={18} className="animate-spin text-cyan-glow"/> :
              <LocateIcon size={18} className="text-text-muted"/>}
          </ActionButton>
        </GlassPanel>
      </form>

      <AnimatePresence>
        {results.length > 0 && (
          <motion.ul
            initial={{opacity: 0, y: 10}}
            animate={{opacity: 1, y: 0}}
            exit={{opacity: 0, y: 10}}
            className="mt-3 glass-panel p-2 border-glass-border bg-white/95 shadow-floating max-h-72 overflow-y-auto custom-scrollbar"
          >
            {results.map((item, index) => (
              <motion.li
                key={index}
                initial={{opacity: 0, x: -10}}
                animate={{opacity: 1, x: 0}}
                transition={{delay: index * 0.05}}
                onClick={() => handleSelect(item)}
                className="flex items-start gap-3 px-4 py-3 rounded-xl hover:bg-white/10 cursor-pointer group transition-colors"
              >
                <div
                  className="mt-1 p-2 rounded-lg bg-black/5 text-text-muted group-hover:text-cyan-glow transition-colors">
                  <PinIcon size={16}/>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-text-primary leading-tight mb-1">{item.display_name.split(',')[0]}</p>
                  <p
                    className="text-[11px] text-text-muted leading-tight">{item.display_name.split(',').slice(1).join(',').trim()}</p>
                </div>
              </motion.li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
