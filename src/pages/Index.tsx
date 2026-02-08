import { motion } from "framer-motion";
import {
  FileText,
  AlertTriangle,
  Clock,
  Users,
  Volume2,
  TrendingUp,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { MetricCard } from "@/components/shared/MetricCard";
import { QuickInput } from "@/components/shared/QuickInput";
import { VoiceAgent } from "@/components/shared/VoiceAgent";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
            value={0}
            subtitle="No decisions yet"
            icon={<FileText className="h-5 w-5 text-muted-foreground" />}
          />
          <MetricCard
            title="Conflicts Detected"
            value={0}
            subtitle="All clear"
            icon={<AlertTriangle className="h-5 w-5 text-muted-foreground" />}
          />
          <MetricCard
            title="Pending Acknowledgments"
            value={0}
            subtitle="Nothing pending"
            icon={<Clock className="h-5 w-5 text-muted-foreground" />}
          />
          <MetricCard
            title="Ownership Gaps"
            value={0}
            subtitle="Fully assigned"
            icon={<Users className="h-5 w-5 text-muted-foreground" />}
          />
        </div>

        {/* Two Column Layout */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Activity Feed - Empty State */}
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
            <CardContent>
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
                <Button className="gap-2">
                  Get Started
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </motion.div>
            </CardContent>
          </Card>

          {/* Voice Agent */}
          <Card>
            <CardHeader>
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
      </div>
    </AppLayout>
  );
}
