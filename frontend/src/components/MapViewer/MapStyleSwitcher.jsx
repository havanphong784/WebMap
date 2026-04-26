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

export default function MapStyleSwitcher({currentStyleUrl, onStyleChange}) {

  return (
    <div
      className="absolute bottom-8 left-4 md:top-4 md:bottom-auto z-[100] flex flex-col gap-2 bg-white/10 p-2 rounded-xl backdrop-blur-md shadow-lg border border-white/20 max-h-[40vh] md:max-h-[60vh] overflow-y-auto custom-scrollbar">
      <h3 className="text-xs font-bold text-white uppercase tracking-wider text-center drop-shadow-md">
        Kiểu Bản Đồ
      </h3>

      {styleVetor.map((style) => {
        const isActive = currentStyleUrl === style.url;

        return (
          <button
            key={style.id}
            onClick={() => onStyleChange(style.url)}
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
  );
}