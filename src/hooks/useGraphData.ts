import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export interface GraphNode {
  id: string;
  type: "person" | "team" | "project" | "decision";
  label: string;
  data: Tables<"persons"> | Tables<"teams"> | Tables<"projects"> | Tables<"decisions">;
}

export interface GraphLink {
  source: string;
  target: string;
  type: string;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

async function fetchGraphData(): Promise<GraphData> {
  const nodes: GraphNode[] = [];
  const links: GraphLink[] = [];

  // Fetch all entity types in parallel
  const [personsRes, teamsRes, projectsRes, decisionsRes, relationshipsRes] = await Promise.all([
    supabase.from("persons").select("*"),
    supabase.from("teams").select("*"),
    supabase.from("projects").select("*"),
    supabase.from("decisions").select("*"),
    supabase.from("relationships").select("*"),
  ]);

  // Add persons as nodes
  if (personsRes.data) {
    for (const person of personsRes.data) {
      nodes.push({
        id: person.id,
        type: "person",
        label: person.name,
        data: person,
      });
      
      // Link person to team if they have one
      if (person.team_id) {
        links.push({
          source: person.id,
          target: person.team_id,
          type: "member_of",
        });
      }
    }
  }

  // Add teams as nodes
  if (teamsRes.data) {
    for (const team of teamsRes.data) {
      nodes.push({
        id: team.id,
        type: "team",
        label: team.name,
        data: team,
      });
      
      // Link to parent team if exists
      if (team.parent_team_id) {
        links.push({
          source: team.id,
          target: team.parent_team_id,
          type: "member_of",
        });
      }
    }
  }

  // Add projects as nodes
  if (projectsRes.data) {
    for (const project of projectsRes.data) {
      nodes.push({
        id: project.id,
        type: "project",
        label: project.name,
        data: project,
      });
      
      // Link project to owner
      if (project.owner_id) {
        links.push({
          source: project.id,
          target: project.owner_id,
          type: "owns",
        });
      }
      
      // Link project to team
      if (project.team_id) {
        links.push({
          source: project.id,
          target: project.team_id,
          type: "member_of",
        });
      }
    }
  }

  // Add decisions as nodes
  if (decisionsRes.data) {
    for (const decision of decisionsRes.data) {
      nodes.push({
        id: decision.id,
        type: "decision",
        label: decision.title,
        data: decision,
      });
      
      // Link decision to creator
      if (decision.created_by) {
        links.push({
          source: decision.id,
          target: decision.created_by,
          type: "owns",
        });
      }
      
      // Link decision to project
      if (decision.project_id) {
        links.push({
          source: decision.id,
          target: decision.project_id,
          type: "relates_to",
        });
      }
    }
  }

  // Add explicit relationships
  if (relationshipsRes.data) {
    for (const rel of relationshipsRes.data) {
      links.push({
        source: rel.source_id,
        target: rel.target_id,
        type: rel.relationship_type,
      });
    }
  }

  // Filter links to only include those where both source and target exist
  const nodeIds = new Set(nodes.map(n => n.id));
  const validLinks = links.filter(l => nodeIds.has(l.source) && nodeIds.has(l.target));

  return { nodes, links: validLinks };
}

export function useGraphData() {
  return useQuery({
    queryKey: ["graph-data"],
    queryFn: fetchGraphData,
  });
}
