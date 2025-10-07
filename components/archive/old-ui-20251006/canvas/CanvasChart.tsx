'use client';

import React, { useEffect, useRef, useState } from 'react';

type DrawFn = (ctx: CanvasRenderingContext2D, state: {
  width: number;
  height: number;
  dpr: number;
  panX: number;
  panY: number;
  scale: number;
  mouse?: { x: number; y: number } | null;
}) => void;

export interface CanvasChartProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: number;
  height?: number;
  draw: DrawFn;
  onHover?: (e: { x: number; y: number } | null) => void;
  enablePanZoom?: boolean;
}

export function CanvasChart({ width = 720, height = 320, draw, onHover, enablePanZoom = true, className, style }: CanvasChartProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [state, setState] = useState({ panX: 0, panY: 0, scale: 1 });
  const [mouse, setMouse] = useState<{ x: number; y: number } | null>(null);
  const dragging = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.translate(state.panX, state.panY);
    ctx.scale(state.scale, state.scale);
    draw(ctx, { width, height, dpr, panX: state.panX, panY: state.panY, scale: state.scale, mouse });
    ctx.restore();
  }, [width, height, state, draw, mouse]);

  useEffect(() => {
    const canvas = canvasRef.current!;
    if (!enablePanZoom) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const scaleDelta = e.deltaY > 0 ? 0.9 : 1.1;
      setState((s) => ({ ...s, scale: Math.max(0.2, Math.min(4, s.scale * scaleDelta)) }));
    };
    const onDown = (e: MouseEvent) => {
      dragging.current = true;
      last.current = { x: e.clientX, y: e.clientY };
    };
    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const m = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      setMouse(m);
      onHover?.(m);
      if (!dragging.current || !last.current) return;
      const dx = e.clientX - last.current.x;
      const dy = e.clientY - last.current.y;
      last.current = { x: e.clientX, y: e.clientY };
      setState((s) => ({ ...s, panX: s.panX + dx, panY: s.panY + dy }));
    };
    const onUp = () => {
      dragging.current = false;
      last.current = null;
    };
    canvas.addEventListener('wheel', onWheel, { passive: false });
    canvas.addEventListener('mousedown', onDown);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      canvas.removeEventListener('wheel', onWheel);
      canvas.removeEventListener('mousedown', onDown);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [enablePanZoom, onHover]);

  return (
    <div className={className} style={style}>
      <canvas ref={canvasRef} aria-label="canvas chart" />
    </div>
  );
}

