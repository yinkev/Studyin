'use client';

import * as d3 from 'd3';
import { useEffect, useMemo, useRef } from 'react';
import type { AnalyticsSummary } from '../../lib/getAnalytics';
import { ChartCard } from './ChartCard';
import { CHART_AXIS_COLOR, CHART_FONT, CHART_GRID_COLOR, CHART_PRIMARY, CHART_SECONDARY, cleanLabel, truncate } from './chartUtils';

export function BlueprintDriftChart({ analytics, weights }: { analytics: AnalyticsSummary | null; weights: Record<string, number> }) {
  const ref = useRef<SVGSVGElement | null>(null);

  const data = useMemo(() => {
    const attempts: Record<string, number> = {};
    (analytics?.ttm_per_lo || []).forEach((d) => {
      attempts[d.lo_id] = d.attempts || 0;
    });
    const total = Object.values(attempts).reduce((a, b) => a + b, 0) || 1;
    const ids = Array.from(new Set([...Object.keys(weights), ...Object.keys(attempts)]));
    return ids.map((id) => ({
      lo_id: cleanLabel(id),
      target: (weights[id] ?? 0) * 100,
      practice: (attempts[id] ? (attempts[id] / total) * 100 : 0)
    }));
  }, [analytics, weights]);

  useEffect(() => {
    const svg = d3.select(ref.current);
    svg.selectAll('*').remove();
    const width = Number(svg.attr('width')) || 720;
    const height = Number(svg.attr('height')) || 300;
    svg.attr('width', width).attr('height', height);
    const margin = { top: 16, right: 24, bottom: 60, left: 60 };
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const x0 = d3.scaleBand<string>().domain(data.map((d) => d.lo_id)).range([0, innerW]).padding(0.2);
    const x1 = d3.scaleBand<string>().domain(['target', 'practice']).range([0, x0.bandwidth()]).padding(0.12);
    const y = d3.scaleLinear().domain([0, 100]).nice().range([innerH, 0]);

    g.append('g')
      .attr('stroke', CHART_GRID_COLOR)
      .selectAll('line')
      .data(y.ticks(5))
      .enter()
      .append('line')
      .attr('x1', 0)
      .attr('x2', innerW)
      .attr('y1', (d) => y(d))
      .attr('y2', (d) => y(d));

    const axisBottom = d3.axisBottom(x0).tickFormat((d) => truncate(String(d), 18));
    const axisLeft = d3.axisLeft(y).ticks(5).tickFormat((d) => `${d}%`);

    g.append('g')
      .attr('transform', `translate(0,${innerH})`)
      .call(axisBottom)
      .call((g) => g.selectAll('text').attr('font', CHART_FONT).attr('fill', CHART_AXIS_COLOR).attr('transform', 'rotate(-25)').style('text-anchor', 'end'))
      .call((g) => g.selectAll('path,line').attr('stroke', CHART_AXIS_COLOR));

    g.append('g')
      .call(axisLeft)
      .call((g) => g.selectAll('text').attr('font', CHART_FONT).attr('fill', CHART_AXIS_COLOR))
      .call((g) => g.selectAll('path,line').attr('stroke', CHART_AXIS_COLOR));

    const color = (key: string) => (key === 'target' ? CHART_SECONDARY : CHART_PRIMARY);

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
      .attr('rx', 6)
      .attr('fill', (d) => color(d.key));

    groups
      .selectAll('text.value')
      .data((d) => [
        { key: 'target', value: d.target },
        { key: 'practice', value: d.practice }
      ])
      .enter()
      .append('text')
      .attr('x', (d) => x1(d.key)! + x1.bandwidth() / 2)
      .attr('y', (d) => y(d.value) - 6)
      .attr('text-anchor', 'middle')
      .attr('font', CHART_FONT)
      .attr('fill', '#1f2937')
      .text((d) => `${d.value.toFixed(0)}%`);

    const legend = svg.append('g').attr('transform', `translate(${margin.left},${height - 18})`);
    const legendItems = [
      { key: 'target', label: 'Target % (blueprint)' },
      { key: 'practice', label: 'Practice % (observed)' }
    ];
    legend
      .selectAll('g')
      .data(legendItems)
      .enter()
      .append('g')
      .attr('transform', (_, i) => `translate(${i * 200},0)`)
      .each(function (d) {
        const group = d3.select(this);
        group.append('rect').attr('width', 12).attr('height', 12).attr('fill', color(d.key));
        group
          .append('text')
          .attr('x', 16)
          .attr('y', 10)
          .attr('font', CHART_FONT)
          .attr('fill', '#334155')
          .text(d.label);
      });
  }, [data]);

  return (
    <ChartCard title="Blueprint drift" description="Compare target LO mix against observed practice">
      <svg ref={ref} width={720} height={320} role="img" aria-label="Blueprint drift chart" />
    </ChartCard>
  );
}

