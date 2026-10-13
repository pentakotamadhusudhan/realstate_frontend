import React from 'react';
import './box-loader.css';

export interface BoxLoaderProps {
  className?: string;
  size?: number;
  color?: 'brand' | 'white' | 'dark';
}

export const BoxLoader: React.FC<BoxLoaderProps> = ({
  className = '',
  size = 32,
  color = 'brand',
}) => {
  const colorClass =
    color === 'white'
      ? 'box-monochrome'
      : color === 'dark'
      ? 'box-dark'
      : '';

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={
        {
          '--size': `${size}px`,
        } as React.CSSProperties
      }
    >
      <div className={`boxes ${colorClass}`.trim()}>
        <div className="box box-1">
          <div className="face face-front" />
          <div className="face face-right" />
          <div className="face face-top" />
          <div className="face face-back" />
        </div>
        <div className="box box-2">
          <div className="face face-front" />
          <div className="face face-right" />
          <div className="face face-top" />
          <div className="face face-back" />
        </div>
        <div className="box box-3">
          <div className="face face-front" />
          <div className="face face-right" />
          <div className="face face-top" />
          <div className="face face-back" />
        </div>
        <div className="box box-4">
          <div className="face face-front" />
          <div className="face face-right" />
          <div className="face face-top" />
          <div className="face face-back" />
        </div>
      </div>
    </div>
  );
};

export default BoxLoader;
