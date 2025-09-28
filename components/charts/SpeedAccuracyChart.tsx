'use client';

import * as d3 from 'd3';
import { useEffect, useRef } from 'react';
import type { AnalyticsSummary } from '../../lib/getAnalytics';

export function SpeedAccuracyChart({ analytics }: { analytics: AnalyticsSummary | null }) {
  const ref = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    const svg = d3.select(ref.current);
    svg.selectAll('*').remove();
    const width = Number(svg.attr('width')) || 360;
    const height = Number(svg.attr('height')) || 240;
    svg.attr('width', width).attr('height', height);
    const margin = { top: 10, right: 10, bottom: 20, left: 30 };
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const sa = analytics?.speed_accuracy || { fast_wrong: 0, slow_wrong: 0, fast_right: 0, slow_right: 0 };
    const data = [
      { label: 'Fast · Wrong', value: sa.fast_wrong },
      { label: 'Slow · Wrong', value: sa.slow_wrong },
      { label: 'Fast · Right', value: sa.fast_right },
      { label: 'Slow · Right', value: sa.slow_right }
    ];

    const x = d3.scaleBand().domain(data.map((d) => d.label)).range([0, innerW]).padding(0.25);
    const y = d3.scaleLinear().domain([0, d3.max(data, (d) => d.value)!]).nice().range([innerH, 0]);

    g.append('g').attr('transform', `translate(0,${innerH})`).call(d3.axisBottom(x)).selectAll('text').attr('font-size', 10);
    g.append('g').call(d3.axisLeft(y).ticks(4)).selectAll('text').attr('font-size', 10);

    const color = d3.scaleOrdinal<string>().domain(data.map((d) => d.label)).range(['#ef4444', '#f59e0b', '#10b981', '#3b82f6']);

    g.selectAll('rect')
      .data(data)
      .enter()
      .append('rect')
      .attr('x', (d) => x(d.label)!)
      .attr('y', (d) => y(d.value))
      .attr('width', x.bandwidth())
      .attr('height', (d) => innerH - y(d.value))
      .attr('fill', (d) => color(d.label) as string);

    g.selectAll('text.value')
      .data(data)
      .enter()
      .append('text')
      .attr('class', 'value')
      .attr('x', (d) => (x(d.label)! + x.bandwidth() / 2))
      .attr('y', (d) => y(d.value) - 4)
      .attr('text-anchor', 'middle')
      .attr('font-size', 11)
      .attr('fill', '#475569')
      .text((d) => d.value);
  }, [analytics]);

  return (
    <figure className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <figcaption className="mb-2 text-sm font-medium text-slate-700">Speed × Accuracy buckets</figcaption>
      <svg ref={ref} width={600} height={260} role="img" aria-label="Speed and accuracy chart" />
    </figure>
  );
}

