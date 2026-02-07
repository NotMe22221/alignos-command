import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Filter,
  Plus,
  ChevronRight,
  Clock,
  Users,
  CheckCircle,
  AlertCircle,
  GitCommit,
  MoreVertical,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { Decision, DecisionVersion } from "@/types/entities";

// Mock decisions data
const mockDecisions: (Decision & { versions: DecisionVersion[]; acknowledgments: { total: number; acknowledged: number } })[] = [
  {
    id: "d1",
    title: "Q3 Cloud Migration Timeline",
    description: "Complete AWS to GCP migration by end of Q3 2024. All services must be migrated with zero downtime.",
    rationale: "Cost reduction and improved developer experience with GCP tooling.",
    status: "active",
    project_id: "p1",
    created_by: "person-1",
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-01-20T14:30:00Z",
    versions: [
      { id: "v2", decision_id: "d1", version: 2, content: { title: "", description: "", rationale: "" }, changed_by: "person-1", changed_at: "2024-01-20T14:30:00Z", change_summary: "Updated timeline to Q3" },
      { id: "v1", decision_id: "d1", version: 1, content: { title: "", description: "", rationale: "" }, changed_by: "person-1", changed_at: "2024-01-15T10:00:00Z", change_summary: "Initial decision" },
    ],
    acknowledgments: { total: 12, acknowledged: 8 },
  },
  {
    id: "d2",
    title: "Feature Freeze During Migration",
    description: "No new feature development during the migration period. Only critical bug fixes allowed.",
    rationale: "Reduce risk and ensure team focus on migration success.",
    status: "active",
    project_id: "p1",
    created_by: "person-2",
    created_at: "2024-01-16T09:00:00Z",
    updated_at: "2024-01-16T09:00:00Z",
    versions: [
      { id: "v1", decision_id: "d2", version: 1, content: { title: "", description: "", rationale: "" }, changed_by: "person-2", changed_at: "2024-01-16T09:00:00Z", change_summary: "Initial decision" },
    ],
    acknowledgments: { total: 8, acknowledged: 8 },
  },
  {
    id: "d3",
    title: "New Design System Adoption",
    description: "Adopt the new unified design system across all products by Q2 2024.",
    rationale: "Improve consistency and reduce design debt.",
    status: "draft",
    project_id: "p2",
    created_by: "person-3",
    created_at: "2024-01-18T11:00:00Z",
    updated_at: "2024-01-18T11:00:00Z",
    versions: [
      { id: "v1", decision_id: "d3", version: 1, content: { title: "", description: "", rationale: "" }, changed_by: "person-3", changed_at: "2024-01-18T11:00:00Z", change_summary: "Draft created" },
    ],
    acknowledgments: { total: 15, acknowledged: 3 },
  },
  {
    id: "d4",
    title: "API Versioning Strategy",
    description: "Implement semantic versioning for all public APIs with 6-month deprecation cycles.",
    rationale: "Better developer experience and clearer upgrade paths for API consumers.",
    status: "superseded",
    project_id: null,
    created_by: "person-4",
    created_at: "2023-12-01T10:00:00Z",
    updated_at: "2024-01-10T15:00:00Z",
    versions: [
      { id: "v3", decision_id: "d4", version: 3, content: { title: "", description: "", rationale: "" }, changed_by: "person-1", changed_at: "2024-01-10T15:00:00Z", change_summary: "Superseded by new policy" },
    ],
    acknowledgments: { total: 20, acknowledged: 20 },
  },
];

const statusStyles: Record<Decision["status"], { color: string; bg: string }> = {
  draft: { color: "text-muted-foreground", bg: "bg-muted" },
  active: { color: "text-update", bg: "bg-update/10" },
  superseded: { color: "text-pending", bg: "bg-pending/10" },
  deprecated: { color: "text-destructive", bg: "bg-destructive/10" },
};

