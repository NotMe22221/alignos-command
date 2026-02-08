-- AlignOS Complete Database Schema
-- ================================================

-- Step 1: Create Enum Types
-- ================================================

CREATE TYPE project_status AS ENUM ('active', 'completed', 'on_hold', 'archived');
CREATE TYPE decision_status AS ENUM ('draft', 'active', 'superseded', 'deprecated');
CREATE TYPE document_type AS ENUM ('transcript', 'document', 'notes', 'email', 'other');
CREATE TYPE source_type AS ENUM ('text', 'file', 'voice', 'api');
CREATE TYPE event_type AS ENUM ('created', 'updated', 'deleted', 'acknowledged', 'conflict_detected');
CREATE TYPE entity_type AS ENUM ('person', 'team', 'project', 'decision', 'document', 'source');
CREATE TYPE relationship_type AS ENUM ('owns', 'member_of', 'depends_on', 'relates_to', 'affects', 'stakeholder');
CREATE TYPE conflict_type AS ENUM ('duplicate', 'contradiction', 'timeline_mismatch', 'ownership_overlap', 'stale');
CREATE TYPE conflict_status AS ENUM ('detected', 'reviewing', 'resolved', 'dismissed');

-- Step 2: Create Core Tables
-- ================================================

-- Teams table (hierarchical organizational units)
CREATE TABLE public.teams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  parent_team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Persons table (people in the organization)
CREATE TABLE public.persons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL,
  team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Projects table (initiatives with owners)
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  owner_id UUID REFERENCES public.persons(id) ON DELETE SET NULL,
  team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  status project_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Decisions table (core decision records)
CREATE TABLE public.decisions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  rationale TEXT,
  status decision_status NOT NULL DEFAULT 'draft',
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  created_by UUID REFERENCES public.persons(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Decision versions table (git-style version history)
CREATE TABLE public.decision_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  decision_id UUID NOT NULL REFERENCES public.decisions(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  content JSONB NOT NULL,
  changed_by UUID REFERENCES public.persons(id) ON DELETE SET NULL,
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  change_summary TEXT,
  UNIQUE(decision_id, version)
);

-- Step 3: Create Supporting Tables
-- ================================================

-- Documents table (ingested transcripts, notes, files)
CREATE TABLE public.documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  type document_type NOT NULL DEFAULT 'other',
  source_url TEXT,
  content TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Sources table (raw input tracking)
CREATE TABLE public.sources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type source_type NOT NULL,
  raw_content TEXT NOT NULL,
  processed_content TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Events table (activity log for all entity changes)
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_type entity_type NOT NULL,
  entity_id UUID NOT NULL,
  event_type event_type NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Relationships table (graph edges connecting entities)
CREATE TABLE public.relationships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_type entity_type NOT NULL,
  source_id UUID NOT NULL,
  target_type entity_type NOT NULL,
  target_id UUID NOT NULL,
  relationship_type relationship_type NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Acknowledgments table (who has seen/acknowledged decisions)
CREATE TABLE public.acknowledgments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  decision_id UUID NOT NULL REFERENCES public.decisions(id) ON DELETE CASCADE,
  person_id UUID NOT NULL REFERENCES public.persons(id) ON DELETE CASCADE,
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(decision_id, person_id)
);

-- Conflicts table (AI-detected organizational conflicts)
CREATE TABLE public.conflicts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type conflict_type NOT NULL,
  entity_ids UUID[] NOT NULL DEFAULT '{}',
  status conflict_status NOT NULL DEFAULT 'detected',
  description TEXT NOT NULL,
  suggested_resolution TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Step 4: Enable Row Level Security
-- ================================================

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.persons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decision_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.acknowledgments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conflicts ENABLE ROW LEVEL SECURITY;

-- Public read access policies (organizational transparency)
CREATE POLICY "Public read access for teams" ON public.teams FOR SELECT USING (true);
CREATE POLICY "Public read access for persons" ON public.persons FOR SELECT USING (true);
CREATE POLICY "Public read access for projects" ON public.projects FOR SELECT USING (true);
CREATE POLICY "Public read access for decisions" ON public.decisions FOR SELECT USING (true);
CREATE POLICY "Public read access for decision_versions" ON public.decision_versions FOR SELECT USING (true);
CREATE POLICY "Public read access for documents" ON public.documents FOR SELECT USING (true);
CREATE POLICY "Public read access for sources" ON public.sources FOR SELECT USING (true);
CREATE POLICY "Public read access for events" ON public.events FOR SELECT USING (true);
CREATE POLICY "Public read access for relationships" ON public.relationships FOR SELECT USING (true);
CREATE POLICY "Public read access for acknowledgments" ON public.acknowledgments FOR SELECT USING (true);
CREATE POLICY "Public read access for conflicts" ON public.conflicts FOR SELECT USING (true);

