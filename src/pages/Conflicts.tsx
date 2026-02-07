import { useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  GitMerge,
  Clock,
  Users,
  Shield,
  ArrowRight,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Conflict } from "@/types/entities";

const conflictTypeConfig: Record<Conflict["type"], { icon: typeof AlertTriangle; label: string; color: string }> = {
  duplicate: { icon: GitMerge, label: "Duplicate", color: "text-pending" },
  contradiction: { icon: AlertTriangle, label: "Contradiction", color: "text-conflict" },
  timeline_mismatch: { icon: Clock, label: "Timeline Mismatch", color: "text-warning" },
  ownership_overlap: { icon: Users, label: "Ownership Overlap", color: "text-info" },
  stale: { icon: Clock, label: "Stale", color: "text-muted-foreground" },
};

export default function Conflicts() {
  const [activeTab, setActiveTab] = useState<Conflict["status"] | "all">("all");

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
                  0 requiring attention
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

          {/* Empty List */}
          <div className="flex flex-1 flex-col items-center justify-center p-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
              <Shield className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="mb-1 text-sm font-medium">No conflicts</p>
            <p className="text-center text-xs text-muted-foreground">
              Your organization is conflict-free
            </p>
          </div>
        </div>

        {/* Empty Detail View */}
        <div className="flex flex-1 items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center text-center"
          >
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-update/10 to-update/5">
              <Shield className="h-10 w-10 text-update" />
            </div>
            <h2 className="mb-2 text-xl font-medium">All Clear</h2>
            <p className="mb-6 max-w-sm text-muted-foreground">
              No conflicts have been detected in your organizational data. Conflicts will appear here when the system detects contradictions, duplicates, or stale decisions.
            </p>
            <Card className="w-full max-w-sm">
              <CardContent className="p-4">
                <p className="mb-3 text-sm font-medium">Types of conflicts we detect:</p>
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
          </motion.div>
        </div>
      </div>
    </AppLayout>
  );
}
