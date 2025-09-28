'use client';

import * as d3 from 'd3';
import { useEffect, useMemo, useRef } from 'react';
import type { AnalyticsSummary } from '../../lib/getAnalytics';

type NodeDatum = { id: string; type: 'lo' | 'choice'; degree: number } & d3.SimulationNodeDatum;
type LinkDatum = { source: string; target: string; value: number } & d3.SimulationLinkDatum<NodeDatum>;

export function ConfusionForce({ analytics, width = 720, height = 380 }: { analytics: AnalyticsSummary | null; width?: number; height?: number }) {
  const ref = useRef<SVGSVGElement | null>(null);

  const { nodes, links } = useMemo(() => {
    const edges = (analytics?.confusion_edges ?? []).slice(0, 200); // cap for perf
    const nodeMap = new Map<string, NodeDatum>();
    const linkList: LinkDatum[] = [];
    for (const e of edges) {
      const loId = `lo:${e.lo_id}`;
      const choiceId = `ch:${e.item_id}:${e.choice}`;
      if (!nodeMap.has(loId)) nodeMap.set(loId, { id: loId, type: 'lo', degree: 0, x: undefined, y: undefined });
      if (!nodeMap.has(choiceId)) nodeMap.set(choiceId, { id: choiceId, type: 'choice', degree: 0, x: undefined, y: undefined });
      const link: LinkDatum = { source: loId, target: choiceId, value: e.count };
      (nodeMap.get(loId)!.degree as number) += e.count;
      (nodeMap.get(choiceId)!.degree as number) += e.count;
      linkList.push(link);
    }
    return { nodes: Array.from(nodeMap.values()), links: linkList };
  }, [analytics]);

  useEffect(() => {
    const svg = d3.select(ref.current);
    svg.selectAll('*').remove();
    svg.attr('width', width).attr('height', height);

    const g = svg.append('g');

    // Zoom / pan
    svg.call(
      d3.zoom<SVGSVGElement, unknown>().scaleExtent([0.5, 2]).on('zoom', (event) => {
        g.attr('transform', String(event.transform));
      })
    );

    if (nodes.length === 0) {
      svg.append('text').text('No confusion edges yet').attr('x', 12).attr('y', 20).attr('fill', '#64748b');
      return;
    }

    const sim = d3
      .forceSimulation<NodeDatum>(nodes)
      .force('link',
        d3
          .forceLink<NodeDatum, LinkDatum>(links)
          .id((d) => d.id)
          .distance((l) => 50 + Math.max(0, 150 - (l.value || 0) * 10))
          .strength((l) => Math.min(1, (l.value || 1) / 5))
      )
      .force('charge', d3.forceManyBody<NodeDatum>().strength(-80))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide<NodeDatum>().radius((d) => 10 + Math.min(30, (d.degree || 1))))
      .stop();

    for (let i = 0; i < 200; i++) sim.tick(); // precompute for static render

    const linkScale = d3.scaleLinear().domain([0, d3.max(links, (l) => l.value || 0) || 1]).range([0.5, 4]);
    const nodeScale = d3.scaleSqrt().domain([1, d3.max(nodes, (n) => n.degree || 1) || 1]).range([4, 18]);

    // Links
    g.append('g')
      .attr('stroke', '#cbd5e1')
      .attr('stroke-opacity', 0.9)
      .selectAll('line')
      .data(links)
      .enter()
      .append('line')
      .attr('x1', (d) => (d.source as NodeDatum).x!)
      .attr('y1', (d) => (d.source as NodeDatum).y!)
      .attr('x2', (d) => (d.target as NodeDatum).x!)
      .attr('y2', (d) => (d.target as NodeDatum).y!)
      .attr('stroke-width', (d) => linkScale(d.value || 0));

    // Nodes
    const nodeGroup = g
      .append('g')
      .selectAll('circle')
      .data(nodes)
      .enter()
      .append('g')
      .attr('transform', (d) => `translate(${d.x},${d.y})`);

    nodeGroup
      .append('circle')
      .attr('r', (d) => nodeScale(d.degree || 1))
      .attr('fill', (d) => (d.type === 'lo' ? '#0ea5e9' : '#f59e0b'))
      .attr('stroke', '#0f172a')
      .attr('stroke-width', 0.5)
      .append('title')
      .text((d) => d.id);

    nodeGroup
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('y', (d) => (nodeScale(d.degree || 1) as number) + 12)
      .attr('font-size', 10)
      .attr('fill', '#334155')
      .text((d) => (d.type === 'lo' ? d.id.replace('lo:', '') : d.id.split(':').slice(1).join(':')));
  }, [nodes, links, width, height]);

  return (
    <figure className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <figcaption className="mb-2 text-sm font-medium text-slate-700">Confusion graph (LO ⇄ distractor)</figcaption>
      <svg ref={ref} width={width} height={height} role="img" aria-label="Confusion graph" />
    </figure>
  );
}

