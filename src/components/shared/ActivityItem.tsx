import { motion } from "framer-motion";
import { 
  FileText, 
  Users, 
  FolderOpen, 
  AlertCircle, 
  CheckCircle,
  Clock
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Event, EntityType } from "@/types/entities";

interface ActivityItemProps {
  event: Event;
  entityName?: string;
  index?: number;
}

const entityIcons: Record<EntityType, typeof FileText> = {
  decision: FileText,
  person: Users,
  project: FolderOpen,
  team: Users,
  document: FileText,
  source: FileText,
};

const eventStyles: Record<Event['event_type'], { icon: typeof FileText; color: string }> = {
  created: { icon: CheckCircle, color: "text-update" },
  updated: { icon: Clock, color: "text-info" },
  deleted: { icon: AlertCircle, color: "text-destructive" },
  acknowledged: { icon: CheckCircle, color: "text-update" },
  conflict_detected: { icon: AlertCircle, color: "text-conflict" },
};

export function ActivityItem({ event, entityName, index = 0 }: ActivityItemProps) {
  const EntityIcon = entityIcons[event.entity_type] || FileText;
  const eventStyle = eventStyles[event.event_type];
  const EventIcon = eventStyle?.icon || Clock;

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="group flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-muted/50"
    >
      {/* Entity icon */}
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
        <EntityIcon className="h-4 w-4 text-muted-foreground" />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <EventIcon className={cn("h-3 w-3", eventStyle?.color)} />
          <span className="text-sm font-medium capitalize">
            {event.event_type.replace("_", " ")}
          </span>
          <span className="text-sm text-muted-foreground">·</span>
          <span className="text-sm text-muted-foreground capitalize">
            {event.entity_type}
          </span>
        </div>
        {entityName && (
          <p className="mt-0.5 truncate text-sm text-foreground">
            {entityName}
          </p>
        )}
        <p className="mt-1 text-xs text-muted-foreground">
          {formatTime(event.created_at)}
        </p>
      </div>
    </motion.div>
  );
}
