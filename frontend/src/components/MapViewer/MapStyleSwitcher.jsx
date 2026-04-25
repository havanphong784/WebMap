import {MapStyles} from "./MapStyles.jsx";

export default function MapStyleSwitcher({currentStyleUrl, onStyleChange}) {
  return (
    <div
      className="absolute top-4 right-4 z-[1000] flex flex-col gap-2 bg-white/80 p-2 rounded-lg backdrop-blur-sm shadow-md">
      <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider text-center">Bản đồ</h3>

      {MapStyles.map((style) => {
        const isActive = currentStyleUrl === style.url;

        return (
          <button
            key={style.id}
            onClick={() => onStyleChange(style)}
            className={`px-3 py-2 text-sm rounded-md transition-all duration-300 ${
              isActive
                ? "bg-blue-600 text-white font-semibold shadow-inner"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {style.name}
          </button>
        );
      })}
    </div>
  );
}
