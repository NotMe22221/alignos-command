import { useState } from "react";
import { motion } from "framer-motion";
import {
  Radio,
  Users,
  CheckCircle,
  Clock,
  AlertCircle,
  Send,
  ChevronDown,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

// Mock propagation data
interface StakeholderStatus {
  id: string;
  name: string;
  role: string;
  team: string;
  acknowledged: boolean;
  acknowledgedAt?: string;
  notifiedAt: string;
}

interface PropagationItem {
  id: string;
  decision: string;
  status: "complete" | "in_progress" | "stuck";
  stakeholders: StakeholderStatus[];
  createdAt: string;
}

const mockPropagation: PropagationItem[] = [
  {
    id: "p1",
    decision: "Q3 Cloud Migration Timeline",
    status: "in_progress",
    createdAt: "2024-01-15T10:00:00Z",
    stakeholders: [
      { id: "s1", name: "Sarah Chen", role: "Engineering Lead", team: "Engineering", acknowledged: true, acknowledgedAt: "2024-01-15T11:00:00Z", notifiedAt: "2024-01-15T10:00:00Z" },
      { id: "s2", name: "Marcus Johnson", role: "Product Manager", team: "Product", acknowledged: true, acknowledgedAt: "2024-01-15T14:00:00Z", notifiedAt: "2024-01-15T10:00:00Z" },
      { id: "s3", name: "Emily Watson", role: "Designer", team: "Design", acknowledged: false, notifiedAt: "2024-01-15T10:00:00Z" },
      { id: "s4", name: "Alex Rivera", role: "Backend Engineer", team: "Engineering", acknowledged: false, notifiedAt: "2024-01-15T10:00:00Z" },
      { id: "s5", name: "Jordan Lee", role: "DevOps", team: "Infrastructure", acknowledged: true, acknowledgedAt: "2024-01-15T12:00:00Z", notifiedAt: "2024-01-15T10:00:00Z" },
    ],
  },
  {
    id: "p2",
    decision: "Feature Freeze During Migration",
    status: "complete",
    createdAt: "2024-01-16T09:00:00Z",
    stakeholders: [
      { id: "s1", name: "Sarah Chen", role: "Engineering Lead", team: "Engineering", acknowledged: true, acknowledgedAt: "2024-01-16T10:00:00Z", notifiedAt: "2024-01-16T09:00:00Z" },
      { id: "s2", name: "Marcus Johnson", role: "Product Manager", team: "Product", acknowledged: true, acknowledgedAt: "2024-01-16T09:30:00Z", notifiedAt: "2024-01-16T09:00:00Z" },
      { id: "s6", name: "Taylor Kim", role: "QA Lead", team: "Quality", acknowledged: true, acknowledgedAt: "2024-01-16T11:00:00Z", notifiedAt: "2024-01-16T09:00:00Z" },
    ],
  },
  {
    id: "p3",
    decision: "New Design System Adoption",
    status: "stuck",
    createdAt: "2024-01-18T11:00:00Z",
    stakeholders: [
      { id: "s3", name: "Emily Watson", role: "Designer", team: "Design", acknowledged: true, acknowledgedAt: "2024-01-18T12:00:00Z", notifiedAt: "2024-01-18T11:00:00Z" },
      { id: "s7", name: "Chris Park", role: "Frontend Lead", team: "Engineering", acknowledged: false, notifiedAt: "2024-01-18T11:00:00Z" },
      { id: "s8", name: "Sam Martinez", role: "Design System Lead", team: "Design", acknowledged: false, notifiedAt: "2024-01-18T11:00:00Z" },
    ],
  },
];

const statusConfig = {
  complete: { icon: CheckCircle, color: "text-update", bg: "bg-update/10", label: "Complete" },
  in_progress: { icon: Clock, color: "text-info", bg: "bg-info/10", label: "In Progress" },
  stuck: { icon: AlertCircle, color: "text-conflict", bg: "bg-conflict/10", label: "Stuck" },
};

export default function Propagation() {
  const [expandedItems, setExpandedItems] = useState<string[]>([mockPropagation[0].id]);

  const toggleExpand = (id: string) => {
    setExpandedItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const getProgress = (stakeholders: StakeholderStatus[]) => {
    const acknowledged = stakeholders.filter((s) => s.acknowledged).length;
    return (acknowledged / stakeholders.length) * 100;
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
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Radio className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                Propagation & Awareness
              </h1>
              <p className="text-sm text-muted-foreground">
                Track information flow across stakeholders
              </p>
            </div>
          </div>
        </motion.div>

        {/* Summary Cards */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-update/10">
                <CheckCircle className="h-6 w-6 text-update" />
              </div>
              <div>
                <p className="text-2xl font-semibold">1</p>
                <p className="text-sm text-muted-foreground">Fully Propagated</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-info/10">
                <Clock className="h-6 w-6 text-info" />
              </div>
              <div>
                <p className="text-2xl font-semibold">1</p>
                <p className="text-sm text-muted-foreground">In Progress</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-conflict/10">
                <AlertCircle className="h-6 w-6 text-conflict" />
              </div>
              <div>
                <p className="text-2xl font-semibold">1</p>
                <p className="text-sm text-muted-foreground">Stuck</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Propagation List */}
        <div className="space-y-4">
          {mockPropagation.map((item, index) => {
            const config = statusConfig[item.status];
            const StatusIcon = config.icon;
            const isExpanded = expandedItems.includes(item.id);
            const progress = getProgress(item.stakeholders);
            const acknowledgedCount = item.stakeholders.filter((s) => s.acknowledged).length;

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card>
                  <CardHeader
                    className="cursor-pointer"
                    onClick={() => toggleExpand(item.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", config.bg)}>
                          <StatusIcon className={cn("h-5 w-5", config.color)} />
                        </div>
                        <div>
                          <CardTitle className="text-base">{item.decision}</CardTitle>
                          <div className="mt-1 flex items-center gap-2">
                            <Badge variant="secondary" className={cn("text-xs", config.bg, config.color)}>
                              {config.label}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {acknowledgedCount}/{item.stakeholders.length} acknowledged
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-32">
                          <Progress value={progress} className="h-2" />
                        </div>
                        <ChevronDown
                          className={cn(
                            "h-5 w-5 text-muted-foreground transition-transform",
                            isExpanded && "rotate-180"
                          )}
                        />
                      </div>
                    </div>
                  </CardHeader>

                  {isExpanded && (
                    <CardContent className="pt-0">
                      <div className="mt-4 border-t pt-4">
                        <div className="mb-4 flex items-center justify-between">
                          <h4 className="text-sm font-medium">Stakeholders</h4>
                          {item.status !== "complete" && (
                            <Button size="sm" variant="outline" className="gap-2">
                              <Send className="h-3 w-3" />
                              Nudge All
                            </Button>
                          )}
                        </div>
                        <div className="space-y-3">
                          {item.stakeholders.map((stakeholder) => (
                            <div
                              key={stakeholder.id}
                              className="flex items-center justify-between rounded-lg bg-muted/50 p-3"
                            >
                              <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                                  <Users className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium">{stakeholder.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {stakeholder.role} · {stakeholder.team}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                {stakeholder.acknowledged ? (
                                  <div className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-update" />
                                    <span className="text-xs text-muted-foreground">
                                      {formatDate(stakeholder.acknowledgedAt!)}
                                    </span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-pending" />
                                    <span className="text-xs text-muted-foreground">Pending</span>
                                    <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs">
                                      <Send className="h-3 w-3" />
                                      Nudge
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}
