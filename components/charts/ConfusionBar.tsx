'use client';

import * as d3 from 'd3';
import { useEffect, useRef } from 'react';
import type { AnalyticsSummary } from '../../lib/getAnalytics';
import { ChartCard } from './ChartCard';
import { CHART_AXIS_COLOR, CHART_FONT, CHART_GRID_COLOR, CHART_WARNING, cleanLabel, truncate } from './chartUtils';

export function ConfusionBar({ analytics, top = 8 }: { analytics: AnalyticsSummary | null; top?: number }) {
  const ref = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    const svg = d3.select(ref.current);
    svg.selectAll('*').remove();
    const width = Number(svg.attr('width')) || 720;
    const height = Number(svg.attr('height')) || 260;
    svg.attr('width', width).attr('height', height);
    const margin = { top: 12, right: 24, bottom: 32, left: 220 };
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const edges = (analytics?.confusion_edges ?? [])
      .slice()
      .sort((a, b) => d3.descending(a.count, b.count))
      .slice(0, top);

    if (edges.length === 0) {
      g.append('text').text('No confusion data yet').attr('x', 8).attr('y', 16).attr('fill', CHART_AXIS_COLOR).attr('font', CHART_FONT);
      return;
    }

    const labels = edges.map((e) => `${cleanLabel(e.lo_id)} · ${cleanLabel(e.item_id)} · ${e.choice}`);
    const x = d3.scaleLinear().domain([0, d3.max(edges, (d) => d.count) || 1]).nice().range([0, innerW]);
    const y = d3.scaleBand<string>().domain(labels).range([0, innerH]).padding(0.2);

    g.append('g')
      .attr('stroke', CHART_GRID_COLOR)
      .selectAll('line')
      .data(x.ticks(5))
      .enter()
      .append('line')
      .attr('x1', (d) => x(d))
      .attr('x2', (d) => x(d))
      .attr('y1', 0)
      .attr('y2', innerH);

    const axisBottom = d3.axisBottom(x).ticks(5);
    const axisLeft = d3.axisLeft(y).tickFormat((d) => truncate(String(d), 32));

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
      .data(edges)
      .enter()
      .append('rect')
      .attr('x', 0)
      .attr('y', (_, i) => y(labels[i])!)
      .attr('width', (d) => x(d.count))
      .attr('height', y.bandwidth())
      .attr('rx', 6)
      .attr('fill', CHART_WARNING);

    bars.append('title').text((d) => `${cleanLabel(d.lo_id)} · ${cleanLabel(d.item_id)} · choice ${d.choice} — ${d.count} misses`);

    g.selectAll('text.value')
      .data(edges)
      .enter()
      .append('text')
      .attr('x', (d) => x(d.count) + 8)
      .attr('y', (_, i) => (y(labels[i])! + y.bandwidth() / 2))
      .attr('alignment-baseline', 'middle')
      .attr('font', CHART_FONT)
      .attr('fill', '#1f2937')
      .text((d) => d.count);
  }, [analytics, top]);

  return (
    <ChartCard
      title="Top confusion edges"
      description="Most common incorrect choice clusters"
      helpText="Identifies LO × item × distractor combinations with the highest miss counts to guide remediation."
    >
      <svg ref={ref} width={720} height={260} role="img" aria-label="Top confusion edges" />
    </ChartCard>
  );
}

