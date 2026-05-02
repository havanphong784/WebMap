import React from 'react';

const Skeleton = ({ className, width, height, circle }) => {
  const formatValue = (val) => {
    if (typeof val === 'number') return `${val}px`;
    return val;
  };

  const style = {
    width: formatValue(width) || '100%',
    height: formatValue(height) || '1rem',
    borderRadius: circle ? '9999px' : undefined,
  };

  return (
    <div 
      className={`skeleton ${className || ''}`} 
      style={style}
    />
  );
};

export default Skeleton;
