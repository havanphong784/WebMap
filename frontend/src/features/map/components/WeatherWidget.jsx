import { motion, AnimatePresence } from "framer-motion";
import { useWeatherStore } from "../store/useWeatherStore.jsx";
import GlassPanel from "../../../shared/components/common/glassPanel.jsx";
import { CloudIcon, SunIcon, WindIcon, DropletsIcon } from "../../../shared/components/common/icons.jsx";

const WeatherWidget = () => {
  const { weather, isLoading, isVisible, activeLayer, setActiveLayer } = useWeatherStore();

  if (!isVisible || !weather) return null;

  const { main, weather: details, wind, name } = weather;
  const condition = details[0];
  const temp = Math.round(main.temp);

  const layers = [
    { id: 'precipitation_new', label: 'Mưa', icon: DropletsIcon, color: 'text-cyan-glow' },
    { id: 'clouds_new', label: 'Mây', icon: CloudIcon, color: 'text-text-dim' },
    { id: 'temp_new', label: 'Nhiệt', icon: SunIcon, color: 'text-sunset' },
    { id: 'wind_new', label: 'Gió', icon: WindIcon, color: 'text-cyan-glow' },
  ];

  const getWeatherIcon = (code) => {
    if (code.includes('01')) return <SunIcon className="text-sunset drop-shadow-neon" size={24} />;
    return <CloudIcon className="text-cyan-glow drop-shadow-neon" size={24} />;
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="fixed top-24 left-4 z-[1000] flex flex-col items-start gap-2.5 pointer-events-none"
      >
        {/* Main Info Card - Optimized Position */}
        <GlassPanel className="p-3 sm:p-4 border-glass-border-bright bg-white/95 backdrop-blur-2xl rounded-[2.2rem] pointer-events-auto flex items-center gap-4 shadow-glass ring-1 ring-black/5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-black/[0.03] border border-black/5">
              {getWeatherIcon(condition.icon)}
            </div>
            <div className="flex flex-col min-w-[70px]">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black tracking-tighter text-text-primary leading-none">{temp}°</span>
                <span className="text-[9px] font-black text-text-secondary uppercase tracking-widest">{condition.description}</span>
              </div>
              <span className="text-[8px] font-black text-cyan-glow uppercase tracking-[0.2em] mt-0.5 truncate max-w-[100px]">{name}</span>
            </div>
          </div>

          <div className="h-8 w-px bg-black/5 mx-1 hidden sm:block"></div>

          <div className="hidden sm:flex items-center gap-4 pr-1">
            <div className="flex flex-col items-center gap-0.5">
              <WindIcon size={12} className="text-text-dim" />
              <span className="text-[9px] font-bold text-text-primary">{wind.speed}m/s</span>
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <DropletsIcon size={12} className="text-text-dim" />
              <span className="text-[9px] font-bold text-text-primary">{main.humidity}%</span>
            </div>
          </div>
        </GlassPanel>

        {/* Layer Selector - Aligned Left */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-1.5 p-1.5 bg-white/95 backdrop-blur-3xl rounded-full border border-glass-border pointer-events-auto shadow-glass ml-1"
        >
          {layers.map((layer) => {
            const Icon = layer.icon;
            const isActive = activeLayer === layer.id;
            return (
              <motion.button
                key={layer.id}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setActiveLayer(layer.id)}
                className={`group relative p-2.5 rounded-full transition-all duration-300 ${
                  isActive 
                  ? 'bg-cyan-glow text-white shadow-neon-sm' 
                  : 'bg-black/[0.02] text-text-muted hover:bg-black/[0.05] hover:text-text-primary border border-transparent hover:border-black/5'
                }`}
              >
                <Icon size={14} className={isActive ? 'text-white' : layer.color} />
                
                {/* Tooltip - Adjusted for Left Position */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 px-2.5 py-1.5 bg-white/95 backdrop-blur-md rounded-xl text-[8px] font-black text-text-primary shadow-glass border border-glass-border opacity-0 group-hover:opacity-100 transition-all transform -translate-y-1 group-hover:translate-y-0 pointer-events-none whitespace-nowrap uppercase tracking-widest z-50">
                  Lớp: {layer.label}
                </div>
              </motion.button>
            );
          })}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default WeatherWidget;
