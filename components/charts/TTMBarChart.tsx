'use client';

import * as d3 from 'd3';
import { useEffect, useRef } from 'react';
import type { AnalyticsSummary } from '../../lib/getAnalytics';
import { ChartCard } from './ChartCard';
import { CHART_AXIS_COLOR, CHART_FONT, CHART_GRID_COLOR, CHART_PRIMARY, cleanLabel, formatMinutes, truncate } from './chartUtils';

export function TTMBarChart({ analytics }: { analytics: AnalyticsSummary | null }) {
  const ref = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    const svg = d3.select(ref.current);
    svg.selectAll('*').remove();

    const data = (analytics?.ttm_per_lo || [])
      .slice()
      .sort((a, b) => d3.descending(a.projected_minutes_to_mastery, b.projected_minutes_to_mastery));
    if (data.length === 0) {
      svg.append('text').text('No TTM data yet').attr('x', 12).attr('y', 20).attr('fill', CHART_AXIS_COLOR).attr('font', CHART_FONT);
      return;
    }

    const width = Number(svg.attr('width')) || 720;
    const height = Number(svg.attr('height')) || Math.max(220, data.length * 34 + 40);
    svg.attr('width', width).attr('height', height);

    const margin = { top: 12, right: 24, bottom: 40, left: 160 };
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    const x = d3.scaleLinear().domain([0, d3.max(data, (d) => d.projected_minutes_to_mastery) || 1]).nice().range([0, innerW]);
    const y = d3.scaleBand<string>().domain(data.map((d) => d.lo_id)).range([0, innerH]).padding(0.2);

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

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

    const axisBottom = d3.axisBottom(x).ticks(5).tickFormat((d) => formatMinutes(Number(d)));
    const axisLeft = d3
      .axisLeft(y)
      .tickFormat((d) => truncate(cleanLabel(String(d)), 22));

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
      .attr('x', 0)
      .attr('y', (d) => y(d.lo_id)!)
      .attr('width', (d) => x(d.projected_minutes_to_mastery))
      .attr('height', y.bandwidth())
      .attr('rx', 8)
      .attr('fill', CHART_PRIMARY);

    bars.append('title').text((d) =>
      `${cleanLabel(d.lo_id)} • ${formatMinutes(d.projected_minutes_to_mastery)} remaining · ${d.attempts} attempts · ${(d.current_accuracy * 100).toFixed(0)}% accuracy`
    );

    g.selectAll('text.value')
      .data(data)
      .enter()
      .append('text')
      .attr('x', (d) => x(d.projected_minutes_to_mastery) + 8)
      .attr('y', (d) => (y(d.lo_id)! + y.bandwidth() / 2))
      .attr('alignment-baseline', 'middle')
      .attr('font', CHART_FONT)
      .attr('fill', '#1f2937')
      .text((d) => formatMinutes(d.projected_minutes_to_mastery));
  }, [analytics]);

  return (
    <ChartCard
      title="Projected minutes to mastery"
      description="LOs ordered by remaining study time"
      helpText="Time-to-mastery (TTM) blends accuracy, spacing, and duration to prioritize learning objectives."
    >
      <svg ref={ref} width={720} height={280} role="img" aria-label="Projected minutes to mastery per LO" />
    </ChartCard>
  );
}

