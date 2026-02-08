import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export interface PropagationItem {
  decision: Tables<"decisions">;
  totalStakeholders: number;
  acknowledged: number;
  pending: number;
  stakeholders: {
    person: Tables<"persons">;
    acknowledgedAt: string | null;
  }[];
}

export type PropagationStatus = "propagated" | "in_progress" | "stuck";

async function fetchPropagationData(): Promise<PropagationItem[]> {
  // Fetch decisions with their acknowledgments
  const { data: decisions, error: decisionsError } = await supabase
    .from("decisions")
    .select("*")
    .eq("status", "active")
    .order("updated_at", { ascending: false });

  if (decisionsError) throw decisionsError;
  if (!decisions || decisions.length === 0) return [];

  const decisionIds = decisions.map((d) => d.id);

  // Fetch acknowledgments for these decisions
  const { data: acknowledgments, error: ackError } = await supabase
    .from("acknowledgments")
    .select("*, persons(*)")
    .in("decision_id", decisionIds);

  if (ackError) throw ackError;

  // Group acknowledgments by decision
  const ackByDecision = (acknowledgments || []).reduce((acc, ack) => {
    if (!acc[ack.decision_id]) acc[ack.decision_id] = [];
    acc[ack.decision_id].push(ack);
    return acc;
  }, {} as Record<string, typeof acknowledgments>);

  // Build propagation items
  return decisions.map((decision) => {
    const acks = ackByDecision[decision.id] || [];
    const acknowledged = acks.filter((a) => a.acknowledged_at !== null).length;
    
    return {
      decision,
      totalStakeholders: acks.length,
      acknowledged,
      pending: acks.length - acknowledged,
      stakeholders: acks.map((a) => ({
        person: a.persons as Tables<"persons">,
        acknowledgedAt: a.acknowledged_at,
      })),
    };
  });
}

export function usePropagationData() {
  const query = useQuery({
    queryKey: ["propagation-data"],
    queryFn: fetchPropagationData,
  });

  const items = query.data || [];
  
  // Calculate summary stats
  const fullyPropagated = items.filter(
    (i) => i.totalStakeholders > 0 && i.acknowledged === i.totalStakeholders
  ).length;
  
  const inProgress = items.filter(
    (i) => i.totalStakeholders > 0 && i.acknowledged > 0 && i.acknowledged < i.totalStakeholders
  ).length;
  
  const stuck = items.filter(
    (i) => i.totalStakeholders > 0 && i.acknowledged === 0
  ).length;
  
  const noStakeholders = items.filter((i) => i.totalStakeholders === 0).length;

  return {
    items,
    stats: {
      fullyPropagated,
      inProgress,
      stuck,
      noStakeholders,
    },
    isLoading: query.isLoading,
    error: query.error,
  };
}
