import { Source, Layer } from 'react-map-gl/maplibre';
import { useWeatherStore } from '../store/useWeatherStore.jsx';

const WeatherLayers = () => {
  const { isVisible, activeLayer } = useWeatherStore();
  
  if (!isVisible) return null;

  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
  const tileUrl = `${API_BASE}/weather/tile/${activeLayer}/{z}/{x}/{y}`;

  // Tăng mạnh Opacity để nhìn rõ hơn
  const getOpacity = (layer) => {
    switch (layer) {
      case 'clouds_new': return 0.8;
      case 'temp_new': return 0.9; // Nhiệt độ gần như đặc
      case 'precipitation_new': return 1.0; // Mưa đặc hoàn toàn
      case 'wind_new': return 0.85;
      default: return 0.9;
    }
  };

  return (
    <>
      {/* Hiệu ứng màu nền môi trường (Ambient Overlay) - Đồng bộ với Aether Theme */}
      <div className={`fixed inset-0 pointer-events-none z-[1] transition-colors duration-1000 ${
        activeLayer === 'temp_new' ? 'bg-sunset/5' : 
        activeLayer === 'precipitation_new' ? 'bg-cyan-glow/5' : 
        activeLayer === 'wind_new' ? 'bg-cyan-glow/3' : 'bg-transparent'
      }`} />

      <Source
        id="weather-source"
        key={activeLayer}
        type="raster"
        tiles={[tileUrl]}
        tileSize={256}
        maxzoom={19}
        scheme="xyz"
      >
        <Layer
          id="weather-layer"
          type="raster"
          paint={{ 
            'raster-opacity': getOpacity(activeLayer),
            'raster-fade-duration': 500,
            'raster-contrast': 0.3, // Tăng độ tương phản màu sắc radar
            'raster-saturation': 0.2, // Tăng độ tươi của màu
            'raster-brightness-min': 0.1
          }}
        />
      </Source>
    </>
  );
};

export default WeatherLayers;
