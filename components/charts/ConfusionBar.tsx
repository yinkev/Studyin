'use client';

import * as d3 from 'd3';
import { useEffect, useRef } from 'react';
import type { AnalyticsSummary } from '../../lib/getAnalytics';

export function ConfusionBar({ analytics, top = 8 }: { analytics: AnalyticsSummary | null; top?: number }) {
  const ref = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    const svg = d3.select(ref.current);
    svg.selectAll('*').remove();
    const width = Number(svg.attr('width')) || 720;
    const height = Number(svg.attr('height')) || 260;
    svg.attr('width', width).attr('height', height);
    const margin = { top: 10, right: 10, bottom: 20, left: 220 };
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const edges = (analytics?.confusion_edges ?? [])
      .slice()
      .sort((a, b) => d3.descending(a.count, b.count))
      .slice(0, top);

    if (edges.length === 0) {
      g.append('text').text('No confusion data yet').attr('x', 8).attr('y', 16).attr('fill', '#64748b');
      return;
    }

    const labels = edges.map((e) => `${e.lo_id} · ${e.item_id} · ${e.choice}`);
    const x = d3.scaleLinear().domain([0, d3.max(edges, (d) => d.count)!]).nice().range([0, innerW]);
    const y = d3.scaleBand<string>().domain(labels).range([0, innerH]).padding(0.15);

    g.append('g').attr('transform', `translate(0,${innerH})`).call(d3.axisBottom(x).ticks(5)).selectAll('text').attr('font-size', 10);
    g.append('g').call(d3.axisLeft(y)).selectAll('text').attr('font-size', 10).attr('fill', '#0f172a');

    g.selectAll('rect')
      .data(edges)
      .enter()
      .append('rect')
      .attr('x', 0)
      .attr('y', (d) => y(`${d.lo_id} · ${d.item_id} · ${d.choice}`)!)
      .attr('width', (d) => x(d.count))
      .attr('height', y.bandwidth())
      .attr('fill', '#f59e0b');

    g.selectAll('text.value')
      .data(edges)
      .enter()
      .append('text')
      .attr('class', 'value')
      .attr('x', (d) => x(d.count) + 6)
      .attr('y', (d) => (y(`${d.lo_id} · ${d.item_id} · ${d.choice}`)! + y.bandwidth() / 2))
      .attr('alignment-baseline', 'middle')
      .attr('font-size', 11)
      .attr('fill', '#475569')
      .text((d) => d.count);
  }, [analytics, top]);

  return (
    <figure className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <figcaption className="mb-2 text-sm font-medium text-slate-700">Top confusion edges</figcaption>
      <svg ref={ref} width={720} height={260} role="img" aria-label="Top confusion edges" />
    </figure>
  );
}

