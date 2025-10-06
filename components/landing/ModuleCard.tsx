'use client';

/**
 * 3D Tilt Module Card
 * Responds to mouse movement with perspective transform
 * MAX GRAPHICS MODE!
 */

import { useRef, useState } from 'react';
import Link from 'next/link';

interface ModuleCardProps {
  icon: string;
  title: string;
  description: string;
  progress: number;
  href: string;
  gradient: string;
}

export function ModuleCard({ icon, title, description, progress, href, gradient }: ModuleCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const tiltX = ((y - centerY) / centerY) * -10; // -10 to 10 degrees
    const tiltY = ((x - centerX) / centerX) * 10;

    setTilt({ x: tiltX, y: tiltY });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  return (
    <Link href={href}>
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="glow-card p-8 group cursor-pointer relative overflow-hidden"
        style={{
          transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
          transition: 'transform 0.2s ease-out, box-shadow 0.3s ease'
        }}
      >
        {/* Gradient overlay */}
        <div
          className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity"
          style={{ background: gradient }}
        />

        {/* Icon */}
        <div
          className="w-20 h-20 mx-auto mb-6 flex items-center justify-center text-5xl rounded-3xl relative z-10 transform group-hover:scale-110 transition-transform"
          style={{
            background: gradient,
            boxShadow: `0 8px 24px ${gradient.match(/#\w{6}/)?.[0] || '#000'}40`
          }}
        >
          {icon}
        </div>

        {/* Content */}
        <div className="relative z-10">
          <h3 className="text-2xl font-bold mb-3 text-center text-white group-hover:gradient-text transition-all">
            {title}
          </h3>

          <p className="text-sm text-slate-300 mb-6 text-center leading-relaxed">
            {description}
          </p>

          {/* Progress bar */}
          <div className="space-y-2 mb-6">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Progress</span>
              <span className="font-bold" style={{ color: gradient.match(/#\w{6}/)?.[0] || '#58CC02' }}>
                {progress}%
              </span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
              <div
                className="h-2 rounded-full transition-all duration-500"
                style={{
                  width: `${progress}%`,
                  background: gradient
                }}
              />
            </div>
          </div>

          {/* CTA */}
          <div
            className="w-full py-3 rounded-2xl text-center font-bold text-white transition-all transform group-hover:scale-105"
            style={{ background: gradient }}
          >
            Continue Learning →
          </div>
        </div>

        {/* Shimmer effect */}
        <div className="absolute inset-0 shimmer pointer-events-none" />
      </div>
    </Link>
  );
}
