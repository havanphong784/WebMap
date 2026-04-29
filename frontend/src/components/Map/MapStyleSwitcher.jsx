export const API_KEY = "a18c9f5b-e70f-43d5-afb5-7da5351c027d";

export const styleVetor = [
  {
    id: "dark",
    name: "Dark Mode",
    url: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
  },
  {
    id: "light",
    name: "Positron (Sáng)",
    url: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
  },
  {
    id: "alidade_smooth",
    name: "Alidade smooth",
    url: "https://tiles.stadiamaps.com/styles/alidade_smooth.json",
  },
  {
    id: "alidade_smooth_dark",
    name: "Alidade smooth dark",
    url: "https://tiles.stadiamaps.com/styles/alidade_smooth_dark.json",
  },
  {
    id: "stamen_terrain",
    name: "Stamen terrain",
    url: "https://tiles.stadiamaps.com/styles/stamen_terrain.json",
  },
  {
    id: "alidade_satellite",
    name: "Alidade satellite",
    url: "https://tiles.stadiamaps.com/styles/alidade_satellite.json",
  },

];

import {useState} from 'react';

export default function MapStyleSwitcher({currentStyleUrl, onStyleChange}) {
  const [isOpen, setIsOpen] = useState(false);

  const handleStyleSelection = (url) => {
    onStyleChange(url);
    setIsOpen(false);
  };

  return (
    <div className="absolute bottom-8 left-4 md:top-4 md:bottom-auto z-[100]">

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-12 h-12 bg-white/20 backdrop-blur-md rounded-full shadow-lg border border-white/20 hover:bg-white/30 transition-all outline-none"
        aria-label="Toggle map styles"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
          <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
          <polyline points="2 17 12 22 22 17"></polyline>
          <polyline points="2 12 12 17 22 12"></polyline>
        </svg>
      </button>

      {isOpen && (
        <div
          className="flex flex-col gap-2 bg-white/10 p-2 rounded-xl backdrop-blur-md shadow-lg border border-white/20 mt-2 min-w-[200px] animate-in fade-in zoom-in duration-200">
          <h3
            className="text-xs font-bold text-white uppercase tracking-wider text-center drop-shadow-md pb-1 border-b border-white/10">
            Kiểu Bản Đồ
          </h3>

          {styleVetor.map((style) => {
            const isActive = currentStyleUrl === style.url;

            return (
              <button
                key={style.id}
                onClick={() => handleStyleSelection(style.url)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 whitespace-nowrap text-left ${
                  isActive
                    ? "bg-blue-600 text-white shadow-inner"
                    : "bg-white/80 text-gray-700 hover:bg-white"
                }`}
              >
                {style.name}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}