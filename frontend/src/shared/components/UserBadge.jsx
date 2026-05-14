import { memo } from 'react';
import { motion } from 'framer-motion';
import { isMobile } from '../utils/deviceUtils.js';

const TIER_CONFIG = {
  'Wanderer': {
    colors: ['#94a3b8', '#cbd5e1', '#94a3b8'],
    glow: 'rgba(148, 163, 184, 0.3)',
    animate: false
  },
  'Explorer': {
    colors: ['#06b6d4', '#22d3ee', '#06b6d4'],
    glow: 'rgba(6, 182, 212, 0.5)',
    animate: true
  },
  'Pathfinder': {
    colors: ['#8b5cf6', '#d946ef', '#8b5cf6'],
    glow: 'rgba(139, 92, 246, 0.5)',
    animate: true
  },
  'Vanguard': {
    colors: ['#ff4b2b', '#ff416c', '#ff4b2b'],
    glow: 'rgba(255, 75, 43, 0.5)',
    animate: true
  },
  'Legend': {
    colors: ['#fbbf24', '#f59e0b', '#fbbf24'],
    glow: 'rgba(251, 191, 36, 0.6)',
    animate: true
  },
  'Master of Aether': {
    colors: ['#4285F4', '#9b72cb', '#d96570', '#1a73e8'],
    glow: 'rgba(155, 114, 203, 0.7)',
    animate: true,
    isGemini: true
  }
};

const UserBadge = memo(({user = {}, size = 64, hideLevelBadge = false, isOnline = false}) => {
  const {
    xp = 0,
    avatar_url,
    avatar,
    photoURL,
    picture,
    name,
    displayName,
    email
  } = user || {};
  const mobile = isMobile();
  const avatarUrl = avatar_url || avatar || photoURL || picture;
  const displayNameText = name || displayName || email?.split('@')[0] || 'U';

  const level = Math.floor(Math.sqrt(xp / 100)) + 1;

  let tier = 'Wanderer';
  if (level >= 100) tier = 'Master of Aether';
  else if (level >= 75) tier = 'Legend';
  else if (level >= 50) tier = 'Vanguard';
  else if (level >= 25) tier = 'Pathfinder';
  else if (level >= 10) tier = 'Explorer';

  const config = TIER_CONFIG[tier] || TIER_CONFIG['Wanderer'];
  const strokeWidth = size * 0.08;
  const radius = (size - strokeWidth) / 2;

  const bleed = size * 0.15;
  const svgSize = size + bleed * 2;

  return (
    <motion.div 
      className="relative inline-block group" 
      style={{width: size, height: size}}
      whileHover={!mobile ? { scale: 1.1 } : {}}
      whileTap={mobile ? { scale: 0.95 } : {}}
    >
      {config.animate && !mobile && (
        <div
          className="absolute rounded-full opacity-40 blur-md animate-pulse"
          style={{
            top: -bleed,
            left: -bleed,
            width: svgSize,
            height: svgSize,
            background: `conic-gradient(from 0deg, ${config.colors.join(', ')})`,
            animation: 'spin 4s linear infinite'
          }}
        />
      )}

      <svg
        width={svgSize}
        height={svgSize}
        viewBox={`0 0 ${svgSize} ${svgSize}`}
        className="absolute transform -rotate-90 z-10"
        style={{
          top: -bleed,
          left: -bleed,
          overflow: 'visible'
        }}
      >
        <defs>
          <linearGradient id={`grad-${tier.replace(/\s+/g, '-')}`} x1="0%" y1="0%" x2="100%" y2="100%">
            {config.colors.map((color, i) => (
              <stop key={i} offset={`${(i / (config.colors.length - 1)) * 100}%`} stopColor={color}/>
            ))}
          </linearGradient>

          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation={size * 0.04} result="blur"/>
            <feComposite in="SourceGraphic" in2="blur" operator="over"/>
          </filter>
        </defs>

        <g transform={`translate(${bleed}, ${bleed})`}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth={strokeWidth}
          />

          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={`url(#grad-${tier.replace(/\s+/g, '-')})`}
            strokeWidth={strokeWidth}
            filter={!mobile ? "url(#glow)" : undefined}
            style={{
              transition: 'stroke 0.5s ease',
            }}
          />

          {config.isGemini && (
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="white"
              strokeWidth={strokeWidth * 0.2}
              className={!mobile ? "animate-pulse opacity-30" : "opacity-30"}
            />
          )}
        </g>
      </svg>

      <div
        className="absolute overflow-hidden rounded-full z-20 backdrop-blur-sm"
        style={{
          top: strokeWidth,
          left: strokeWidth,
          width: size - strokeWidth * 2,
          height: size - strokeWidth * 2,
          background: 'rgba(10, 10, 10, 0.4)',
          boxShadow: `inset 0 0 ${size * 0.1}px rgba(255,255,255,0.1)`,
          border: '0.5px solid rgba(255,255,255,0.15)'
        }}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={displayNameText}
            className={`w-full h-full object-cover grayscale-[0.2] transition-all duration-500 ${!mobile ? "group-hover:grayscale-0" : ""}`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white font-bold"
               style={{fontSize: size * 0.25}}>
            {displayNameText[0]?.toUpperCase()}
          </div>
        )}
      </div>

      {!hideLevelBadge && (
        <div
          className="absolute bottom-0 left-0 z-30 flex items-center justify-center transition-transform duration-300"
          style={{
            width: size * 0.4,
            height: size * 0.4,
            transform: 'translate(-15%, 15%)',
            filter: `drop-shadow(0 4px 8px rgba(0,0,0,0.8))`
          }}
        >
          <div className="absolute inset-0 rounded-full bg-obsidian-soft border-2 border-glass-border-bright shadow-lg backdrop-blur-md"
               style={{ 
                 borderColor: isOnline ? "#22c55e" : config.colors[0],
                 boxShadow: !mobile ? `0 0 10px ${isOnline ? "rgba(34,197,94,0.4)" : config.glow}` : undefined
               }}
          />
          <span
            className="relative z-10 text-white font-black italic tracking-tighter"
            style={{fontSize: size * 0.16}}
          >
            {level}
          </span>
        </div>
      )}

      {user?.hasNotification && (
        <motion.div
          initial={!mobile ? {scale: 0} : {scale: 1}}
          animate={{scale: 1}}
          className="absolute -top-1 -right-1 w-4 h-4 bg-sunset rounded-full z-40 border-2 border-obsidian shadow-sunset"
          style={{width: size * 0.25, height: size * 0.25}}
        />
      )}
    </motion.div>
  );
});

UserBadge.displayName = "UserBadge";

export default UserBadge;
