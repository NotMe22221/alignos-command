import { motion } from "framer-motion";
import {
  Radio,
  CheckCircle,
  Clock,
  AlertCircle,
  Users,
  ArrowRight,
  FileText,
  Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { usePropagationData, type PropagationItem } from "@/hooks/usePropagationData";
import { useDecisions } from "@/hooks/useDecisions";

function PropagationCard({ item }: { item: PropagationItem }) {
  const progress = item.totalStakeholders > 0 
    ? (item.acknowledged / item.totalStakeholders) * 100 
    : 0;
  
  const getStatus = () => {
    if (item.totalStakeholders === 0) return { label: "No Stakeholders", color: "bg-muted" };
    if (item.acknowledged === item.totalStakeholders) return { label: "Complete", color: "bg-update" };
    if (item.acknowledged > 0) return { label: "In Progress", color: "bg-info" };
    return { label: "Pending", color: "bg-conflict" };
  };

  const status = getStatus();

  return (
    <Card>
      <CardContent className="p-4">
        <div className="mb-3 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium">{item.decision.title}</h3>
              <p className="text-xs text-muted-foreground">
                {item.acknowledged} of {item.totalStakeholders} acknowledged
              </p>
            </div>
          </div>
          <Badge variant="secondary" className={status.color}>
            {status.label}
          </Badge>
        </div>

        <Progress value={progress} className="mb-3 h-2" />

        {item.stakeholders.length > 0 && (
          <div className="flex items-center gap-1">
            {item.stakeholders.slice(0, 5).map((s, i) => (
              <Avatar key={i} className="h-6 w-6 border-2 border-background">
                <AvatarFallback className={`text-[10px] ${s.acknowledgedAt ? 'bg-update text-update-foreground' : 'bg-muted'}`}>
                  {s.person?.name?.substring(0, 2).toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
            ))}
            {item.stakeholders.length > 5 && (
              <span className="ml-1 text-xs text-muted-foreground">
                +{item.stakeholders.length - 5} more
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Propagation() {
  const navigate = useNavigate();
  const { items, stats, isLoading } = usePropagationData();
  const { decisions } = useDecisions();

  // Include all decisions, not just those with acknowledgments
  const allDecisions = decisions.filter(d => d.status === "active" || d.status === "draft");

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
                Track how decisions spread across your organization and who has acknowledged them
              </p>
            </div>
          </div>
        </motion.div>

        {/* What is this? Explainer */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-6"
        >
          <Card className="border-info/20 bg-info/5">
            <CardContent className="p-4">
              <h3 className="mb-2 font-medium">What is Propagation & Awareness?</h3>
              <p className="text-sm text-muted-foreground">
                When important decisions are made, stakeholders need to be informed and acknowledge them.
                This view tracks:
              </p>
              <ul className="mt-2 list-inside list-disc text-sm text-muted-foreground">
                <li><strong>Fully Propagated</strong>: Everyone who needs to know has acknowledged</li>
                <li><strong>In Progress</strong>: Some stakeholders have acknowledged, others pending</li>
                <li><strong>Stuck</strong>: No one has acknowledged yet - needs attention</li>
              </ul>
            </CardContent>
          </Card>
        </motion.div>

        {/* Summary Cards */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-update/10">
                <CheckCircle className="h-6 w-6 text-update" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{stats.fullyPropagated}</p>
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
                <p className="text-2xl font-semibold">{stats.inProgress}</p>
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
                <p className="text-2xl font-semibold">{stats.stuck}</p>
                <p className="text-sm text-muted-foreground">Stuck</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : items.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
          >
            {items.map((item) => (
              <PropagationCard key={item.decision.id} item={item} />
            ))}
          </motion.div>
        ) : allDecisions.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-info/10 to-info/5">
                  <Users className="h-10 w-10 text-info" />
                </div>
                <h3 className="mb-2 text-xl font-medium">Decisions exist, but no stakeholders assigned</h3>
                <p className="mb-6 max-w-md text-center text-muted-foreground">
                  You have {allDecisions.length} decision(s) in your ledger, but none have stakeholders assigned for acknowledgment tracking.
                  Assign stakeholders to decisions to start tracking propagation.
                </p>
                <Button className="gap-2" onClick={() => navigate("/ledger")}>
                  View Decision Ledger
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5">
                  <Users className="h-10 w-10 text-primary" />
                </div>
                <h3 className="mb-2 text-xl font-medium">No decisions to track yet</h3>
                <p className="mb-6 max-w-md text-center text-muted-foreground">
                  When decisions are created and stakeholders are assigned, you'll see the awareness propagation status here.
                  Start by importing organizational data and creating decisions.
                </p>
                <Button className="gap-2" onClick={() => navigate("/ingest")}>
                  Import Data
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </AppLayout>
  );
}
