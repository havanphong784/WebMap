import React from 'react';
import {useWeatherStore} from '../store/useWeatherStore.jsx';
import {AnimatePresence, motion} from 'framer-motion';

const WeatherEffects = () => {
  const {weather, isVisible, activeLayer} = useWeatherStore();

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
            {[...Array(30)].map((_, i) => (
              <div
                key={`rain-drop-${i}`}
                className="absolute bg-linear-to-b from-transparent via-cyan-700/40 to-cyan-glow/60 w-[1.5px] rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `-150px`,
                  height: `${10 + Math.random() * 30}px`,
                  filter: 'blur(0.1px)',
                  animation: `rain-fall ${0.3 + Math.random() * 0.4}s linear infinite`,
                  animationDelay: `${Math.random() * 2}s`
                }}
              />
            ))}

            <div className="absolute inset-0 bg-cyan-glow/[0.03] backdrop-blur-[0.1px]"/>
          </motion.div>
        )}

        {isCloudy && (
          <motion.div
            key="cloud-effect-layer"
            initial={{opacity: 0}}
            animate={{opacity: 0.4}}
            exit={{opacity: 0}}
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(circle, rgba(255,255,255,0.05) 0%, rgba(0,0,0,0) 70%)',
              animation: 'cloud-float 20s linear infinite'
            }}
          />
        )}

        <div key="vignette-effect"
             className={`absolute inset-0 transition-shadow duration-1000 shadow-[inset_0_0_200px_rgba(0,0,0,0.4)]`}/>
      </AnimatePresence>
    </div>
  );
};

export default WeatherEffects;
