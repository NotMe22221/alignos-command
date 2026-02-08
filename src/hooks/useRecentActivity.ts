import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type Event = Tables<"events">;

export interface ActivityItem {
  id: string;
  type: Event["event_type"];
  entityType: Event["entity_type"];
  entityId: string;
  entityName: string;
  timestamp: string;
  metadata: Record<string, any> | null;
}

export function useRecentActivity(limit = 10) {
  return useQuery({
    queryKey: ["recent-activity", limit],
    queryFn: async (): Promise<ActivityItem[]> => {
      // Fetch recent events
      const { data: events, error } = await supabase
        .from("events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      if (!events || events.length === 0) return [];

      // Fetch entity names for each event
      const activities: ActivityItem[] = [];

      for (const event of events) {
        let entityName = "Unknown";

        try {
          if (event.entity_type === "decision") {
            const { data } = await supabase
              .from("decisions")
              .select("title")
              .eq("id", event.entity_id)
              .maybeSingle();
            entityName = data?.title || "Deleted Decision";
          } else if (event.entity_type === "person") {
            const { data } = await supabase
              .from("persons")
              .select("name")
              .eq("id", event.entity_id)
              .maybeSingle();
            entityName = data?.name || "Deleted Person";
          } else if (event.entity_type === "project") {
            const { data } = await supabase
              .from("projects")
              .select("name")
              .eq("id", event.entity_id)
              .maybeSingle();
            entityName = data?.name || "Deleted Project";
          } else if (event.entity_type === "team") {
            const { data } = await supabase
              .from("teams")
              .select("name")
              .eq("id", event.entity_id)
              .maybeSingle();
            entityName = data?.name || "Deleted Team";
          }
        } catch {
          // Entity may have been deleted
        }

        activities.push({
          id: event.id,
          type: event.event_type,
          entityType: event.entity_type,
          entityId: event.entity_id,
          entityName,
          timestamp: event.created_at,
          metadata: event.metadata as Record<string, any> | null,
        });
      }

      return activities;
    },
    staleTime: 30000, // 30 seconds
  });
}
