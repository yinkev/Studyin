'use client';

import * as d3 from 'd3';
import { useMemo, useState } from 'react';
import type { AnalyticsSummary } from '../../lib/getAnalytics';
import { CanvasChart } from './CanvasChart';
import { Tooltip } from './Tooltip';
import { cleanLabel, formatMinutes, truncate } from '../charts/chartUtils';

export function TTMBarCanvas({ analytics }: { analytics: AnalyticsSummary | null }) {
  const data = useMemo(
    () => (analytics?.ttm_per_lo || []).slice().sort((a, b) => d3.descending(a.projected_minutes_to_mastery, b.projected_minutes_to_mastery)),
    [analytics]
  );
  const [hover, setHover] = useState<{ x: number; y: number; text: string } | null>(null);

  const draw = (
    ctx: CanvasRenderingContext2D,
    s: { width: number; height: number; scale: number; panX: number; panY: number; mouse?: { x: number; y: number } | null }
  ) => {
    const { width, height } = s;
    ctx.save();
    ctx.clearRect(-s.panX / s.scale, -s.panY / s.scale, width / s.scale, height / s.scale);
    ctx.scale(1 / s.scale, 1 / s.scale);
    ctx.translate(-s.panX, -s.panY);

    // background grid
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(s.panX, s.panY, width, height);
    ctx.strokeStyle = 'rgba(148,163,184,0.25)';
    for (let x = s.panX % 40; x < width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, s.panY);
      ctx.lineTo(x, s.panY + height);
      ctx.stroke();
    }
    for (let y = s.panY % 40; y < height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(s.panX, y);
      ctx.lineTo(s.panX + width, y);
      ctx.stroke();
    }

    const margin = { top: 16, right: 24, bottom: 60, left: 180 };
    const W = width - margin.left - margin.right;
    const H = height - margin.top - margin.bottom;
    const x = d3.scaleLinear().domain([0, d3.max(data, (d) => d.projected_minutes_to_mastery) || 1]).nice().range([0, W]);
    const y = d3.scaleBand<string>().domain(data.map((d) => cleanLabel(d.lo_id))).range([0, H]).padding(0.2);

    ctx.translate(margin.left, margin.top);
    ctx.fillStyle = '#64748b';
    ctx.font = '12px "Inter", ui-sans-serif';
    // axis labels
    x.ticks(5).forEach((tick) => {
      const xx = x(tick);
      ctx.fillText(formatMinutes(Number(tick)), xx, H + 18);
      ctx.strokeStyle = 'rgba(148,163,184,0.25)';
      ctx.beginPath();
      ctx.moveTo(xx, 0);
      ctx.lineTo(xx, H);
      ctx.stroke();
    });

    data.forEach((d) => {
      const yy = y(cleanLabel(d.lo_id)) || 0;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(truncate(cleanLabel(d.lo_id), 24), -12, yy + y.bandwidth() / 2);
    });

    ctx.fillStyle = '#2563eb';
    data.forEach((d) => {
      const ww = x(d.projected_minutes_to_mastery);
      const yy = y(cleanLabel(d.lo_id)) || 0;
      ctx.beginPath();
      ctx.roundRect(0, yy, ww, y.bandwidth(), 10);
      ctx.fill();
    });

    if (s.mouse) {
      const mx = (s.mouse.x - margin.left - s.panX) / s.scale;
      const my = (s.mouse.y - margin.top - s.panY) / s.scale;
      let found: { x: number; y: number; text: string } | null = null;
      data.forEach((d) => {
        const yy = y(cleanLabel(d.lo_id)) || 0;
        const ww = x(d.projected_minutes_to_mastery);
        if (mx >= 0 && mx <= ww && my >= yy && my <= yy + y.bandwidth()) {
          found = {
            x: s.mouse!.x,
            y: s.mouse!.y,
            text: `${cleanLabel(d.lo_id)} • ${formatMinutes(d.projected_minutes_to_mastery)}`
          };
        }
      });
      setHover(found);
    }

    ctx.restore();
  };

  return (
    <div className="relative">
      <CanvasChart width={720} height={320} draw={draw} />
      {hover && <Tooltip x={hover.x} y={hover.y}>{hover.text}</Tooltip>}
    </div>
  );
}

