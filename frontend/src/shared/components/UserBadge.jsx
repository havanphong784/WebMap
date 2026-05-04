import React from 'react';

const TIER_CONFIG = {
  'Scout': {
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
  'Master of Aether': {
    colors: ['#4285F4', '#9b72cb', '#d96570', '#1a73e8'], // Gemini Spectral Colors
    glow: 'rgba(155, 114, 203, 0.7)',
    animate: true,
    isGemini: true
  }
};

const UserBadge = ({ user, size = 64 }) => {
  const { xp = 0, avatar_url, name } = user;
  
  // Calculate level directly from XP
  const level = Math.floor(Math.sqrt(xp / 10)) + 1;
  
  // Calculate tier directly from level
  let tier = 'Scout';
  if (level >= 50) tier = 'Master of Aether';
  else if (level >= 25) tier = 'Pathfinder';
  else if (level >= 10) tier = 'Explorer';
  
  const config = TIER_CONFIG[tier] || TIER_CONFIG['Scout'];
  const strokeWidth = size * 0.08;
  const radius = (size - strokeWidth) / 2;

  // Extra padding for glow to prevent clipping
  const bleed = size * 0.15;
  const svgSize = size + bleed * 2;

  return (
    <div className="relative inline-block group" style={{ width: size, height: size }}>
      {/* Dynamic Animated Glow (Background) */}
      {config.animate && (
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

      {/* SVG Ring System */}
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
              <stop key={i} offset={`${(i / (config.colors.length - 1)) * 100}%`} stopColor={color} />
            ))}
          </linearGradient>
          
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation={size * 0.04} result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        <g transform={`translate(${bleed}, ${bleed})`}>
          {/* Background Track (Subtle) */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth={strokeWidth}
          />

          {/* Main Spectral Ring (Full Circle) */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={`url(#grad-${tier.replace(/\s+/g, '-')})`}
            strokeWidth={strokeWidth}
            filter="url(#glow)"
            style={{ 
              transition: 'stroke 0.5s ease',
            }}
          />

          {/* Gemini Pulse */}
          {config.isGemini && (
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="white"
              strokeWidth={strokeWidth * 0.2}
              className="animate-pulse opacity-30"
            />
          )}
        </g>
      </svg>

      {/* Avatar Container with Inner Glow */}
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
        {avatar_url ? (
          <img 
            src={avatar_url} 
            alt={name} 
            className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-500" 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white font-bold" style={{ fontSize: size * 0.25 }}>
            {name?.[0]?.toUpperCase()}
          </div>
        )}
      </div>

      {/* Level Hex Badge - Gaming Style */}
      <div
        className="absolute -bottom-0.5 -right-0.5 z-30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
        style={{
          width: size * 0.32,
          height: size * 0.28,
          filter: `drop-shadow(0 2px 3px rgba(0,0,0,0.5))`
        }}
      >
        <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full">
          <path
            d="M50 5 L95 27.5 L95 72.5 L50 95 L5 72.5 L5 27.5 Z"
            fill="#0A0A0A"
            stroke={config.colors[0]}
            strokeWidth="10"
            className={config.animate ? "animate-pulse" : ""}
            style={{ 
              filter: `drop-shadow(0 0 5px ${config.glow})`,
              strokeOpacity: 0.9
            }}
          />
        </svg>
        <span 
          className="relative z-10 text-white font-black italic tracking-tighter" 
          style={{ fontSize: size * 0.12 }}
        >
          {level}
        </span>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}} />
    </div>
  );
};

export default UserBadge;
