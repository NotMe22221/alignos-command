import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Filter,
  Plus,
  ChevronRight,
  Clock,
  Users,
  GitCommit,
  MoreVertical,
  FileText,
  BookOpen,
  Sparkles,
  Loader2,
  Edit,
  Copy,
  Archive,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useDecisions, type DecisionWithMeta } from "@/hooks/useDecisions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

type DecisionStatus = Tables<"decisions">["status"];

const statusStyles: Record<DecisionStatus, { color: string; bg: string }> = {
  draft: { color: "text-muted-foreground", bg: "bg-muted" },
  active: { color: "text-update", bg: "bg-update/10" },
  superseded: { color: "text-pending", bg: "bg-pending/10" },
  deprecated: { color: "text-destructive", bg: "bg-destructive/10" },
};

export default function Ledger() {
  const navigate = useNavigate();
  const { decisions, isLoading, error, refetch } = useDecisions();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDecision, setSelectedDecision] = useState<DecisionWithMeta | null>(null);
  const [statusFilter, setStatusFilter] = useState<DecisionStatus | "all">("all");
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ title: "", description: "", rationale: "" });

  const handleEdit = (decision: DecisionWithMeta) => {
    setEditForm({
      title: decision.title,
      description: decision.description,
      rationale: decision.rationale || "",
    });
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedDecision) return;

    try {
      // Update decision
      const { error: updateError } = await supabase
        .from("decisions")
        .update({
          title: editForm.title,
          description: editForm.description,
          rationale: editForm.rationale || null,
        })
        .eq("id", selectedDecision.id);

      if (updateError) throw updateError;

      // Create new version
      const newVersion = (selectedDecision.versions.length || 0) + 1;
      await supabase.from("decision_versions").insert({
        decision_id: selectedDecision.id,
        version: newVersion,
        content: { title: editForm.title, description: editForm.description },
        change_summary: "Updated via ledger edit",
      });

      // Log event
      await supabase.from("events").insert({
        entity_type: "decision",
        entity_id: selectedDecision.id,
        event_type: "updated",
        metadata: { version: newVersion },
      });

      toast.success("Decision updated!");
      setIsEditing(false);
      refetch();
    } catch (error) {
      console.error("Edit error:", error);
      toast.error("Failed to update decision");
    }
  };

  const handleDuplicate = async (decision: DecisionWithMeta) => {
    try {
      const { data: newDecision, error: insertError } = await supabase
        .from("decisions")
        .insert({
          title: `${decision.title} (Copy)`,
          description: decision.description,
          rationale: decision.rationale,
          status: "draft",
        })
        .select("id")
        .single();

      if (insertError) throw insertError;

      // Create version 1 for the duplicate
      await supabase.from("decision_versions").insert({
        decision_id: newDecision.id,
        version: 1,
        content: { title: `${decision.title} (Copy)`, description: decision.description },
        change_summary: `Duplicated from "${decision.title}"`,
      });

      // Log event
      await supabase.from("events").insert({
        entity_type: "decision",
        entity_id: newDecision.id,
        event_type: "created",
        metadata: { duplicated_from: decision.id },
      });

      toast.success("Decision duplicated!");
      refetch();
    } catch (error) {
      console.error("Duplicate error:", error);
      toast.error("Failed to duplicate decision");
    }
  };

  const handleDeprecate = async (decision: DecisionWithMeta) => {
    try {
      const { error: updateError } = await supabase
        .from("decisions")
        .update({ status: "deprecated" })
        .eq("id", decision.id);

      if (updateError) throw updateError;

      // Log event
      await supabase.from("events").insert({
        entity_type: "decision",
        entity_id: decision.id,
        event_type: "updated",
        metadata: { status_changed: "deprecated" },
      });

      toast.success("Decision deprecated!");
      setSelectedDecision(null);
      refetch();
    } catch (error) {
      console.error("Deprecate error:", error);
      toast.error("Failed to deprecate decision");
    }
  };

  const filteredDecisions = decisions.filter((d) => {
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
        <div className="flex w-[380px] flex-col border-r border-border/50 bg-card/30">
          {/* Header */}
          <div className="border-b border-border/50 p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                <h1 className="text-lg font-semibold tracking-tight">Decision Ledger</h1>
              </div>
              <Button size="sm" className="gap-1.5 shadow-sm" onClick={() => navigate("/ingest")}>
                <Plus className="h-3.5 w-3.5" />
                New Decision
              </Button>
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search decisions..."
                  className="h-9 border-border/50 bg-background/50 pl-9 text-sm"
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="h-9 w-9 shrink-0 border-border/50">
                    <Filter className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
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
            {isLoading ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : error ? (
              <div className="flex h-full flex-col items-center justify-center p-8 text-center">
                <p className="text-sm text-destructive">Failed to load decisions</p>
                <p className="mt-1 text-xs text-muted-foreground">{error.message}</p>
              </div>
            ) : filteredDecisions.length > 0 ? (
              filteredDecisions.map((decision, index) => (
                <motion.button
                  key={decision.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03, duration: 0.2 }}
                  onClick={() => setSelectedDecision(decision)}
                  className={cn(
                    "group w-full border-b border-border/30 p-4 text-left transition-all hover:bg-accent/50",
                    selectedDecision?.id === decision.id && "bg-accent"
                  )}
                >
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <h3 className="font-medium leading-snug">{decision.title}</h3>
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5" />
                  </div>
                  <p className="mb-3 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">
                    {decision.description}
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className={cn(
                        "h-5 px-1.5 text-[10px] font-medium uppercase tracking-wide",
                        statusStyles[decision.status].bg,
                        statusStyles[decision.status].color
                      )}
                    >
                      {decision.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground/70">
                      v{decision.versions.length || 1}
                    </span>
                    <span className="text-muted-foreground/30">·</span>
                    <span className="text-xs text-muted-foreground/70">
                      {formatDate(decision.updated_at)}
                    </span>
                  </div>
                </motion.button>
              ))
            ) : (
              <div className="flex h-full flex-col items-center justify-center p-8 text-center">
                <div className="mb-4 rounded-full bg-muted/50 p-4">
                  <FileText className="h-8 w-8 text-muted-foreground/40" />
                </div>
                <h3 className="mb-1 text-sm font-medium">No decisions yet</h3>
                <p className="mb-4 text-xs text-muted-foreground">
                  Create your first decision to start<br />building your organizational memory
                </p>
                <Button size="sm" variant="outline" className="gap-1.5" onClick={() => navigate("/ingest")}>
                  <Plus className="h-3.5 w-3.5" />
                  New Decision
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Decision Detail */}
        <div className="flex-1 overflow-y-auto bg-background">
          <AnimatePresence mode="wait">
            {selectedDecision ? (
              <motion.div
                key={selectedDecision.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="mx-auto max-w-3xl p-8"
              >
                {/* Header */}
                <div className="mb-8">
                  <div className="mb-4 flex items-start justify-between">
                    <Badge
                      variant="secondary"
                      className={cn(
                        "h-6 px-2 text-xs font-medium uppercase tracking-wide",
                        statusStyles[selectedDecision.status].bg,
                        statusStyles[selectedDecision.status].color
                      )}
                    >
                      {selectedDecision.status}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(selectedDecision);
                          }}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDuplicate(selectedDecision);
                          }}
                        >
                          <Copy className="mr-2 h-4 w-4" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeprecate(selectedDecision);
                          }}
                        >
                          <Archive className="mr-2 h-4 w-4" />
                          Deprecate
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <h1 className="mb-3 text-2xl font-semibold tracking-tight">
                    {selectedDecision.title}
                  </h1>
                  <p className="text-[15px] leading-relaxed text-muted-foreground">
                    {selectedDecision.description}
                  </p>
                </div>

                {/* Stats */}
                <div className="mb-8 grid grid-cols-3 gap-4">
                  <Card className="border-border/50 bg-card/50">
                    <CardContent className="flex items-center gap-3 p-4">
                      <div className="rounded-lg bg-muted/50 p-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                          Updated
                        </p>
                        <p className="text-sm font-medium">{formatDate(selectedDecision.updated_at)}</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-border/50 bg-card/50">
                    <CardContent className="flex items-center gap-3 p-4">
                      <div className="rounded-lg bg-muted/50 p-2">
                        <GitCommit className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                          Version
                        </p>
                        <p className="text-sm font-medium">{selectedDecision.versions.length || 1}</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-border/50 bg-card/50">
                    <CardContent className="flex items-center gap-3 p-4">
                      <div className="rounded-lg bg-muted/50 p-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                          Acknowledged
                        </p>
                        <p className="text-sm font-medium">
                          {selectedDecision.acknowledgments.acknowledged}/{selectedDecision.acknowledgments.total}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Rationale */}
                {selectedDecision.rationale && (
                  <Card className="mb-8 border-border/50 bg-card/50">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-sm font-medium">
                        <Sparkles className="h-4 w-4 text-primary" />
                        Rationale
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-[14px] leading-relaxed text-muted-foreground">
                        {selectedDecision.rationale}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Version History */}
                {selectedDecision.versions.length > 0 && (
                  <Card className="border-border/50 bg-card/50">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-sm font-medium">
                        <GitCommit className="h-4 w-4 text-primary" />
                        Version History
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-1">
                        {selectedDecision.versions.map((version, index) => (
                          <div
                            key={version.id}
                            className="flex items-start gap-3"
                          >
                            <div className="flex flex-col items-center">
                              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted/80 text-xs font-medium">
                                {version.version}
                              </div>
                              {index < selectedDecision.versions.length - 1 && (
                                <div className="h-6 w-px bg-border/50" />
                              )}
                            </div>
                            <div className="flex-1 pb-3">
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">
                                  {formatDate(version.changed_at)}
                                </span>
                              </div>
                              <p className="text-sm text-foreground/80">
                                {version.change_summary || "No summary"}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="flex h-full flex-col items-center justify-center p-8"
              >
                <div className="mb-6 rounded-2xl bg-gradient-to-br from-muted/50 to-muted/30 p-6">
                  <BookOpen className="h-12 w-12 text-muted-foreground/30" />
                </div>
                <h2 className="mb-2 text-lg font-medium">Your Decision Ledger</h2>
                <p className="mb-6 max-w-sm text-center text-sm text-muted-foreground">
                  The source of truth for all organizational decisions. 
                  Create decisions from the Ingest page or add them manually.
                </p>
                <div className="flex gap-3">
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate("/ingest")}>
                    <Plus className="h-3.5 w-3.5" />
                    New Decision
                  </Button>
                  <Button size="sm" className="gap-1.5" onClick={() => navigate("/ingest")}>
                    <Sparkles className="h-3.5 w-3.5" />
                    Go to Ingest
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Decision</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rationale">Rationale</Label>
              <Textarea
                id="rationale"
                value={editForm.rationale}
                onChange={(e) => setEditForm({ ...editForm, rationale: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
