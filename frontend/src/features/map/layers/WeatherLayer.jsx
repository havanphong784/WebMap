import {Layer, Source} from "react-map-gl/maplibre";
import {useWeatherStore} from "../store/useWeatherStore.jsx";
import {API_BASE_URL} from "../../../shared/api/apiClient.js";
import {LAYER_IDS, SOURCE_IDS} from "../config/mapConfig.js";

const LAYER_OPACITY = {
  clouds_new: 0.8,
  temp_new: 0.9,
  precipitation_new: 1.0,
  wind_new: 0.85,
};

const TINT_CLASS = {
  temp_new: "bg-sunset/5",
  precipitation_new: "bg-cyan-glow/5",
  wind_new: "bg-cyan-glow/3",
};

const WeatherLayer = () => {
  const isVisible = useWeatherStore((state) => state.isVisible);
  const activeLayer = useWeatherStore((state) => state.activeLayer);

  if (!isVisible) return null;

  const tileUrl = `${API_BASE_URL}/weather/tile/${activeLayer}/{z}/{x}/{y}`;
  const opacity = LAYER_OPACITY[activeLayer] ?? 0.9;
  const tintClass = TINT_CLASS[activeLayer] || "bg-transparent";

  return (
    <>
      <div
        className={`fixed inset-0 pointer-events-none z-[1] transition-colors duration-1000 ${tintClass}`}
      />
      <Source
        id={SOURCE_IDS.WEATHER}
        key={activeLayer}
        type="raster"
        tiles={[tileUrl]}
        tileSize={256}
        maxzoom={19}
        scheme="xyz"
      >
        <Layer
          id={LAYER_IDS.WEATHER}
          type="raster"
          paint={{
            "raster-opacity": opacity,
            "raster-fade-duration": 500,
            "raster-contrast": 0.3,
            "raster-saturation": 0.2,
            "raster-brightness-min": 0.1,
          }}
        />
      </Source>
    </>
  );
};

export default WeatherLayer;
