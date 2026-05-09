import React, { useState, useEffect, useRef } from 'react';

/**
 * CodexAnimation - A component to render spritesheet animations
 * Specifically designed for EVE/Codex style pets.
 */
const CodexAnimation = ({ 
  spritesheetPath, 
  cols = 8, // Max columns in the sheet
  rows = 9, 
  frameRate = 120, 
  size = 128,
  className = "",
  activeRow = 0 
}) => {
  // Mapping of row index to its specific frame count
  const ROW_FRAME_COUNTS = {
    0: 6, // Hàng 1
    1: 8, // Hàng 2
    2: 8, // Hàng 3
    3: 4, // Hàng 4
    4: 5, // Hàng 5
    5: 8, // Hàng 6
    6: 6, // Hàng 7
    7: 6, // Hàng 8
    8: 6  // Hàng 9
  };

  const [currentFrame, setCurrentFrame] = useState(0);
  const framesInCurrentRow = ROW_FRAME_COUNTS[activeRow] || cols;

  useEffect(() => {
    // Reset frame to 0 when row changes to avoid index out of bounds
    setCurrentFrame(0);
  }, [activeRow]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentFrame(prev => (prev + 1) % framesInCurrentRow);
    }, frameRate);

    return () => clearInterval(timer);
  }, [framesInCurrentRow, frameRate]);

  return (
    <div 
      className={`overflow-hidden relative ${className}`}
      style={{ 
        width: `${size}px`, 
        height: `${size}px`,
        background: `url(${spritesheetPath})`,
        // Scaling must use the total grid size (8 cols x 9 rows)
        backgroundSize: `${cols * 100}% ${rows * 100}%`,
        backgroundPosition: `-${currentFrame * 100}% -${activeRow * 100}%`,
        imageRendering: 'pixelated'
      }}
    />
  );
};



export default CodexAnimation;
