import React, { useEffect, useState, useRef } from 'react';
import { isMobile } from '../../../shared/utils/deviceUtils.js';

const ChatbotAnimation = ({
  spritesheetPath,
  cols = 8,
  rows = 9,
  frameRate = 120,
  size = 128,
  className = "",
  activeRow = 0
}) => {
  const ROW_FRAME_COUNTS = {
    0: 6, 1: 8, 2: 8, 3: 4, 4: 5, 5: 8, 6: 6, 7: 6, 8: 6
  };

  const [currentFrame, setCurrentFrame] = useState(0);
  const framesInCurrentRow = ROW_FRAME_COUNTS[activeRow] || cols;
  const requestRef = useRef();
  const previousTimeRef = useRef();
  const mobile = useRef(isMobile());

  useEffect(() => {
    setCurrentFrame(0);
  }, [activeRow]);

  const animate = time => {
    if (previousTimeRef.current !== undefined) {
      const deltaTime = time - previousTimeRef.current;
      // Nếu là mobile, chúng ta có thể làm chậm animation hơn để tiết kiệm pin/CPU
      const targetRate = mobile.current ? frameRate * 1.5 : frameRate;
      
      if (deltaTime >= targetRate) {
        setCurrentFrame(prev => (prev + 1) % framesInCurrentRow);
        previousTimeRef.current = time;
      }
    } else {
      previousTimeRef.current = time;
    }
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, [framesInCurrentRow, frameRate]);

  return (
    <div
      className={`overflow-hidden relative ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        background: `url(${spritesheetPath})`,
        backgroundSize: `${cols * 100}% ${rows * 100}%`,
        backgroundPosition: `-${currentFrame * 100}% -${activeRow * 100}%`,
        imageRendering: mobile.current ? 'auto' : 'pixelated'
      }}
    />
  );
};

export default ChatbotAnimation;
