'use client';

import * as d3 from 'd3';
import { useEffect, useRef } from 'react';
import type { AnalyticsSummary } from '../../lib/getAnalytics';

export function TTMBarChart({ analytics }: { analytics: AnalyticsSummary | null }) {
  const ref = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    const svg = d3.select(ref.current);
    svg.selectAll('*').remove();

    const data = (analytics?.ttm_per_lo || []).slice().sort((a, b) => d3.descending(a.projected_minutes_to_mastery, b.projected_minutes_to_mastery));
    if (data.length === 0) {
      svg.append('text').text('No TTM data').attr('x', 8).attr('y', 16).attr('fill', '#64748b');
      return;
    }

    const width = Number(svg.attr('width')) || 600;
    const height = Number(svg.attr('height')) || Math.max(160, data.length * 28 + 30);
    svg.attr('width', width).attr('height', height);

    const margin = { top: 10, right: 20, bottom: 24, left: 140 };
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    const x = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.projected_minutes_to_mastery)!])
      .nice()
      .range([0, innerW]);

    const y = d3
      .scaleBand<string>()
      .domain(data.map((d) => d.lo_id))
      .range([0, innerH])
      .padding(0.15);

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    g.append('g')
      .attr('transform', `translate(0,${innerH})`)
      .call(d3.axisBottom(x).ticks(5))
      .selectAll('text')
      .attr('font-size', 10);

    g.append('g')
      .call(d3.axisLeft(y))
      .selectAll('text')
      .attr('font-size', 11)
      .attr('fill', '#0f172a');

    g.selectAll('rect')
      .data(data)
      .enter()
      .append('rect')
      .attr('x', 0)
      .attr('y', (d) => y(d.lo_id)!)
      .attr('width', (d) => x(d.projected_minutes_to_mastery))
      .attr('height', y.bandwidth())
      .attr('fill', '#0ea5e9');

    g.selectAll('text.value')
      .data(data)
      .enter()
      .append('text')
      .attr('class', 'value')
      .attr('x', (d) => x(d.projected_minutes_to_mastery) + 6)
      .attr('y', (d) => (y(d.lo_id)! + y.bandwidth() / 2))
      .attr('alignment-baseline', 'middle')
      .attr('font-size', 11)
      .attr('fill', '#475569')
      .text((d) => `${d.projected_minutes_to_mastery}m`);
  }, [analytics]);

  return (
    <figure className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <figcaption className="mb-2 text-sm font-medium text-slate-700">Projected minutes to mastery per LO</figcaption>
      <svg ref={ref} width={720} height={260} role="img" aria-label="Projected minutes to mastery per LO" />
    </figure>
  );
}

