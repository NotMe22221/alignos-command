import { motion } from "framer-motion";
import {
  FileText,
  AlertTriangle,
  Clock,
  Users,
  Volume2,
  TrendingUp,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { MetricCard } from "@/components/shared/MetricCard";
import { QuickInput } from "@/components/shared/QuickInput";
import { ActivityItem } from "@/components/shared/ActivityItem";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Event, DashboardMetrics } from "@/types/entities";

// Mock data - will be replaced with real data from Supabase
const mockMetrics: DashboardMetrics = {
  decisions_today: 7,
  conflicts_detected: 2,
  pending_acknowledgments: 14,
  ownership_gaps: 3,
  total_decisions: 156,
  total_people: 48,
  total_projects: 12,
};

const mockEvents: (Event & { entityName: string })[] = [
  {
    id: "1",
    entity_type: "decision",
    entity_id: "d1",
    event_type: "created",
    created_at: new Date(Date.now() - 5 * 60000).toISOString(),
    entityName: "Q2 Product Roadmap Finalized",
  },
  {
    id: "2",
    entity_type: "decision",
    entity_id: "d2",
    event_type: "updated",
    created_at: new Date(Date.now() - 45 * 60000).toISOString(),
    entityName: "Engineering Hiring Plan 2024",
  },
  {
    id: "3",
    entity_type: "project",
    entity_id: "p1",
    event_type: "conflict_detected",
    created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
    entityName: "Mobile App Redesign",
  },
  {
    id: "4",
    entity_type: "person",
    entity_id: "u1",
    event_type: "acknowledged",
    created_at: new Date(Date.now() - 4 * 3600000).toISOString(),
    entityName: "Sarah Chen acknowledged Budget Decision",
  },
  {
    id: "5",
    entity_type: "decision",
    entity_id: "d3",
    event_type: "created",
    created_at: new Date(Date.now() - 8 * 3600000).toISOString(),
    entityName: "New API Versioning Strategy",
  },
];

export default function Index() {
  const handleAsk = (query: string) => {
    console.log("Query:", query);
    // TODO: Implement AI query
  };

  const handleVoice = () => {
    console.log("Voice recording started");
    // TODO: Implement voice recording
  };

  const handleUpload = () => {
    console.log("Upload triggered");
    // TODO: Implement file upload
  };

  return (
    <AppLayout>
      <div className="p-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                Command Center
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Real-time organizational pulse
              </p>
            </div>
            <Button variant="outline" className="gap-2">
              <Volume2 className="h-4 w-4" />
              What changed today?
            </Button>
          </div>
        </motion.div>

        {/* Quick Input */}
        <QuickInput
          onSubmit={handleAsk}
          onVoice={handleVoice}
          onUpload={handleUpload}
          className="mb-8"
        />

        {/* Metrics Grid */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Decisions Today"
            value={mockMetrics.decisions_today}
            subtitle="3 more than yesterday"
            icon={<FileText className="h-5 w-5 text-muted-foreground" />}
            trend="up"
          />
          <MetricCard
            title="Conflicts Detected"
            value={mockMetrics.conflicts_detected}
            subtitle="Requires attention"
            icon={<AlertTriangle className="h-5 w-5 text-conflict" />}
            variant="conflict"
          />
          <MetricCard
            title="Pending Acknowledgments"
            value={mockMetrics.pending_acknowledgments}
            subtitle="Across 8 decisions"
            icon={<Clock className="h-5 w-5 text-pending" />}
            variant="pending"
          />
          <MetricCard
            title="Ownership Gaps"
            value={mockMetrics.ownership_gaps}
            subtitle="Unassigned decisions"
            icon={<Users className="h-5 w-5 text-muted-foreground" />}
          />
        </div>

        {/* Two Column Layout */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Activity Feed */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base font-medium">
                Recent Activity
              </CardTitle>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="h-2 w-2 animate-pulse rounded-full bg-update" />
                Live
              </div>
            </CardHeader>
            <CardContent className="space-y-1">
              {mockEvents.map((event, index) => (
                <ActivityItem
                  key={event.id}
                  event={event}
                  entityName={event.entityName}
                  index={index}
                />
              ))}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-medium">
                Organization Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Total Decisions</span>
                </div>
                <span className="font-medium">{mockMetrics.total_decisions}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">People Tracked</span>
                </div>
                <span className="font-medium">{mockMetrics.total_people}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Active Projects</span>
                </div>
                <span className="font-medium">{mockMetrics.total_projects}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
