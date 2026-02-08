import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type ConflictWithDetails = Tables<"conflicts">;

async function fetchConflicts(): Promise<ConflictWithDetails[]> {
  const { data, error } = await supabase
    .from("conflicts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export function useConflicts() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["conflicts"],
    queryFn: fetchConflicts,
  });

  // Subscribe to realtime updates
  useEffect(() => {
    const channel = supabase
      .channel("conflicts-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "conflicts" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["conflicts"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const conflicts = query.data || [];
  
  // Calculate stats by status
  const detected = conflicts.filter((c) => c.status === "detected").length;
  const reviewing = conflicts.filter((c) => c.status === "reviewing").length;
  const resolved = conflicts.filter((c) => c.status === "resolved").length;

  return {
    conflicts,
    stats: {
      detected,
      reviewing,
      resolved,
      total: conflicts.length,
    },
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
