'use client';

import React from 'react';

interface MascotProps {
  className?: string;
  status?: 'default' | 'happy' | 'sad';
}

// A simple, cute, and animatable SVG mascot named 'Sparky'.
const Mascot: React.FC<MascotProps> = ({ className, status = 'default' }) => {
  const bodyColor = status === 'happy' ? '#48BB78' : status === 'sad' ? '#F56565' : '#4299E1';
  const pupilY = status === 'sad' ? 73 : 70;

  return (
    <svg
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Shadow */}
      <ellipse cx="50" cy="95" rx="30" ry="5" fill="rgba(0,0,0,0.1)" />

      {/* Body */}
      <g id="mascot-body">
        <path 
          d="M 20,90 C 20,60 80,60 80,90 Z" 
          fill={bodyColor}
          className="transition-colors duration-300 ease-in-out"
        />
      </g>

      {/* Eyes */}
      <g id="mascot-eyes">
        <circle cx="40" cy="70" r="5" fill="white" />
        <circle cx="60" cy="70" r="5" fill="white" />
        <circle id="left-pupil" cx="40" cy={pupilY} r="2" fill="black" />
        <circle id="right-pupil" cx="60" cy={pupilY} r="2" fill="black" />
      </g>

      {/* Antenna */}
      <g id="mascot-antenna">
        <line x1="50" y1="60" x2="50" y2="40" stroke="#2B6CB0" strokeWidth="2" />
        <circle cx="50" cy="35" r="5" fill="#FBBF24" />
        {/* Spark */}
        <path d="M 50 30 L 48 25 L 52 25 Z" fill="#FBBF24" />
      </g>
    </svg>
  );
};

export default Mascot;
