import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  GitMerge,
  Clock,
  Users,
  Shield,
  ArrowRight,
  Loader2,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useConflicts } from "@/hooks/useConflicts";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import type { Tables } from "@/integrations/supabase/types";

type ConflictType = Tables<"conflicts">["type"];
type ConflictStatus = Tables<"conflicts">["status"];

const conflictTypeConfig: Record<ConflictType, { icon: typeof AlertTriangle; label: string; color: string }> = {
  duplicate: { icon: GitMerge, label: "Duplicate", color: "text-pending" },
  contradiction: { icon: AlertTriangle, label: "Contradiction", color: "text-conflict" },
  timeline_mismatch: { icon: Clock, label: "Timeline Mismatch", color: "text-warning" },
  ownership_overlap: { icon: Users, label: "Ownership Overlap", color: "text-info" },
  stale: { icon: Clock, label: "Stale", color: "text-muted-foreground" },
};

const statusConfig: Record<ConflictStatus, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  detected: { label: "New", variant: "destructive" },
  reviewing: { label: "Reviewing", variant: "secondary" },
  resolved: { label: "Resolved", variant: "default" },
  dismissed: { label: "Dismissed", variant: "outline" },
};

function ConflictCard({ 
  conflict, 
  isSelected, 
  onClick 
}: { 
  conflict: Tables<"conflicts">; 
  isSelected: boolean;
  onClick: () => void;
}) {
  const config = conflictTypeConfig[conflict.type];
  const Icon = config.icon;
  const status = statusConfig[conflict.status];

  return (
    <motion.div
      whileHover={{ x: 2 }}
      onClick={onClick}
      className={cn(
        "cursor-pointer border-b border-border/30 border-l-2 p-4 transition-all hover:bg-muted/50",
        isSelected ? "bg-muted border-l-primary" : `border-l-transparent hover:border-l-${config.color.replace('text-', '')}`
      )}
    >
      <div className="mb-2 flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className={cn(
            "flex h-7 w-7 items-center justify-center rounded-lg",
            config.color.replace('text-', 'bg-') + '/10'
          )}>
            <Icon className={cn("h-4 w-4", config.color)} />
          </div>
          <span className="text-sm font-medium">{config.label}</span>
        </div>
        <Badge variant={status.variant} className="text-[10px] uppercase tracking-wide">
          {status.label}
        </Badge>
      </div>
      <p className="line-clamp-2 text-sm text-muted-foreground">
        {conflict.description}
      </p>
      <p className="mt-2 text-[11px] text-muted-foreground/70">
        {formatDistanceToNow(new Date(conflict.created_at), { addSuffix: true })}
      </p>
    </motion.div>
  );
}

