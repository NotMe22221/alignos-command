import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FileText,
  AlertTriangle,
  Clock,
  Users,
  Volume2,
  Sparkles,
  ArrowRight,
  Loader2,
  GitCommit,
  UserPlus,
  FolderPlus,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { MetricCard } from "@/components/shared/MetricCard";
import { QuickInput } from "@/components/shared/QuickInput";
import { VoiceAgent } from "@/components/shared/VoiceAgent";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useVoiceRecording } from "@/hooks/useVoiceRecording";
import { useRecentActivity, type ActivityItem } from "@/hooks/useRecentActivity";
import { useDecisions } from "@/hooks/useDecisions";
import { useConflicts } from "@/hooks/useConflicts";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

const activityIcons: Record<string, typeof FileText> = {
  decision: FileText,
  person: UserPlus,
  project: FolderPlus,
  team: Users,
};

const eventLabels: Record<string, string> = {
  created: "created",
  updated: "updated",
  deleted: "deleted",
  acknowledged: "acknowledged",
  conflict_detected: "flagged a conflict in",
};

const activityColors: Record<string, string> = {
  created: "border-l-update",
  updated: "border-l-info",
  deleted: "border-l-destructive",
  acknowledged: "border-l-success",
  conflict_detected: "border-l-conflict",
};

