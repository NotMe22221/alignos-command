import { useEffect, useRef } from "react";
import * as d3 from "d3";
import type { GraphNode, GraphLink } from "@/hooks/useGraphData";

interface ForceGraphProps {
  nodes: GraphNode[];
  links: GraphLink[];
  width: number;
  height: number;
  onNodeClick?: (node: GraphNode) => void;
}

const nodeColors: Record<GraphNode["type"], string> = {
  person: "hsl(220, 70%, 50%)",
  team: "hsl(280, 70%, 50%)",
  project: "hsl(160, 70%, 45%)",
  decision: "hsl(35, 92%, 50%)",
};

const nodeRadius: Record<GraphNode["type"], number> = {
  person: 20,
  team: 25,
  project: 22,
  decision: 18,
};

export function ForceGraph({ nodes, links, width, height, onNodeClick }: ForceGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Create a container group for zoom
    const g = svg.append("g");

    // Add zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom);

    // Create force simulation
    const simulation = d3.forceSimulation(nodes as d3.SimulationNodeDatum[])
      .force("link", d3.forceLink(links)
        .id((d: any) => d.id)
        .distance(100)
        .strength(0.5))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(40));

    // Draw links
    const link = g.append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke", "hsl(var(--muted-foreground))")
      .attr("stroke-opacity", 0.3)
      .attr("stroke-width", 1.5);

    // Draw nodes
    const node = g.append("g")
      .attr("class", "nodes")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .attr("cursor", "pointer")
      .call(d3.drag<SVGGElement, GraphNode>()
        .on("start", (event, d: any) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on("drag", (event, d: any) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on("end", (event, d: any) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        }) as any);

    // Add circles to nodes
    node.append("circle")
      .attr("r", (d) => nodeRadius[d.type])
      .attr("fill", (d) => nodeColors[d.type])
      .attr("stroke", "hsl(var(--background))")
      .attr("stroke-width", 2)
      .on("click", (event, d) => {
        event.stopPropagation();
        onNodeClick?.(d);
      });

    // Add labels to nodes
    node.append("text")
      .text((d) => d.label.length > 15 ? d.label.substring(0, 12) + "..." : d.label)
      .attr("text-anchor", "middle")
      .attr("dy", (d) => nodeRadius[d.type] + 14)
      .attr("fill", "hsl(var(--foreground))")
      .attr("font-size", "11px")
      .attr("font-weight", "500");

    // Add type icons (as text)
    node.append("text")
      .text((d) => {
        switch (d.type) {
          case "person": return "👤";
          case "team": return "🏢";
          case "project": return "📁";
          case "decision": return "📄";
          default: return "";
        }
      })
      .attr("text-anchor", "middle")
      .attr("dy", 5)
      .attr("font-size", "14px");

    // Update positions on tick
    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    return () => {
      simulation.stop();
    };
  }, [nodes, links, width, height, onNodeClick]);

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      style={{ background: "transparent" }}
    />
  );
}
