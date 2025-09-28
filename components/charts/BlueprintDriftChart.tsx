'use client';

import * as d3 from 'd3';
import { useEffect, useMemo, useRef } from 'react';
import type { AnalyticsSummary } from '../../lib/getAnalytics';
import blueprint from '../../config/blueprint.json';

export function BlueprintDriftChart({ analytics }: { analytics: AnalyticsSummary | null }) {
  const ref = useRef<SVGSVGElement | null>(null);

  const data = useMemo(() => {
    const weights: Record<string, number> = (blueprint as any).weights || {};
    const loAttempts: Record<string, number> = {};
    (analytics?.ttm_per_lo || []).forEach((d) => {
      loAttempts[d.lo_id] = d.attempts || 0;
    });
    const totalAttempts = Object.values(loAttempts).reduce((a, b) => a + b, 0) || 1;
    const loIds = Array.from(new Set([...Object.keys(weights), ...Object.keys(loAttempts)]));
    return loIds.map((id) => ({
      lo_id: id,
      target: (weights[id] ?? 0) * 100, // weights are proportions
      practice: (loAttempts[id] ? (loAttempts[id] / totalAttempts) * 100 : 0)
    }));
  }, [analytics]);

  useEffect(() => {
    const svg = d3.select(ref.current);
    svg.selectAll('*').remove();
    const width = Number(svg.attr('width')) || 720;
    const height = Number(svg.attr('height')) || 300;
    svg.attr('width', width).attr('height', height);
    const margin = { top: 10, right: 20, bottom: 60, left: 50 };
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const x0 = d3.scaleBand<string>().domain(data.map((d) => d.lo_id)).range([0, innerW]).padding(0.2);
    const x1 = d3.scaleBand<string>().domain(['target', 'practice']).range([0, x0.bandwidth()]).padding(0.08);
    const y = d3.scaleLinear().domain([0, 100]).nice().range([innerH, 0]);

    g.append('g').attr('transform', `translate(0,${innerH})`).call(d3.axisBottom(x0)).selectAll('text').attr('font-size', 10).attr('transform', 'rotate(-30)').style('text-anchor', 'end');
    g.append('g').call(d3.axisLeft(y).ticks(5)).selectAll('text').attr('font-size', 10);

    const color = d3.scaleOrdinal<string>().domain(['target', 'practice']).range(['#0ea5e9', '#22c55e']);

    const groups = g
      .selectAll('g.group')
      .data(data)
      .enter()
      .append('g')
      .attr('class', 'group')
      .attr('transform', (d) => `translate(${x0(d.lo_id)},0)`);

    groups
      .selectAll('rect')
      .data((d) => [
        { key: 'target', value: d.target },
        { key: 'practice', value: d.practice }
      ])
      .enter()
      .append('rect')
      .attr('x', (d) => x1(d.key)!)
      .attr('y', (d) => y(d.value))
      .attr('width', x1.bandwidth())
      .attr('height', (d) => innerH - y(d.value))
      .attr('fill', (d) => color(d.key) as string);

    // Legend
    const legend = svg.append('g').attr('transform', `translate(${margin.left},${height - 20})`);
    const items = [
      { key: 'target', label: 'Target % (blueprint)' },
      { key: 'practice', label: 'Practice % (observed)' }
    ];
    legend
      .selectAll('rect')
      .data(items)
      .enter()
      .append('rect')
      .attr('x', (_, i) => i * 180)
      .attr('y', -10)
      .attr('width', 12)
      .attr('height', 12)
      .attr('fill', (d) => color(d.key) as string);
    legend
      .selectAll('text')
      .data(items)
      .enter()
      .append('text')
      .attr('x', (_, i) => i * 180 + 18)
      .attr('y', 0)
      .attr('font-size', 12)
      .attr('fill', '#334155')
      .text((d) => d.label);
  }, [data]);

  return (
    <figure className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <figcaption className="mb-2 text-sm font-medium text-slate-700">Blueprint drift (target vs practice %)</figcaption>
      <svg ref={ref} width={720} height={320} role="img" aria-label="Blueprint drift chart" />
    </figure>
  );
}

