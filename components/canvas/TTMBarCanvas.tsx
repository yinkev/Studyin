'use client';

import * as d3 from 'd3';
import { useMemo, useState } from 'react';
import type { AnalyticsSummary } from '../../lib/getAnalytics';
import { CanvasChart } from './CanvasChart';
import { Tooltip } from './Tooltip';

export function TTMBarCanvas({ analytics }: { analytics: AnalyticsSummary | null }) {
  const data = useMemo(
    () => (analytics?.ttm_per_lo || []).slice().sort((a, b) => d3.descending(a.projected_minutes_to_mastery, b.projected_minutes_to_mastery)),
    [analytics]
  );
  const [hover, setHover] = useState<{ x: number; y: number; text: string } | null>(null);

  const draw = (ctx: CanvasRenderingContext2D, s: { width: number; height: number; scale: number; panX: number; panY: number; mouse?: { x: number; y: number } | null }) => {
    const { width, height } = s;
    ctx.clearRect(-s.panX / s.scale, -s.panY / s.scale, width / s.scale, height / s.scale);
    // chart area
    const margin = { top: 10, right: 16, bottom: 60, left: 160 };
    const W = (width - margin.left - margin.right) / s.scale;
    const H = (height - margin.top - margin.bottom) / s.scale;

    // scales
    const x = d3.scaleLinear().domain([0, d3.max(data, (d) => d.projected_minutes_to_mastery) || 1]).nice().range([0, W]);
    const y = d3.scaleBand<string>().domain(data.map((d) => d.lo_id)).range([0, H]).padding(0.15);

    // axes (minimal)
    ctx.save();
    ctx.translate(margin.left, margin.top);
    ctx.fillStyle = '#64748b';
    ctx.font = '10px ui-sans-serif, system-ui';
    // y labels
    data.forEach((d) => {
      const yy = (y(d.lo_id) || 0) + (y.bandwidth() / 2);
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(d.lo_id, -8, yy);
    });
    // x ticks
    const ticks = x.ticks(5);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ticks.forEach((t) => {
      const xx = x(t);
      ctx.fillText(String(t), xx, H + 6);
    });

    // bars
    ctx.fillStyle = '#0ea5e9';
    data.forEach((d) => {
      const ww = x(d.projected_minutes_to_mastery);
      const yy = y(d.lo_id) || 0;
      ctx.fillRect(0, yy, ww, y.bandwidth());
    });

    // hover detection in screen coords
    if (s.mouse) {
      const mx = (s.mouse.x - margin.left - s.panX) / s.scale;
      const my = (s.mouse.y - margin.top - s.panY) / s.scale;
      let found: { x: number; y: number; text: string } | null = null;
      data.forEach((d) => {
        const yy = y(d.lo_id) || 0;
        const ww = x(d.projected_minutes_to_mastery);
        if (mx >= 0 && mx <= ww && my >= yy && my <= yy + y.bandwidth()) {
          found = {
            x: s.mouse!.x,
            y: s.mouse!.y,
            text: `${d.lo_id}: ${d.projected_minutes_to_mastery} min`
          };
        }
      });
      setHover(found);
    }

    ctx.restore();
  };

  return (
    <div className="relative">
      <CanvasChart width={720} height={320} draw={draw} onHover={() => {}} />
      {hover && <Tooltip x={hover.x} y={hover.y}>{hover.text}</Tooltip>}
    </div>
  );
}