// Get time-based greeting
function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function Index() {
  const navigate = useNavigate();
  const [queryText, setQueryText] = useState("");
  const [showVoiceDialog, setShowVoiceDialog] = useState(false);
  const [isQuerying, setIsQuerying] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: activities, isLoading: activitiesLoading } = useRecentActivity(8);
  const { decisions } = useDecisions();
  const { conflicts } = useConflicts();

  const { isRecording, isTranscribing, toggleRecording } = useVoiceRecording({
    onTranscriptionComplete: (text) => {
      setQueryText(text);
      toast.success("Voice transcribed! You can now submit your query.");
    },
    onError: (error) => {
      toast.error(`Voice recording failed: ${error}`);
    },
  });

  const handleAsk = async (query: string) => {
    if (!query.trim()) return;

    setIsQuerying(true);
    setAiResponse(null);

    try {
      // Fetch context data
      const [decisionsRes, peopleRes, projectsRes] = await Promise.all([
        supabase.from("decisions").select("id, title").limit(10),
        supabase.from("persons").select("id, name").limit(10),
        supabase.from("projects").select("id, name").limit(10),
      ]);

      const context = {
        decisionsCount: decisions.length,
        peopleCount: peopleRes.data?.length || 0,
        projectsCount: projectsRes.data?.length || 0,
        recentDecisions: decisionsRes.data || [],
        recentPeople: peopleRes.data || [],
        recentProjects: projectsRes.data || [],
      };

      const response = await supabase.functions.invoke("query-ai", {
        body: { query, context },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      setAiResponse(response.data.answer);
      setQueryText("");
    } catch (error) {
      console.error("AI query error:", error);
      toast.error(`Query failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsQuerying(false);
    }
  };

  const handleVoice = () => {
    toggleRecording();
    if (!isRecording) {
      toast.info("Recording... Click again to stop and transcribe.");
    }
  };

  const handleUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      toast.info(`Opening ${file.name} in Ingest...`);
      navigate("/ingest");
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleWhatChangedToday = () => {
    setShowVoiceDialog(true);
  };

  const pendingConflicts = conflicts.filter((c) => c.status === "detected" || c.status === "reviewing");
  const todayDecisions = decisions.filter((d) => {
    const today = new Date();
    const decisionDate = new Date(d.created_at);
    return decisionDate.toDateString() === today.toDateString();
  });

  return (
    <AppLayout>
      <div className="p-8">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".txt,.md,.pdf"
          onChange={handleFileChange}
        />

        {/* Header with greeting */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                {getGreeting()}
              </p>
              <h1 className="text-2xl font-semibold tracking-tight">
                Command Center
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Real-time organizational pulse
              </p>
            </div>
            <Button 
              variant="outline" 
              className="gap-2 rounded-xl border-border/50 shadow-soft-xs hover:shadow-soft-sm transition-all gradient-border"
              onClick={handleWhatChangedToday}
            >
              <Volume2 className="h-4 w-4" />
              What changed today?
            </Button>
          </div>
        </motion.div>

        {/* Quick Input */}
        <QuickInput
          value={queryText}
          onChange={setQueryText}
          onSubmit={handleAsk}
          onVoice={handleVoice}
          onUpload={handleUpload}
          isRecording={isRecording}
          isTranscribing={isTranscribing || isQuerying}
          placeholder={isQuerying ? "Thinking..." : undefined}
          className="mb-4"
        />

        {/* AI Response */}
        {aiResponse && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-primary/10 p-2.5">
                    <Sparkles className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm leading-relaxed">{aiResponse}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2 h-7 px-2 text-xs hover:bg-primary/5"
                      onClick={() => setAiResponse(null)}
                    >
                      Dismiss
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Metrics Grid */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Decisions Today"
            value={todayDecisions.length}
            subtitle={todayDecisions.length === 0 ? "No decisions yet" : `${todayDecisions.length} new today`}
            icon={<FileText className="h-5 w-5 text-muted-foreground" />}
            trend={todayDecisions.length > 0 ? "up" : "neutral"}
          />
          <MetricCard
            title="Conflicts Detected"
            value={pendingConflicts.length}
            subtitle={pendingConflicts.length === 0 ? "All clear" : `${pendingConflicts.length} need review`}
            icon={<AlertTriangle className="h-5 w-5 text-conflict" />}
            variant={pendingConflicts.length > 0 ? "conflict" : "default"}
          />
          <MetricCard
            title="Total Decisions"
            value={decisions.length}
            subtitle="In the ledger"
            icon={<Clock className="h-5 w-5 text-muted-foreground" />}
          />
          <MetricCard
            title="Ownership Gaps"
            value={0}
            subtitle="Fully assigned"
            icon={<Users className="h-5 w-5 text-update" />}
            variant="success"
          />
        </div>

        {/* Two Column Layout */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Activity Feed */}
          <Card className="lg:col-span-2 border-border/50 shadow-soft-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-base font-medium">
                Recent Activity
              </CardTitle>
              <div className="flex items-center gap-2 rounded-full bg-update/10 px-2.5 py-1 text-xs font-medium text-update">
                <div className="relative flex h-2 w-2 items-center justify-center">
                  <div className="absolute h-2 w-2 animate-ping rounded-full bg-update/50" />
                  <div className="h-1.5 w-1.5 rounded-full bg-update" />
                </div>
                Live
              </div>
            </CardHeader>
            <CardContent>
              {activitiesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : activities && activities.length > 0 ? (
                <div className="space-y-1">
                  {activities.map((activity, index) => (
                    <ActivityRow key={activity.id} activity={activity} index={index} />
                  ))}
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center py-12"
                >
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5">
                    <Sparkles className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="mb-2 text-lg font-medium">No activity yet</h3>
                  <p className="mb-6 max-w-sm text-center text-sm text-muted-foreground">
                    Start by ingesting documents, adding decisions, or importing your organizational data.
                  </p>
                  <Button className="gap-2 rounded-xl" onClick={() => navigate("/ingest")}>
                    Get Started
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </motion.div>
              )}
            </CardContent>
          </Card>

          {/* Voice Agent */}
          <Card className="border-border/50 shadow-soft-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-medium">
                AI Voice Assistant
              </CardTitle>
            </CardHeader>
            <CardContent>
              <VoiceAgent 
                className="border-0 p-0"
                onMessage={(message, isUser) => {
                  console.log(isUser ? "User:" : "Agent:", message);
                }}
              />
            </CardContent>
          </Card>
        </div>

        {/* What Changed Today Dialog */}
        <Dialog open={showVoiceDialog} onOpenChange={setShowVoiceDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Volume2 className="h-5 w-5" />
                What changed today?
              </DialogTitle>
            </DialogHeader>
            <VoiceAgent 
              onMessage={(message, isUser) => {
                console.log(isUser ? "User:" : "Agent:", message);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}

function ActivityRow({ activity, index }: { activity: ActivityItem; index: number }) {
  const Icon = activityIcons[activity.entityType] || GitCommit;
  const eventLabel = eventLabels[activity.type] || activity.type;
  const borderColor = activityColors[activity.type] || "border-l-border";

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      className={cn(
        "group flex items-center gap-3 rounded-lg border-l-2 p-3 transition-all hover:bg-muted/50",
        borderColor,
        index % 2 === 0 ? "bg-transparent" : "bg-muted/20"
      )}
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted transition-transform group-hover:scale-105">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm">
          <span className="capitalize text-muted-foreground">{eventLabel}</span>{" "}
          <span className="font-medium">{activity.entityName}</span>
        </p>
        <p className="text-xs text-muted-foreground/70">
          {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
        </p>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground/0 transition-all group-hover:text-muted-foreground group-hover:translate-x-0.5" />
    </motion.div>
  );
}
