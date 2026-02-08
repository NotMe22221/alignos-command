import { useEffect, useRef, useState, useCallback } from "react";
import * as d3 from "d3";
import type { GraphNode, GraphLink } from "@/hooks/useGraphData";

interface ForceGraphProps {
  nodes: GraphNode[];
  links: GraphLink[];
  width: number;
  height: number;
  onNodeClick?: (node: GraphNode) => void;
  onLinkCreate?: (sourceId: string, targetId: string) => void;
}

const nodeColors: Record<GraphNode["type"], string> = {
  person: "hsl(220, 70%, 50%)",
  team: "hsl(280, 70%, 50%)",
  project: "hsl(160, 70%, 45%)",
  decision: "hsl(35, 92%, 50%)",
};

const nodeRadius: Record<GraphNode["type"], number> = {
  person: 24,
  team: 28,
  project: 26,
  decision: 22,
};

export function ForceGraph({ 
  nodes, 
  links, 
  width, 
  height, 
  onNodeClick,
  onLinkCreate 
}: ForceGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectingFrom, setConnectingFrom] = useState<GraphNode | null>(null);
  const dragLineRef = useRef<d3.Selection<SVGLineElement, unknown, null, undefined> | null>(null);

  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Create a container group for zoom/pan
    const g = svg.append("g");

    // Create drag line for connecting nodes (hidden by default)
    const dragLine = g.append("line")
      .attr("class", "drag-line")
      .attr("stroke", "hsl(var(--primary))")
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", "5,5")
      .attr("opacity", 0);
    
    dragLineRef.current = dragLine;

    // Add zoom and pan behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 5])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom);

    // Center the view initially
    const initialTransform = d3.zoomIdentity
      .translate(width / 2, height / 2)
      .scale(0.8)
      .translate(-width / 2, -height / 2);
    svg.call(zoom.transform, initialTransform);

    // Create force simulation with tighter clustering
    const simulation = d3.forceSimulation(nodes as d3.SimulationNodeDatum[])
      .force("link", d3.forceLink(links)
        .id((d: any) => d.id)
        .distance(80)
        .strength(0.7))
      .force("charge", d3.forceManyBody()
        .strength(-150)
        .distanceMax(300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(50))
      .force("x", d3.forceX(width / 2).strength(0.05))
      .force("y", d3.forceY(height / 2).strength(0.05));

    // Draw links
    const link = g.append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke", "hsl(var(--muted-foreground))")
      .attr("stroke-opacity", 0.4)
      .attr("stroke-width", 2);

    // Draw link labels
    const linkLabels = g.append("g")
      .attr("class", "link-labels")
      .selectAll("text")
      .data(links)
      .join("text")
      .attr("text-anchor", "middle")
      .attr("fill", "hsl(var(--muted-foreground))")
      .attr("font-size", "9px")
      .text((d) => d.type.replace(/_/g, " "));

    // Draw nodes
    const node = g.append("g")
      .attr("class", "nodes")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .attr("cursor", "grab");

    // Add glow effect for hover
    const defs = svg.append("defs");
    defs.append("filter")
      .attr("id", "glow")
      .append("feGaussianBlur")
      .attr("stdDeviation", "3")
      .attr("result", "coloredBlur");

    // Node drag behavior
    const nodeDrag = d3.drag<SVGGElement, GraphNode>()
      .on("start", function(event, d: any) {
        if (event.sourceEvent.shiftKey) {
          // Shift+drag to create connection
          setIsConnecting(true);
          setConnectingFrom(d);
          dragLine
            .attr("x1", d.x)
            .attr("y1", d.y)
            .attr("x2", d.x)
            .attr("y2", d.y)
            .attr("opacity", 1);
        } else {
          // Normal drag to move node
          d3.select(this).attr("cursor", "grabbing");
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        }
      })
      .on("drag", function(event, d: any) {
        if (isConnecting || event.sourceEvent.shiftKey) {
          // Update connection line
          dragLine
            .attr("x2", event.x)
            .attr("y2", event.y);
        } else {
          // Move node
          d.fx = event.x;
          d.fy = event.y;
        }
      })
      .on("end", function(event, d: any) {
        d3.select(this).attr("cursor", "grab");
        
        if (isConnecting || connectingFrom) {
          // Check if we dropped on another node
          const targetNode = nodes.find((n: any) => {
            const dx = n.x - event.x;
            const dy = n.y - event.y;
            return Math.sqrt(dx * dx + dy * dy) < nodeRadius[n.type] && n.id !== connectingFrom?.id;
          });
          
          if (targetNode && connectingFrom && onLinkCreate) {
            onLinkCreate(connectingFrom.id, targetNode.id);
          }
          
          dragLine.attr("opacity", 0);
          setIsConnecting(false);
          setConnectingFrom(null);
        } else {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        }
      });

    node.call(nodeDrag as any);

    // Add outer ring for selection/hover
    node.append("circle")
      .attr("r", (d) => nodeRadius[d.type] + 4)
      .attr("fill", "transparent")
      .attr("stroke", "transparent")
      .attr("stroke-width", 3)
      .attr("class", "node-ring");

    // Add circles to nodes
    node.append("circle")
      .attr("r", (d) => nodeRadius[d.type])
      .attr("fill", (d) => nodeColors[d.type])
      .attr("stroke", "hsl(var(--background))")
      .attr("stroke-width", 3)
      .attr("class", "node-circle");

    // Add type icons
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
      .attr("font-size", "16px")
      .attr("pointer-events", "none");

    // Add labels to nodes
    node.append("text")
      .text((d) => d.label.length > 18 ? d.label.substring(0, 15) + "..." : d.label)
      .attr("text-anchor", "middle")
      .attr("dy", (d) => nodeRadius[d.type] + 16)
      .attr("fill", "hsl(var(--foreground))")
      .attr("font-size", "11px")
      .attr("font-weight", "500")
      .attr("pointer-events", "none");

    // Hover effects
    node
      .on("mouseenter", function(event, d) {
        d3.select(this).select(".node-ring")
          .attr("stroke", nodeColors[d.type])
          .attr("stroke-opacity", 0.5);
        d3.select(this).select(".node-circle")
          .attr("filter", "url(#glow)");
      })
      .on("mouseleave", function() {
        d3.select(this).select(".node-ring")
          .attr("stroke", "transparent");
        d3.select(this).select(".node-circle")
          .attr("filter", null);
      })
      .on("click", (event, d) => {
        event.stopPropagation();
        onNodeClick?.(d);
      });

    // Update positions on tick
    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      linkLabels
        .attr("x", (d: any) => (d.source.x + d.target.x) / 2)
        .attr("y", (d: any) => (d.source.y + d.target.y) / 2);

      node.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    // Double-click to reset zoom
    svg.on("dblclick.zoom", () => {
      svg.transition()
        .duration(500)
        .call(zoom.transform, initialTransform);
    });

    return () => {
      simulation.stop();
    };
  }, [nodes, links, width, height, onNodeClick, onLinkCreate, isConnecting, connectingFrom]);

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      style={{ background: "transparent", touchAction: "none" }}
    />
  );
}