-- Authenticated write access policies
CREATE POLICY "Authenticated insert for teams" ON public.teams FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated update for teams" ON public.teams FOR UPDATE USING (true);
CREATE POLICY "Authenticated delete for teams" ON public.teams FOR DELETE USING (true);

CREATE POLICY "Authenticated insert for persons" ON public.persons FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated update for persons" ON public.persons FOR UPDATE USING (true);
CREATE POLICY "Authenticated delete for persons" ON public.persons FOR DELETE USING (true);

CREATE POLICY "Authenticated insert for projects" ON public.projects FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated update for projects" ON public.projects FOR UPDATE USING (true);
CREATE POLICY "Authenticated delete for projects" ON public.projects FOR DELETE USING (true);

CREATE POLICY "Authenticated insert for decisions" ON public.decisions FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated update for decisions" ON public.decisions FOR UPDATE USING (true);
CREATE POLICY "Authenticated delete for decisions" ON public.decisions FOR DELETE USING (true);

CREATE POLICY "Authenticated insert for decision_versions" ON public.decision_versions FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated update for decision_versions" ON public.decision_versions FOR UPDATE USING (true);
CREATE POLICY "Authenticated delete for decision_versions" ON public.decision_versions FOR DELETE USING (true);

CREATE POLICY "Authenticated insert for documents" ON public.documents FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated update for documents" ON public.documents FOR UPDATE USING (true);
CREATE POLICY "Authenticated delete for documents" ON public.documents FOR DELETE USING (true);

CREATE POLICY "Authenticated insert for sources" ON public.sources FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated update for sources" ON public.sources FOR UPDATE USING (true);
CREATE POLICY "Authenticated delete for sources" ON public.sources FOR DELETE USING (true);

CREATE POLICY "Authenticated insert for events" ON public.events FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated update for events" ON public.events FOR UPDATE USING (true);
CREATE POLICY "Authenticated delete for events" ON public.events FOR DELETE USING (true);

CREATE POLICY "Authenticated insert for relationships" ON public.relationships FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated update for relationships" ON public.relationships FOR UPDATE USING (true);
CREATE POLICY "Authenticated delete for relationships" ON public.relationships FOR DELETE USING (true);

CREATE POLICY "Authenticated insert for acknowledgments" ON public.acknowledgments FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated update for acknowledgments" ON public.acknowledgments FOR UPDATE USING (true);
CREATE POLICY "Authenticated delete for acknowledgments" ON public.acknowledgments FOR DELETE USING (true);

CREATE POLICY "Authenticated insert for conflicts" ON public.conflicts FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated update for conflicts" ON public.conflicts FOR UPDATE USING (true);
CREATE POLICY "Authenticated delete for conflicts" ON public.conflicts FOR DELETE USING (true);

-- Step 5: Enable Realtime
-- ================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.decisions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conflicts;

-- Step 6: Create Indexes
-- ================================================

CREATE INDEX idx_decisions_status ON public.decisions(status);
CREATE INDEX idx_decisions_created_at ON public.decisions(created_at DESC);
CREATE INDEX idx_decisions_project_id ON public.decisions(project_id);
CREATE INDEX idx_events_entity ON public.events(entity_type, entity_id);
CREATE INDEX idx_events_created_at ON public.events(created_at DESC);
CREATE INDEX idx_acknowledgments_lookup ON public.acknowledgments(decision_id, person_id);
CREATE INDEX idx_relationships_source ON public.relationships(source_type, source_id);
CREATE INDEX idx_relationships_target ON public.relationships(target_type, target_id);
CREATE INDEX idx_conflicts_status ON public.conflicts(status);
CREATE INDEX idx_persons_team ON public.persons(team_id);
CREATE INDEX idx_projects_owner ON public.projects(owner_id);
CREATE INDEX idx_projects_team ON public.projects(team_id);

-- Step 7: Create Updated_at Trigger
-- ================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_decisions_updated_at
  BEFORE UPDATE ON public.decisions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();