export default function Ledger() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDecision, setSelectedDecision] = useState<typeof mockDecisions[0] | null>(null);
  const [statusFilter, setStatusFilter] = useState<Decision["status"] | "all">("all");

  const filteredDecisions = mockDecisions.filter((d) => {
    const matchesSearch = d.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <AppLayout>
      <div className="flex h-[calc(100vh-1px)]">
        {/* Decision List */}
        <div className="flex w-96 flex-col border-r">
          {/* Header */}
          <div className="border-b p-4">
            <div className="mb-4 flex items-center justify-between">
              <h1 className="text-xl font-semibold">Decision Ledger</h1>
              <Button size="sm" className="gap-1">
                <Plus className="h-4 w-4" />
                New
              </Button>
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search decisions..."
                  className="pl-9"
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setStatusFilter("all")}>
                    All Statuses
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter("active")}>
                    Active
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter("draft")}>
                    Draft
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter("superseded")}>
                    Superseded
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {filteredDecisions.map((decision, index) => (
              <motion.button
                key={decision.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => setSelectedDecision(decision)}
                className={cn(
                  "w-full border-b p-4 text-left transition-colors hover:bg-muted/50",
                  selectedDecision?.id === decision.id && "bg-muted"
                )}
              >
                <div className="mb-2 flex items-start justify-between">
                  <h3 className="font-medium leading-tight">{decision.title}</h3>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </div>
                <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">
                  {decision.description}
                </p>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="secondary"
                    className={cn(
                      "capitalize",
                      statusStyles[decision.status].bg,
                      statusStyles[decision.status].color
                    )}
                  >
                    {decision.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    v{decision.versions.length}
                  </span>
                  <span className="text-xs text-muted-foreground">·</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(decision.updated_at)}
                  </span>
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Decision Detail */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            {selectedDecision ? (
              <motion.div
                key={selectedDecision.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-8"
              >
                {/* Header */}
                <div className="mb-6 flex items-start justify-between">
                  <div>
                    <Badge
                      variant="secondary"
                      className={cn(
                        "mb-2 capitalize",
                        statusStyles[selectedDecision.status].bg,
                        statusStyles[selectedDecision.status].color
                      )}
                    >
                      {selectedDecision.status}
                    </Badge>
                    <h1 className="text-2xl font-semibold">{selectedDecision.title}</h1>
                    <p className="mt-2 text-muted-foreground">
                      {selectedDecision.description}
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Edit</DropdownMenuItem>
                      <DropdownMenuItem>Duplicate</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        Deprecate
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Stats */}
                <div className="mb-8 grid grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="flex items-center gap-3 p-4">
                      <Clock className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Last Updated</p>
                        <p className="font-medium">{formatDate(selectedDecision.updated_at)}</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="flex items-center gap-3 p-4">
                      <GitCommit className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Versions</p>
                        <p className="font-medium">{selectedDecision.versions.length}</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="flex items-center gap-3 p-4">
                      <Users className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Acknowledged</p>
                        <p className="font-medium">
                          {selectedDecision.acknowledgments.acknowledged} / {selectedDecision.acknowledgments.total}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Rationale */}
                {selectedDecision.rationale && (
                  <Card className="mb-8">
                    <CardHeader>
                      <CardTitle className="text-base">Rationale</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        {selectedDecision.rationale}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Version History */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Version History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {selectedDecision.versions.map((version, index) => (
                        <div
                          key={version.id}
                          className="flex items-start gap-3"
                        >
                          <div className="flex flex-col items-center">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                              <GitCommit className="h-4 w-4" />
                            </div>
                            {index < selectedDecision.versions.length - 1 && (
                              <div className="h-8 w-px bg-border" />
                            )}
                          </div>
                          <div className="flex-1 pb-4">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">v{version.version}</span>
                              <span className="text-xs text-muted-foreground">
                                {formatDate(version.changed_at)}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {version.change_summary}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex h-full items-center justify-center"
              >
                <div className="text-center">
                  <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
                  <p className="text-muted-foreground">
                    Select a decision to view details
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </AppLayout>
  );
}

// Missing import
import { FileText } from "lucide-react";
