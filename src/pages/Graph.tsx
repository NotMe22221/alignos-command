import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as d3 from "d3";
import {
  Search,
  ZoomIn,
  ZoomOut,
  Maximize2,
  X,
  Users,
  FolderOpen,
  FileText,
  Building2,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { GraphNode, GraphLink, GraphData, EntityType, Person, Decision, Project } from "@/types/entities";

// Mock graph data
const mockGraphData: GraphData = {
  nodes: [
    // Teams
    { id: "team-1", type: "team", label: "Engineering", data: { id: "team-1", name: "Engineering", created_at: "" } as any },
    { id: "team-2", type: "team", label: "Product", data: { id: "team-2", name: "Product", created_at: "" } as any },
    { id: "team-3", type: "team", label: "Design", data: { id: "team-3", name: "Design", created_at: "" } as any },
    // People
    { id: "person-1", type: "person", label: "Sarah Chen", data: { id: "person-1", name: "Sarah Chen", email: "", role: "Engineering Lead", team_id: "team-1", created_at: "" } },
    { id: "person-2", type: "person", label: "Marcus Johnson", data: { id: "person-2", name: "Marcus Johnson", email: "", role: "Product Manager", team_id: "team-2", created_at: "" } },
    { id: "person-3", type: "person", label: "Emily Watson", data: { id: "person-3", name: "Emily Watson", email: "", role: "Designer", team_id: "team-3", created_at: "" } },
    { id: "person-4", type: "person", label: "Alex Rivera", data: { id: "person-4", name: "Alex Rivera", email: "", role: "Backend Engineer", team_id: "team-1", created_at: "" } },
    // Projects
    { id: "project-1", type: "project", label: "Cloud Migration", data: { id: "project-1", name: "Cloud Migration", description: "", status: "active", owner_id: "person-1", team_id: "team-1", created_at: "" } },
    { id: "project-2", type: "project", label: "Mobile App v2", data: { id: "project-2", name: "Mobile App v2", description: "", status: "active", owner_id: "person-2", team_id: "team-2", created_at: "" } },
    // Decisions
    { id: "decision-1", type: "decision", label: "Q3 Migration Timeline", data: { id: "decision-1", title: "Q3 Migration Timeline", description: "", status: "active", created_by: "person-1", created_at: "", updated_at: "" } },
    { id: "decision-2", type: "decision", label: "Feature Freeze", data: { id: "decision-2", title: "Feature Freeze", description: "", status: "active", created_by: "person-2", created_at: "", updated_at: "" } },
    { id: "decision-3", type: "decision", label: "New Design System", data: { id: "decision-3", title: "New Design System", description: "", status: "draft", created_by: "person-3", created_at: "", updated_at: "" } },
  ],
  links: [
    // Team membership
    { source: "person-1", target: "team-1", type: "member_of" },
    { source: "person-4", target: "team-1", type: "member_of" },
    { source: "person-2", target: "team-2", type: "member_of" },
    { source: "person-3", target: "team-3", type: "member_of" },
    // Project ownership
    { source: "person-1", target: "project-1", type: "owns" },
    { source: "person-2", target: "project-2", type: "owns" },
    // Project-team
    { source: "project-1", target: "team-1", type: "relates_to" },
    { source: "project-2", target: "team-2", type: "relates_to" },
    // Decisions
    { source: "decision-1", target: "project-1", type: "affects" },
    { source: "decision-2", target: "project-1", type: "affects" },
    { source: "decision-3", target: "team-3", type: "affects" },
    { source: "decision-1", target: "person-1", type: "stakeholder" },
    { source: "decision-2", target: "person-2", type: "stakeholder" },
  ],
};

const nodeColors: Record<EntityType, string> = {
  person: "hsl(220, 70%, 50%)",
  team: "hsl(280, 70%, 50%)",
  project: "hsl(160, 70%, 45%)",
  decision: "hsl(35, 92%, 50%)",
  document: "hsl(200, 70%, 50%)",
  source: "hsl(200, 70%, 50%)",
};

const nodeIcons: Record<EntityType, typeof Users> = {
  person: Users,
  team: Building2,
  project: FolderOpen,
  decision: FileText,
  document: FileText,
  source: FileText,
};

interface SimNode extends d3.SimulationNodeDatum {
  id: string;
  type: EntityType;
  label: string;
  data: any;
}

interface SimLink extends d3.SimulationLinkDatum<SimNode> {
  type: string;
}

export default function Graph() {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<EntityType | "all">("all");

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Clear previous
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height]);

    // Add zoom behavior
    const g = svg.append("g");

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom);

    // Create simulation
    const nodes: SimNode[] = mockGraphData.nodes.map(n => ({ ...n }));
    const links: SimLink[] = mockGraphData.links.map(l => ({ ...l }));

    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink<SimNode, SimLink>(links)
        .id(d => d.id)
        .distance(100))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(40));

    // Draw links
    const link = g.append("g")
      .attr("stroke", "hsl(var(--border))")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke-width", 1.5);

    // Draw nodes
    const node = g.append("g")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .attr("cursor", "pointer")
      .call(d3.drag<SVGGElement, SimNode>()
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
        }));

    node.append("circle")
      .attr("r", d => d.type === "team" ? 28 : d.type === "decision" ? 22 : 20)
      .attr("fill", d => nodeColors[d.type])
      .attr("stroke", "hsl(var(--background))")
      .attr("stroke-width", 2);

    node.append("text")
      .attr("dy", 40)
      .attr("text-anchor", "middle")
      .attr("font-size", 11)
      .attr("fill", "hsl(var(--foreground))")
      .text(d => d.label);

    node.on("click", (_, d) => {
      setSelectedNode({
        id: d.id,
        type: d.type,
        label: d.label,
        data: d.data,
      });
    });

    simulation.on("tick", () => {
      link
        .attr("x1", d => (d.source as SimNode).x!)
        .attr("y1", d => (d.source as SimNode).y!)
        .attr("x2", d => (d.target as SimNode).x!)
        .attr("y2", d => (d.target as SimNode).y!);

      node.attr("transform", d => `translate(${d.x},${d.y})`);
    });

    return () => {
      simulation.stop();
    };
  }, [filter]);

  const NodeIcon = selectedNode ? nodeIcons[selectedNode.type] : Users;

  return (
    <AppLayout>
      <div className="flex h-[calc(100vh-1px)] flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-8 py-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Knowledge Graph
            </h1>
            <p className="text-sm text-muted-foreground">
              Interactive organizational map
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search entities..."
                className="w-64 pl-9"
              />
            </div>
            <div className="flex gap-1">
              {(["all", "person", "team", "project", "decision"] as const).map((type) => (
                <Button
                  key={type}
                  variant={filter === type ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter(type)}
                  className="capitalize"
                >
                  {type}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Graph Container */}
        <div className="relative flex-1" ref={containerRef}>
          <svg ref={svgRef} className="h-full w-full" />

          {/* Zoom Controls */}
          <div className="absolute bottom-4 left-4 flex flex-col gap-1">
            <Button variant="outline" size="icon">
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon">
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon">
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>

          {/* Selected Node Panel */}
          <AnimatePresence>
            {selectedNode && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="absolute right-4 top-4 w-80"
              >
                <Card>
                  <CardHeader className="flex flex-row items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-lg"
                        style={{ backgroundColor: nodeColors[selectedNode.type] }}
                      >
                        <NodeIcon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{selectedNode.label}</CardTitle>
                        <p className="text-xs capitalize text-muted-foreground">
                          {selectedNode.type}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setSelectedNode(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {selectedNode.type === "person" && (
                      <>
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">Role</p>
                          <p className="text-sm">{(selectedNode.data as Person).role}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">Email</p>
                          <p className="text-sm">{(selectedNode.data as Person).email || "—"}</p>
                        </div>
                      </>
                    )}
                    {selectedNode.type === "decision" && (
                      <>
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">Status</p>
                          <Badge variant="secondary" className="mt-1 capitalize">
                            {(selectedNode.data as Decision).status}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">Description</p>
                          <p className="text-sm">{(selectedNode.data as Decision).description || "No description"}</p>
                        </div>
                      </>
                    )}
                    {selectedNode.type === "project" && (
                      <>
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">Status</p>
                          <Badge variant="secondary" className="mt-1 capitalize">
                            {(selectedNode.data as Project).status}
                          </Badge>
                        </div>
                      </>
                    )}
                    <div className="pt-2">
                      <Button variant="outline" size="sm" className="w-full">
                        View Full Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </AppLayout>
  );
}
