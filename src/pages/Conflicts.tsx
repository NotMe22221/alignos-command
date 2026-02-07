import { useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  GitMerge,
  Clock,
  Users,
  X,
  Check,
  ChevronRight,
  Sparkles,
  FileText,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { Conflict } from "@/types/entities";

// Mock conflict data
const mockConflicts: (Conflict & { entities: { id: string; title: string; description: string }[] })[] = [
  {
    id: "c1",
    type: "contradiction",
    entity_ids: ["d1", "d5"],
    status: "detected",
    description: "Two decisions have conflicting timelines for the same migration project",
    suggested_resolution: "Merge the timeline from Decision #1 into Decision #5, deprecating the older decision.",
    created_at: "2024-01-20T14:00:00Z",
    entities: [
      { id: "d1", title: "Q3 Cloud Migration Timeline", description: "Complete by end of Q3 2024" },
      { id: "d5", title: "Infrastructure Upgrade Schedule", description: "Complete by Q2 2024" },
    ],
  },
  {
    id: "c2",
    type: "ownership_overlap",
    entity_ids: ["p1", "p2"],
    status: "reviewing",
    description: "Two projects have overlapping ownership with no clear boundaries",
    suggested_resolution: "Assign Sarah Chen as primary owner for Cloud Migration and Marcus Johnson for Mobile App v2.",
    created_at: "2024-01-19T10:00:00Z",
    entities: [
      { id: "p1", title: "Cloud Migration", description: "Owned by Engineering and DevOps" },
      { id: "p2", title: "Mobile App v2", description: "Owned by Product and Engineering" },
    ],
  },
  {
    id: "c3",
    type: "stale",
    entity_ids: ["d6"],
    status: "detected",
    description: "Decision hasn't been reviewed in over 90 days and may be outdated",
    suggested_resolution: "Review the decision with current stakeholders and either reconfirm or deprecate.",
    created_at: "2024-01-18T08:00:00Z",
    entities: [
      { id: "d6", title: "Legacy API Deprecation Plan", description: "Created 120 days ago, last reviewed 95 days ago" },
    ],
  },
];

const conflictTypeConfig: Record<Conflict["type"], { icon: typeof AlertTriangle; label: string; color: string }> = {
  duplicate: { icon: GitMerge, label: "Duplicate", color: "text-pending" },
  contradiction: { icon: AlertTriangle, label: "Contradiction", color: "text-conflict" },
  timeline_mismatch: { icon: Clock, label: "Timeline Mismatch", color: "text-warning" },
  ownership_overlap: { icon: Users, label: "Ownership Overlap", color: "text-info" },
  stale: { icon: Clock, label: "Stale", color: "text-muted-foreground" },
};

const statusConfig: Record<Conflict["status"], { label: string; color: string; bg: string }> = {
  detected: { label: "New", color: "text-conflict", bg: "bg-conflict/10" },
  reviewing: { label: "Reviewing", color: "text-info", bg: "bg-info/10" },
  resolved: { label: "Resolved", color: "text-update", bg: "bg-update/10" },
  dismissed: { label: "Dismissed", color: "text-muted-foreground", bg: "bg-muted" },
};

export default function Conflicts() {
  const [selectedConflict, setSelectedConflict] = useState<typeof mockConflicts[0] | null>(null);
  const [activeTab, setActiveTab] = useState<Conflict["status"] | "all">("all");

  const filteredConflicts = mockConflicts.filter(
    (c) => activeTab === "all" || c.status === activeTab
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const handleResolve = (conflictId: string) => {
    console.log("Resolving conflict:", conflictId);
    setSelectedConflict(null);
  };

  const handleDismiss = (conflictId: string) => {
    console.log("Dismissing conflict:", conflictId);
    setSelectedConflict(null);
  };

  return (
    <AppLayout>
      <div className="flex h-[calc(100vh-1px)]">
        {/* Conflict List */}
        <div className="flex w-96 flex-col border-r">
          {/* Header */}
          <div className="border-b p-4">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-conflict/10">
                <AlertTriangle className="h-5 w-5 text-conflict" />
              </div>
              <div>
                <h1 className="text-xl font-semibold">Conflicts</h1>
                <p className="text-xs text-muted-foreground">
                  {mockConflicts.filter((c) => c.status === "detected").length} requiring attention
                </p>
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
              <TabsList className="w-full">
                <TabsTrigger value="all" className="flex-1">All</TabsTrigger>
                <TabsTrigger value="detected" className="flex-1">New</TabsTrigger>
                <TabsTrigger value="reviewing" className="flex-1">Reviewing</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {filteredConflicts.length === 0 ? (
              <div className="flex h-40 items-center justify-center">
                <p className="text-sm text-muted-foreground">No conflicts found</p>
              </div>
            ) : (
              filteredConflicts.map((conflict, index) => {
                const typeConfig = conflictTypeConfig[conflict.type];
                const TypeIcon = typeConfig.icon;
                const status = statusConfig[conflict.status];

                return (
                  <motion.button
                    key={conflict.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => setSelectedConflict(conflict)}
                    className={cn(
                      "w-full border-b p-4 text-left transition-colors hover:bg-muted/50",
                      selectedConflict?.id === conflict.id && "bg-muted"
                    )}
                  >
                    <div className="mb-2 flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <TypeIcon className={cn("h-4 w-4", typeConfig.color)} />
                        <span className="text-sm font-medium">{typeConfig.label}</span>
                      </div>
                      <Badge variant="secondary" className={cn("text-xs", status.bg, status.color)}>
                        {status.label}
                      </Badge>
                    </div>
                    <p className="mb-2 text-sm text-muted-foreground line-clamp-2">
                      {conflict.description}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{conflict.entities.length} entities affected</span>
                      <span>·</span>
                      <span>{formatDate(conflict.created_at)}</span>
                    </div>
                  </motion.button>
                );
              })
            )}
          </div>
        </div>

        {/* Conflict Detail */}
        <div className="flex-1 overflow-y-auto">
          {selectedConflict ? (
            <motion.div
              key={selectedConflict.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-8"
            >
              {/* Header */}
              <div className="mb-8">
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {(() => {
                      const typeConfig = conflictTypeConfig[selectedConflict.type];
                      const TypeIcon = typeConfig.icon;
                      return (
                        <>
                          <div className={cn("flex h-12 w-12 items-center justify-center rounded-lg", `bg-${selectedConflict.type === 'contradiction' ? 'conflict' : 'muted'}/10`)}>
                            <TypeIcon className={cn("h-6 w-6", typeConfig.color)} />
                          </div>
                          <div>
                            <h1 className="text-xl font-semibold">{typeConfig.label} Detected</h1>
                            <p className="text-sm text-muted-foreground">
                              Detected {formatDate(selectedConflict.created_at)}
                            </p>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                  <Badge variant="secondary" className={cn(statusConfig[selectedConflict.status].bg, statusConfig[selectedConflict.status].color)}>
                    {statusConfig[selectedConflict.status].label}
                  </Badge>
                </div>
                <p className="text-muted-foreground">{selectedConflict.description}</p>
              </div>

              {/* Affected Entities */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="text-base">Affected Entities</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {selectedConflict.entities.map((entity, i) => (
                    <div
                      key={entity.id}
                      className="flex items-start gap-3 rounded-lg border bg-muted/25 p-4"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{entity.title}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {entity.description}
                        </p>
                      </div>
                      {i < selectedConflict.entities.length - 1 && (
                        <div className="absolute left-1/2 -translate-x-1/2 transform">
                          <ChevronRight className="h-4 w-4 rotate-90 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* AI Suggested Resolution */}
              {selectedConflict.suggested_resolution && (
                <Card className="mb-6 border-primary/20 bg-primary/5">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      <CardTitle className="text-base">AI Suggested Resolution</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{selectedConflict.suggested_resolution}</p>
                  </CardContent>
                </Card>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <Button onClick={() => handleResolve(selectedConflict.id)} className="gap-2">
                  <Check className="h-4 w-4" />
                  Apply Resolution
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleDismiss(selectedConflict.id)}
                  className="gap-2"
                >
                  <X className="h-4 w-4" />
                  Dismiss
                </Button>
              </div>
            </motion.div>
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
                <p className="text-muted-foreground">Select a conflict to review</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
