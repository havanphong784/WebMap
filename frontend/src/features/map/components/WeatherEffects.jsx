import { useMemo } from 'react';
import {useWeatherStore} from '../store/useWeatherStore.jsx';
import {AnimatePresence, motion} from 'framer-motion';

const WeatherEffects = () => {
  const {weather, isVisible} = useWeatherStore();

  // Stable random values for rain drops to prevent recalculation and re-renders
  const rainDrops = useMemo(() => {
    const stableRandom = (seed) => {
      const x = Math.sin(seed * 999) * 10000;
      return x - Math.floor(x);
    };

    return [...Array(25)].map((_, i) => ({
      left: `${(i * 7 + stableRandom(i + 1) * 5) % 100}%`,
      delay: `${stableRandom(i + 31) * 2}s`,
      duration: `${0.4 + stableRandom(i + 61) * 0.3}s`,
      height: `${15 + stableRandom(i + 91) * 25}px`
    }));
  }, []);

  if (!isVisible || !weather) return null;

  const condition = weather.weather[0].main.toLowerCase();
  const isRaining = condition.includes('rain') || condition.includes('drizzle');
  const isCloudy = condition.includes('cloud');

  return (
    <div className="fixed inset-0 pointer-events-none z-[1500] overflow-hidden">
      <AnimatePresence>
        {isRaining && (
          <motion.div
            key="rain-effect-layer"
            initial={{opacity: 0}}
            animate={{opacity: 1}}
            exit={{opacity: 0}}
            className="absolute inset-0"
          >
            {rainDrops.map((drop, i) => (
              <div
                key={`rain-drop-${i}`}
                className="absolute bg-linear-to-b from-transparent via-cyan-500/30 to-cyan-400/50 w-[1px] rounded-full"
                style={{
                  left: drop.left,
                  top: `-100px`,
                  height: drop.height,
                  animation: `rain-fall ${drop.duration} linear infinite`,
                  animationDelay: drop.delay
                }}
              />
            ))}
            {/* Removed backdrop-blur as it's too expensive on mobile */}
            <div className="absolute inset-0 bg-cyan-900/5"/>
          </motion.div>
        )}

        {isCloudy && (
          <motion.div
            key="cloud-effect-layer"
            initial={{opacity: 0}}
            animate={{opacity: 0.3}}
            exit={{opacity: 0}}
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(circle at 50% 20%, rgba(255,255,255,0.05) 0%, transparent 70%)',
              animation: 'cloud-float 30s linear infinite'
            }}
          />
        )}

        <div key="vignette-effect"
             className="absolute inset-0 shadow-[inset_0_0_150px_rgba(0,0,0,0.3)] pointer-events-none"/>
      </AnimatePresence>
    </div>
  );
};


export default WeatherEffects;
