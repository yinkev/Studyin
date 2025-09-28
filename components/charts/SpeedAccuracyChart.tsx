'use client';

import * as d3 from 'd3';
import { useEffect, useRef } from 'react';
import type { AnalyticsSummary } from '../../lib/getAnalytics';
import { ChartCard } from './ChartCard';
import { CHART_AXIS_COLOR, CHART_FONT, CHART_GRID_COLOR } from './chartUtils';

const labels = ['Fast · Wrong', 'Slow · Wrong', 'Fast · Right', 'Slow · Right'] as const;
const colors = ['#ef4444', '#f97316', '#22c55e', '#2563eb'];

export function SpeedAccuracyChart({ analytics }: { analytics: AnalyticsSummary | null }) {
  const ref = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    const svg = d3.select(ref.current);
    svg.selectAll('*').remove();
    const width = Number(svg.attr('width')) || 600;
    const height = Number(svg.attr('height')) || 260;
    svg.attr('width', width).attr('height', height);
    const margin = { top: 12, right: 16, bottom: 40, left: 40 };
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const sa = analytics?.speed_accuracy || { fast_wrong: 0, slow_wrong: 0, fast_right: 0, slow_right: 0 };
    const data = [
      { label: labels[0], value: sa.fast_wrong },
      { label: labels[1], value: sa.slow_wrong },
      { label: labels[2], value: sa.fast_right },
      { label: labels[3], value: sa.slow_right }
    ];
    const total = data.reduce((sum, entry) => sum + entry.value, 0);

    const yMax = d3.max(data, (d) => d.value) || 1;
    const x = d3.scaleBand().domain(labels as unknown as string[]).range([0, innerW]).padding(0.25);
    const y = d3.scaleLinear().domain([0, yMax]).nice().range([innerH, 0]);

    g.append('g')
      .attr('stroke', CHART_GRID_COLOR)
      .selectAll('line')
      .data(y.ticks(4))
      .enter()
      .append('line')
      .attr('x1', 0)
      .attr('x2', innerW)
      .attr('y1', (d) => y(d))
      .attr('y2', (d) => y(d));

    const axisBottom = d3.axisBottom(x).tickFormat((d) => String(d));
    const axisLeft = d3.axisLeft(y).ticks(4);

    g.append('g')
      .attr('transform', `translate(0,${innerH})`)
      .call(axisBottom)
      .call((g) => g.selectAll('text').attr('font', CHART_FONT).attr('fill', CHART_AXIS_COLOR))
      .call((g) => g.selectAll('path,line').attr('stroke', CHART_AXIS_COLOR));

    g.append('g')
      .call(axisLeft)
      .call((g) => g.selectAll('text').attr('font', CHART_FONT).attr('fill', CHART_AXIS_COLOR))
      .call((g) => g.selectAll('path,line').attr('stroke', CHART_AXIS_COLOR));

    const bars = g
      .selectAll('rect')
      .data(data)
      .enter()
      .append('rect')
      .attr('x', (d) => x(d.label)!)
      .attr('y', (d) => y(d.value))
      .attr('width', x.bandwidth())
      .attr('height', (d) => innerH - y(d.value))
      .attr('rx', 6)
      .attr('fill', (_, i) => colors[i]);

    bars.append('title').text((d) => {
      const pct = total > 0 ? ((d.value / total) * 100).toFixed(1) : '0.0';
      return `${d.label}: ${d.value} attempts (${pct}%)`;
    });

    g.selectAll('text.value')
      .data(data)
      .enter()
      .append('text')
      .attr('x', (d) => (x(d.label)! + x.bandwidth() / 2))
      .attr('y', (d) => y(d.value) - 8)
      .attr('text-anchor', 'middle')
      .attr('font', CHART_FONT)
      .attr('fill', '#1f2937')
      .text((d) => d.value);
  }, [analytics]);

  return (
    <ChartCard
      title="Speed × Accuracy"
      description="Distribution of attempts by tempo and correctness"
      helpText="Classifies attempts by response time (≤45s fast) and correctness to highlight speed-accuracy tradeoffs."
    >
      <svg ref={ref} width={600} height={280} role="img" aria-label="Speed and accuracy chart" />
    </ChartCard>
  );
}
