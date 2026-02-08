import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Search,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Users,
  FolderOpen,
  FileText,
  Building2,
  Share2,
  ArrowRight,
  Loader2,
  Link2,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ForceGraph } from "@/components/graph/ForceGraph";
import { useGraphData, type GraphNode } from "@/hooks/useGraphData";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { EntityType } from "@/types/entities";

const nodeColors: Record<string, string> = {
  person: "hsl(220, 70%, 50%)",
  team: "hsl(280, 70%, 50%)",
  project: "hsl(160, 70%, 45%)",
  decision: "hsl(35, 92%, 50%)",
};

const nodeIcons: Record<string, typeof Users> = {
  person: Users,
  team: Building2,
  project: FolderOpen,
  decision: FileText,
};

const entityDescriptions: Record<string, string> = {
  person: "Team members and stakeholders",
  team: "Departments and groups",
  project: "Active initiatives",
  decision: "Documented decisions",
};

export default function Graph() {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  const { data: graphData, isLoading, refetch } = useGraphData();

  // Handle creating a new connection between nodes
  const handleLinkCreate = async (sourceId: string, targetId: string) => {
    try {
      // Find the node types
      const sourceNode = graphData?.nodes.find(n => n.id === sourceId);
      const targetNode = graphData?.nodes.find(n => n.id === targetId);
      
      if (!sourceNode || !targetNode) return;

      // Insert the relationship
      const { error } = await supabase.from("relationships").insert({
        source_id: sourceId,
        source_type: sourceNode.type as EntityType,
        target_id: targetId,
        target_type: targetNode.type as EntityType,
        relationship_type: "relates_to",
      });

      if (error) throw error;

      toast.success(`Connected ${sourceNode.label} to ${targetNode.label}`);
      refetch();
    } catch (error) {
      console.error("Failed to create connection:", error);
      toast.error("Failed to create connection");
    }
  };

  // Update dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  // Filter nodes based on search and type filter
  const filteredData = graphData
    ? {
        nodes: graphData.nodes.filter((node) => {
          const matchesSearch = node.label
            .toLowerCase()
            .includes(searchQuery.toLowerCase());
          const matchesFilter = filter === "all" || node.type === filter;
          return matchesSearch && matchesFilter;
        }),
        links: graphData.links.filter((link) => {
          const filteredNodeIds = new Set(
            graphData.nodes
              .filter((node) => {
                const matchesSearch = node.label
                  .toLowerCase()
                  .includes(searchQuery.toLowerCase());
                const matchesFilter = filter === "all" || node.type === filter;
                return matchesSearch && matchesFilter;
              })
              .map((n) => n.id)
          );
          return filteredNodeIds.has(link.source) && filteredNodeIds.has(link.target);
        }),
      }
    : { nodes: [], links: [] };

  const hasData = filteredData.nodes.length > 0;

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
              {graphData?.nodes.length || 0} entities • {graphData?.links.length || 0} connections
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
        <div ref={containerRef} className="relative flex-1">
          {/* Placeholder Background Pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,_hsl(var(--muted))_1px,_transparent_0)] bg-[length:24px_24px] opacity-50" />

          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : hasData ? (
            <>
              <ForceGraph
                nodes={filteredData.nodes}
                links={filteredData.links}
                width={dimensions.width}
                height={dimensions.height}
                onNodeClick={setSelectedNode}
                onLinkCreate={handleLinkCreate}
              />

              {/* Instructions tooltip */}
              <div className="absolute left-4 top-4">
                <Card className="bg-card/90 backdrop-blur">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Link2 className="h-3 w-3" />
                      <span>Shift+drag between nodes to connect</span>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      Double-click canvas to reset view
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Selected Node Info */}
              {selectedNode && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="absolute right-4 top-4 w-72"
                >
                  <Card>
                    <CardContent className="p-4">
                      <div className="mb-3 flex items-center gap-3">
                        <div
                          className="flex h-10 w-10 items-center justify-center rounded-lg"
                          style={{ backgroundColor: nodeColors[selectedNode.type] }}
                        >
                          {(() => {
                            const Icon = nodeIcons[selectedNode.type];
                            return <Icon className="h-5 w-5 text-white" />;
                          })()}
                        </div>
                        <div>
                          <p className="font-medium">{selectedNode.label}</p>
                          <p className="text-xs capitalize text-muted-foreground">
                            {selectedNode.type}
                          </p>
                        </div>
                      </div>
                      {"description" in selectedNode.data && selectedNode.data.description && (
                        <p className="text-sm text-muted-foreground">
                          {selectedNode.data.description}
                        </p>
                      )}
                      {"role" in selectedNode.data && (
                        <p className="text-sm text-muted-foreground">
                          {(selectedNode.data as any).role}
                        </p>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-3 w-full"
                        onClick={() => setSelectedNode(null)}
                      >
                        Close
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Legend */}
              <div className="absolute bottom-4 right-4">
                <Card>
                  <CardContent className="p-3">
                    <div className="flex gap-4">
                      {(["person", "team", "project", "decision"] as const).map((type) => {
                        const Icon = nodeIcons[type];
                        return (
                          <div key={type} className="flex items-center gap-2">
                            <div
                              className="flex h-6 w-6 items-center justify-center rounded"
                              style={{ backgroundColor: nodeColors[type] }}
                            >
                              <Icon className="h-3 w-3 text-white" />
                            </div>
                            <span className="text-xs capitalize">{type}</span>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            /* Empty State */
            <div className="flex h-full items-center justify-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center"
              >
                <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-primary/10 to-primary/5">
                  <Share2 className="h-12 w-12 text-primary" />
                </div>
                <h2 className="mb-2 text-2xl font-medium">Your Knowledge Graph</h2>
                <p className="mb-8 max-w-md text-center text-muted-foreground">
                  Visualize relationships between people, teams, projects, and decisions.
                  Start by adding organizational data to see your knowledge graph come to life.
                </p>

                {/* Entity Type Legend */}
                <Card className="mb-6 w-full max-w-md">
                  <CardContent className="p-4">
                    <p className="mb-3 text-sm font-medium">Entity types in your graph:</p>
                    <div className="grid grid-cols-2 gap-3">
                      {(["person", "team", "project", "decision"] as const).map((type) => {
                        const Icon = nodeIcons[type];
                        return (
                          <div key={type} className="flex items-center gap-3">
                            <div
                              className="flex h-8 w-8 items-center justify-center rounded-lg"
                              style={{ backgroundColor: nodeColors[type] }}
                            >
                              <Icon className="h-4 w-4 text-white" />
                            </div>
                            <div>
                              <p className="text-sm font-medium capitalize">{type}s</p>
                              <p className="text-xs text-muted-foreground">
                                {entityDescriptions[type]}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                <Button className="gap-2" onClick={() => navigate("/ingest")}>
                  Import Data
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </motion.div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
