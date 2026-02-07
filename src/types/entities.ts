// AlignOS Core Entity Types

export type EntityType = 'person' | 'team' | 'project' | 'decision' | 'document' | 'source';

export interface Person {
  id: string;
  name: string;
  email: string;
  role: string;
  team_id: string | null;
  avatar_url?: string;
  created_at: string;
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  parent_team_id: string | null;
  created_at: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  owner_id: string | null;
  team_id: string | null;
  status: 'active' | 'completed' | 'on_hold' | 'archived';
  created_at: string;
}

export interface Decision {
  id: string;
  title: string;
  description: string;
  rationale?: string;
  status: 'draft' | 'active' | 'superseded' | 'deprecated';
  project_id?: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface DecisionVersion {
  id: string;
  decision_id: string;
  version: number;
  content: {
    title: string;
    description: string;
    rationale?: string;
  };
  changed_by: string | null;
  changed_at: string;
  change_summary?: string;
}

export interface Document {
  id: string;
  title: string;
  type: 'transcript' | 'document' | 'notes' | 'email' | 'other';
  source_url?: string;
  content?: string;
  created_at: string;
}

export interface Source {
  id: string;
  type: 'text' | 'file' | 'voice' | 'api';
  raw_content: string;
  processed_content?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface Event {
  id: string;
  entity_type: EntityType;
  entity_id: string;
  event_type: 'created' | 'updated' | 'deleted' | 'acknowledged' | 'conflict_detected';
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface Relationship {
  id: string;
  source_type: EntityType;
  source_id: string;
  target_type: EntityType;
  target_id: string;
  relationship_type: 'owns' | 'member_of' | 'depends_on' | 'relates_to' | 'affects' | 'stakeholder';
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface Acknowledgment {
  id: string;
  decision_id: string;
  person_id: string;
  acknowledged_at: string | null;
  created_at: string;
}

export interface Conflict {
  id: string;
  type: 'duplicate' | 'contradiction' | 'timeline_mismatch' | 'ownership_overlap' | 'stale';
  entity_ids: string[];
  status: 'detected' | 'reviewing' | 'resolved' | 'dismissed';
  description: string;
  suggested_resolution?: string;
  created_at: string;
  resolved_at?: string;
}

// Graph node representation for visualization
export interface GraphNode {
  id: string;
  type: EntityType;
  label: string;
  data: Person | Team | Project | Decision | Document;
}

export interface GraphLink {
  source: string;
  target: string;
  type: Relationship['relationship_type'];
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

// AI Extraction results
export interface ExtractionResult {
  decisions: Partial<Decision>[];
  people: Partial<Person>[];
  projects: Partial<Project>[];
  relationships: Partial<Relationship>[];
  suggested_stakeholders: string[];
  conflicts: Partial<Conflict>[];
  summary: string;
}

// Metrics for Command Center
export interface DashboardMetrics {
  decisions_today: number;
  conflicts_detected: number;
  pending_acknowledgments: number;
  ownership_gaps: number;
  total_decisions: number;
  total_people: number;
  total_projects: number;
}