export default function Conflicts() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<ConflictStatus | "all">("all");
  const [selectedConflict, setSelectedConflict] = useState<Tables<"conflicts"> | null>(null);
  const { conflicts, stats, isLoading, refetch } = useConflicts();

  const filteredConflicts = activeTab === "all" 
    ? conflicts 
    : conflicts.filter(c => c.status === activeTab);

  const handleResolve = async (conflictId: string) => {
    const { error } = await supabase
      .from("conflicts")
      .update({ status: "resolved", resolved_at: new Date().toISOString() })
      .eq("id", conflictId);

    if (error) {
      toast.error("Failed to resolve conflict");
    } else {
      toast.success("Conflict marked as resolved");
      setSelectedConflict(null);
      refetch();
    }
  };

  const handleDismiss = async (conflictId: string) => {
    const { error } = await supabase
      .from("conflicts")
      .update({ status: "dismissed" })
      .eq("id", conflictId);

    if (error) {
      toast.error("Failed to dismiss conflict");
    } else {
      toast.success("Conflict dismissed");
      setSelectedConflict(null);
      refetch();
    }
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
                  {stats.detected} requiring attention
                </p>
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
              <TabsList className="w-full">
                <TabsTrigger value="all" className="flex-1">All ({stats.total})</TabsTrigger>
                <TabsTrigger value="detected" className="flex-1">New ({stats.detected})</TabsTrigger>
                <TabsTrigger value="reviewing" className="flex-1">Reviewing ({stats.reviewing})</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : filteredConflicts.length > 0 ? (
              filteredConflicts.map((conflict) => (
                <ConflictCard
                  key={conflict.id}
                  conflict={conflict}
                  isSelected={selectedConflict?.id === conflict.id}
                  onClick={() => setSelectedConflict(conflict)}
                />
              ))
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                  <Shield className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="mb-1 text-sm font-medium">No conflicts</p>
                <p className="text-center text-xs text-muted-foreground">
                  Your organization is conflict-free
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Detail View */}
        <div className="flex flex-1 items-center justify-center">
          {selectedConflict ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-2xl p-8"
            >
              <Card>
                <CardContent className="p-6">
                  <div className="mb-6 flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {(() => {
                        const config = conflictTypeConfig[selectedConflict.type];
                        const Icon = config.icon;
                        return (
                          <>
                            <div className={`flex h-12 w-12 items-center justify-center rounded-lg bg-conflict/10`}>
                              <Icon className={`h-6 w-6 ${config.color}`} />
                            </div>
                            <div>
                              <h2 className="text-lg font-semibold">{config.label}</h2>
                              <p className="text-sm text-muted-foreground">
                                Detected {new Date(selectedConflict.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                    <Badge variant={statusConfig[selectedConflict.status].variant}>
                      {statusConfig[selectedConflict.status].label}
                    </Badge>
                  </div>

                  <div className="mb-6">
                    <h3 className="mb-2 text-sm font-medium">Description</h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedConflict.description}
                    </p>
                  </div>

                  {selectedConflict.suggested_resolution && (
                    <div className="mb-6">
                      <h3 className="mb-2 text-sm font-medium">Suggested Resolution</h3>
                      <p className="text-sm text-muted-foreground">
                        {selectedConflict.suggested_resolution}
                      </p>
                    </div>
                  )}

                  {selectedConflict.status !== "resolved" && selectedConflict.status !== "dismissed" && (
                    <div className="flex gap-2">
                      <Button 
                        className="gap-2"
                        onClick={() => handleResolve(selectedConflict.id)}
                      >
                        <CheckCircle className="h-4 w-4" />
                        Mark Resolved
                      </Button>
                      <Button 
                        variant="outline" 
                        className="gap-2"
                        onClick={() => handleDismiss(selectedConflict.id)}
                      >
                        <XCircle className="h-4 w-4" />
                        Dismiss
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center text-center"
            >
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-update/10 to-update/5">
                <Shield className="h-10 w-10 text-update" />
              </div>
              
              {conflicts.length === 0 ? (
                <>
                  <h2 className="mb-2 text-xl font-medium">All Clear</h2>
                  <p className="mb-6 max-w-sm text-muted-foreground">
                    No conflicts have been detected in your organizational data. 
                    The system monitors for contradictions, duplicates, and stale decisions.
                  </p>
                </>
              ) : (
                <>
                  <h2 className="mb-2 text-xl font-medium">Select a Conflict</h2>
                  <p className="mb-6 max-w-sm text-muted-foreground">
                    Choose a conflict from the list to view details and take action.
                  </p>
                </>
              )}

              <Card className="w-full max-w-sm">
                <CardContent className="p-4">
                  <p className="mb-3 text-sm font-medium">What we detect:</p>
                  <div className="space-y-2">
                    {Object.entries(conflictTypeConfig).map(([key, config]) => {
                      const Icon = config.icon;
                      return (
                        <div key={key} className="flex items-center gap-2 text-sm">
                          <Icon className={`h-4 w-4 ${config.color}`} />
                          <span className="text-muted-foreground">{config.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {conflicts.length === 0 && (
                <Button className="mt-6 gap-2" onClick={() => navigate("/ingest")}>
                  Import Data
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
