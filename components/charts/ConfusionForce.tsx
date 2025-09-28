'use client';

import * as d3 from 'd3';
import { useEffect, useMemo, useRef } from 'react';
import type { AnalyticsSummary } from '../../lib/getAnalytics';
import { ChartCard } from './ChartCard';
import { cleanLabel, truncate } from './chartUtils';

type NodeDatum = { id: string; label: string; type: 'lo' | 'choice'; degree: number } & d3.SimulationNodeDatum;
type LinkDatum = { source: string; target: string; value: number } & d3.SimulationLinkDatum<NodeDatum>;

export function ConfusionForce({ analytics, width = 680, height = 340 }: { analytics: AnalyticsSummary | null; width?: number; height?: number }) {
  const ref = useRef<SVGSVGElement | null>(null);

  const { nodes, links } = useMemo(() => {
    const edges = (analytics?.confusion_edges ?? []).slice(0, 150);
    const nodeMap = new Map<string, NodeDatum>();
    const linkList: LinkDatum[] = [];
    for (const e of edges) {
      const loId = `lo:${e.lo_id}`;
      const choiceId = `ch:${e.item_id}:${e.choice}`;
      if (!nodeMap.has(loId)) nodeMap.set(loId, { id: loId, label: cleanLabel(e.lo_id), type: 'lo', degree: 0 });
      if (!nodeMap.has(choiceId)) nodeMap.set(choiceId, { id: choiceId, label: `${cleanLabel(e.item_id)} • ${e.choice}`, type: 'choice', degree: 0 });
      (nodeMap.get(loId)!.degree += e.count);
      (nodeMap.get(choiceId)!.degree += e.count);
      linkList.push({ source: loId, target: choiceId, value: e.count });
    }
    return { nodes: Array.from(nodeMap.values()), links: linkList };
  }, [analytics]);

  useEffect(() => {
    const svg = d3.select(ref.current);
    svg.selectAll('*').remove();
    svg.attr('width', width).attr('height', height);

    const g = svg.append('g');
    svg.call(
      d3.zoom<SVGSVGElement, unknown>().scaleExtent([0.7, 2]).on('zoom', (event) => {
        g.attr('transform', String(event.transform));
      })
    );

    if (nodes.length === 0) {
      svg.append('text').text('No confusion edges yet').attr('x', 16).attr('y', 20).attr('fill', '#64748b');
      return;
    }

    const sim = d3
      .forceSimulation<NodeDatum>(nodes)
      .force('link', d3.forceLink<NodeDatum, LinkDatum>(links).id((d) => d.id).distance(80).strength((l) => Math.min(1, (l.value || 1) / 3)))
      .force('charge', d3.forceManyBody<NodeDatum>().strength(-160))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide<NodeDatum>().radius((d) => 14 + Math.min(30, d.degree)));

    sim.stop();
    for (let i = 0; i < 260; i++) sim.tick();

    const linkScale = d3.scaleLinear().domain([0, d3.max(links, (l) => l.value || 0) || 1]).range([1, 6]);
    const nodeScale = d3.scaleSqrt().domain([1, d3.max(nodes, (n) => n.degree) || 1]).range([6, 26]);

    g.append('g')
      .selectAll('line')
      .data(links)
      .enter()
      .append('line')
      .attr('x1', (d) => (d.source as NodeDatum).x || 0)
      .attr('y1', (d) => (d.source as NodeDatum).y || 0)
      .attr('x2', (d) => (d.target as NodeDatum).x || 0)
      .attr('y2', (d) => (d.target as NodeDatum).y || 0)
      .attr('stroke', 'rgba(148,163,184,0.45)')
      .attr('stroke-width', (d) => linkScale(d.value || 0));

    const nodeGroup = g
      .append('g')
      .selectAll('g')
      .data(nodes)
      .enter()
      .append('g')
      .attr('transform', (d) => `translate(${d.x || 0},${d.y || 0})`);

    nodeGroup
      .append('circle')
      .attr('r', (d) => nodeScale(d.degree))
      .attr('fill', (d) => (d.type === 'lo' ? '#2563eb' : '#fb923c'))
      .attr('stroke', '#0f172a')
      .attr('stroke-width', 0.6)
      .append('title')
      .text((d) => `${d.label}\nDegree: ${d.degree}`);

    nodeGroup
      .append('text')
      .attr('y', (d) => nodeScale(d.degree) + 14)
      .attr('text-anchor', 'middle')
      .attr('font-size', 11)
      .attr('fill', '#334155')
      .text((d) => truncate(d.label, 26));
  }, [nodes, links, width, height]);

  return (
    <ChartCard
      title="Confusion graph"
      description="LO nodes connect to distractors; width ~ count"
      helpText="Force-directed view of LO-to-distractor errors. Drag to inspect clusters; edge width scales with miss frequency."
      className="bg-white"
    >
      <svg ref={ref} width={width} height={height} role="img" aria-label="Confusion graph" />
    </ChartCard>
  );
}

