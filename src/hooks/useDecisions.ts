import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type DecisionWithMeta = Tables<"decisions"> & {
  versions: Tables<"decision_versions">[];
  acknowledgments: { total: number; acknowledged: number };
};

async function fetchDecisions(): Promise<DecisionWithMeta[]> {
  // Fetch decisions
  const { data: decisions, error: decisionsError } = await supabase
    .from("decisions")
    .select("*")
    .order("updated_at", { ascending: false });

  if (decisionsError) throw decisionsError;
  if (!decisions) return [];

  // Fetch versions for all decisions
  const decisionIds = decisions.map((d) => d.id);
  
  const { data: versions, error: versionsError } = await supabase
    .from("decision_versions")
    .select("*")
    .in("decision_id", decisionIds)
    .order("version", { ascending: false });

  if (versionsError) throw versionsError;

  // Fetch acknowledgments for all decisions
  const { data: acknowledgments, error: ackError } = await supabase
    .from("acknowledgments")
    .select("*")
    .in("decision_id", decisionIds);

  if (ackError) throw ackError;

  // Group versions by decision_id
  const versionsByDecision = (versions || []).reduce((acc, v) => {
    if (!acc[v.decision_id]) acc[v.decision_id] = [];
    acc[v.decision_id].push(v);
    return acc;
  }, {} as Record<string, Tables<"decision_versions">[]>);

  // Group acknowledgments by decision_id
  const acksByDecision = (acknowledgments || []).reduce((acc, a) => {
    if (!acc[a.decision_id]) acc[a.decision_id] = { total: 0, acknowledged: 0 };
    acc[a.decision_id].total++;
    if (a.acknowledged_at) acc[a.decision_id].acknowledged++;
    return acc;
  }, {} as Record<string, { total: number; acknowledged: number }>);

  // Combine data
  return decisions.map((decision) => ({
    ...decision,
    versions: versionsByDecision[decision.id] || [],
    acknowledgments: acksByDecision[decision.id] || { total: 0, acknowledged: 0 },
  }));
}

export function useDecisions() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["decisions"],
    queryFn: fetchDecisions,
  });

  // Subscribe to realtime updates
  useEffect(() => {
    const channel = supabase
      .channel("decisions-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "decisions" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["decisions"] });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "decision_versions" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["decisions"] });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "acknowledgments" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["decisions"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return {
    decisions: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
