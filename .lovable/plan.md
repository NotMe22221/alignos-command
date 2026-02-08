

# Database Schema Setup for AlignOS

This plan creates the complete Postgres database structure for persisting organizational data including decisions, people, projects, teams, and all supporting entities.

---

## Overview

We'll create 10 core tables that power the AlignOS system:

| Table | Purpose |
|-------|---------|
| `teams` | Organizational units (can be hierarchical) |
| `persons` | People in the organization with roles |
| `projects` | Initiatives with owners and status |
| `decisions` | The core decision records |
| `decision_versions` | Git-style version history for decisions |
| `documents` | Ingested transcripts, notes, files |
| `sources` | Raw input tracking (text, voice, file, api) |
| `events` | Activity log for all entity changes |
| `relationships` | Graph edges connecting entities |
| `acknowledgments` | Who has seen/acknowledged decisions |
| `conflicts` | AI-detected organizational conflicts |

---

## Implementation Steps

### Step 1: Create Enum Types
Define the custom PostgreSQL enums for status fields:
- `project_status`: active, completed, on_hold, archived
- `decision_status`: draft, active, superseded, deprecated
- `document_type`: transcript, document, notes, email, other
- `source_type`: text, file, voice, api
- `event_type`: created, updated, deleted, acknowledged, conflict_detected
- `entity_type`: person, team, project, decision, document, source
- `relationship_type`: owns, member_of, depends_on, relates_to, affects, stakeholder
- `conflict_type`: duplicate, contradiction, timeline_mismatch, ownership_overlap, stale
- `conflict_status`: detected, reviewing, resolved, dismissed

### Step 2: Create Core Tables

**Teams Table**
```
teams (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  description text,
  parent_team_id uuid REFERENCES teams(id),
  created_at timestamptz DEFAULT now()
)
```

**Persons Table**
```
persons (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  role text NOT NULL,
  team_id uuid REFERENCES teams(id),
  avatar_url text,
  created_at timestamptz DEFAULT now()
)
```

**Projects Table**
```
projects (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL,
  owner_id uuid REFERENCES persons(id),
  team_id uuid REFERENCES teams(id),
  status project_status DEFAULT 'active',
  created_at timestamptz DEFAULT now()
)
```

**Decisions Table**
```
decisions (
  id uuid PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL,
  rationale text,
  status decision_status DEFAULT 'draft',
  project_id uuid REFERENCES projects(id),
  created_by uuid REFERENCES persons(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
)
```

**Decision Versions Table**
```
decision_versions (
  id uuid PRIMARY KEY,
  decision_id uuid REFERENCES decisions(id) ON DELETE CASCADE,
  version integer NOT NULL,
  content jsonb NOT NULL,
  changed_by uuid REFERENCES persons(id),
  changed_at timestamptz DEFAULT now(),
  change_summary text,
  UNIQUE(decision_id, version)
)
```

### Step 3: Create Supporting Tables

**Documents, Sources, Events, Relationships, Acknowledgments, Conflicts**

Each with appropriate foreign keys and constraints.

### Step 4: Enable Row Level Security

Since this is an organizational tool (not multi-user yet), we'll set up RLS with public read access and authenticated write access. This allows:
- Anyone can read all organizational data
- Authenticated users can create/update/delete

### Step 5: Enable Realtime

Enable Supabase Realtime on key tables for live updates:
- `decisions` - for live decision feed
- `events` - for activity stream
- `conflicts` - for alert notifications

### Step 6: Create Indexes

Add performance indexes on:
- `decisions(status)` - for filtering
- `decisions(created_at)` - for timeline queries
- `events(entity_type, entity_id)` - for entity lookups
- `events(created_at)` - for activity feed
- `acknowledgments(decision_id, person_id)` - for lookups

### Step 7: Create Updated_at Trigger

A trigger function to automatically update `updated_at` timestamps on decisions.

---

## Code Changes

After the database migration, we'll update the application:

1. **Create data hooks** in `src/hooks/`:
   - `useDecisions.ts` - CRUD operations for decisions
   - `usePersons.ts` - People management
   - `useProjects.ts` - Project management
   - `useTeams.ts` - Team management
   - `useEvents.ts` - Activity feed with realtime subscription

2. **Update pages** to use real data:
   - `Index.tsx` - Connect metrics and activity feed
   - `Ledger.tsx` - Connect decision list and CRUD
   - `Conflicts.tsx` - Connect conflict data
   - `Propagation.tsx` - Connect acknowledgment tracking

3. **Update Ingest page** to save extracted data to database

---

## Technical Details

### Full Migration SQL

The migration will include:
- 9 enum types
- 11 tables with proper foreign key relationships
- RLS policies for each table
- Realtime publication for live updates
- Performance indexes
- Automatic `updated_at` trigger

### Security Considerations

- RLS enabled on all tables
- Public read access (organizational transparency)
- Authenticated write access
- Cascade deletes for dependent records (versions, acknowledgments)

