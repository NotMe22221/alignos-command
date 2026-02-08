import { useState } from "react";
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
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import type { EntityType } from "@/types/entities";

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

const entityDescriptions: Record<EntityType, string> = {
  person: "Team members and stakeholders",
  team: "Departments and groups",
  project: "Active initiatives",
  decision: "Documented decisions",
  document: "Source documents",
  source: "Data sources",
};

export default function Graph() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<EntityType | "all">("all");

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

        {/* Empty Graph Container */}
        <div className="relative flex-1">
          {/* Placeholder Background Pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,_hsl(var(--muted))_1px,_transparent_0)] bg-[length:24px_24px] opacity-50" />
          
          {/* Zoom Controls */}
          <div className="absolute bottom-4 left-4 flex flex-col gap-1">
            <Button variant="outline" size="icon" disabled>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" disabled>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" disabled>
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>

          {/* Empty State */}
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
                    {(["person", "team", "project", "decision"] as EntityType[]).map((type) => {
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
        </div>
      </div>
    </AppLayout>
  );
}
