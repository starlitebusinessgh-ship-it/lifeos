"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { GitBranch } from "lucide-react";
import * as d3 from "d3";
import type { GraphBookCluster } from "@/lib/learn/knowledge";
import { haptic } from "@/lib/finance/haptics";

type GraphNode = d3.SimulationNodeDatum & {
  id: string;
  label: string;
  kind: "book" | "highlight" | "action";
  href?: string;
  r: number;
};

type GraphLink = d3.SimulationLinkDatum<GraphNode> & { source: string; target: string };

export function KnowledgeGraph({
  clusters,
  stats,
}: {
  clusters: GraphBookCluster[];
  stats: { books: number; highlights: number; links: number; ideas: number };
}) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || clusters.length === 0) return;

    const nodes: GraphNode[] = [];
    const links: GraphLink[] = [];

    for (const book of clusters) {
      const bookId = `book-${book.bookId}`;
      nodes.push({ id: bookId, label: book.title, kind: "book", href: `/learn/${book.bookId}`, r: 22 });
      for (const hl of book.highlights) {
        const hlId = `hl-${hl.id}`;
        nodes.push({
          id: hlId,
          label: hl.quote.slice(0, 40),
          kind: "highlight",
          r: 12,
        });
        links.push({ source: bookId, target: hlId });
        for (const action of hl.actions) {
          const actId = `act-${action.id}`;
          if (!nodes.find((n) => n.id === actId)) {
            nodes.push({
              id: actId,
              label: action.label,
              kind: "action",
              href: action.href,
              r: 8,
            });
          }
          links.push({ source: hlId, target: actId });
        }
      }
    }

    const width = svgRef.current.clientWidth || 360;
    const height = 420;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("viewBox", `0 0 ${width} ${height}`);

    const g = svg.append("g");

    const zoom = d3.zoom<SVGSVGElement, unknown>().scaleExtent([0.4, 2.5]).on("zoom", (event) => {
      g.attr("transform", event.transform.toString());
    });
    svg.call(zoom);

    const simulation = d3
      .forceSimulation(nodes)
      .force(
        "link",
        d3.forceLink(links).id((d) => (d as GraphNode).id).distance(60)
      )
      .force("charge", d3.forceManyBody().strength(-120))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide<GraphNode>().radius((d) => d.r + 4));

    const link = g
      .append("g")
      .attr("stroke", "rgba(255,255,255,0.15)")
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke-width", 1);

    const dragBehavior = d3
      .drag<SVGGElement, GraphNode>()
      .on("start", (event, d) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on("drag", (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on("end", (event, d) => {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });

    const node = g
      .append("g")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .attr("cursor", (d) => (d.href ? "pointer" : "default"))
      .call(dragBehavior as never);

    node
      .append("circle")
      .attr("r", (d) => d.r)
      .attr("fill", (d) =>
        d.kind === "book" ? "#6366f1" : d.kind === "highlight" ? "#f59e0b" : "#22c55e"
      );

    node
      .append("text")
      .text((d) => (d.label.length > 18 ? `${d.label.slice(0, 16)}…` : d.label))
      .attr("x", (d) => d.r + 4)
      .attr("y", 4)
      .attr("fill", "rgba(255,255,255,0.85)")
      .attr("font-size", 10);

    node.on("click", (_, d) => {
      if (d.href) {
        haptic("light");
        window.location.href = d.href;
      }
    });

    simulation.on("tick", () => {
      link
        .attr("x1", (d) => (d.source as GraphNode).x ?? 0)
        .attr("y1", (d) => (d.source as GraphNode).y ?? 0)
        .attr("x2", (d) => (d.target as GraphNode).x ?? 0)
        .attr("y2", (d) => (d.target as GraphNode).y ?? 0);
      node.attr("transform", (d) => `translate(${d.x ?? 0},${d.y ?? 0})`);
    });

    return () => {
      simulation.stop();
    };
  }, [clusters]);

  if (clusters.length === 0) {
    return (
      <div className="ln-mind-empty">
        <GitBranch size={32} strokeWidth={1.4} className="ln-mind-empty-icon" />
        <h2>Your knowledge graph is empty</h2>
        <p>
          Highlight passages while reading, then send them to Inbox, Today, or pin them as ideas.
          Connections appear here as a living map.
        </p>
        <Link href="/learn" className="ln-mind-empty-btn" onClick={() => haptic("light")}>
          Go to library
        </Link>
      </div>
    );
  }

  return (
    <div className="ln-mind">
      <div className="ln-mind-stats">
        <span>{stats.books} books</span>
        <span>{stats.highlights} highlights</span>
        <span>{stats.links} links</span>
        <span>{stats.ideas} ideas</span>
      </div>
      <div className="ln-mind-graph-wrap">
        <svg ref={svgRef} className="ln-mind-graph" aria-label="Knowledge graph" />
        <p className="ln-mind-graph-hint">Drag nodes · pinch or scroll to zoom</p>
      </div>
    </div>
  );
}
