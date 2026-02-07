

# AlignOS - AI Chief of Staff & Organizational Intelligence System

## Vision
An operating system for how a company thinks — infrastructure for alignment that ingests communication, maintains living truth, and routes information to the right stakeholders.

---

## Architecture Overview

**Frontend:** React + Vite + TypeScript + Tailwind  
**Backend:** Lovable Cloud (Supabase) — Postgres DB, Edge Functions, Storage  
**AI:** Lovable AI Gateway (Gemini) for extraction, summarization, conflict detection  
**Voice:** ElevenLabs for text-to-speech briefings, Whisper integration for voice input  
**Visualizations:** D3.js force-directed graph for knowledge graph

---

## Design System

Minimal, calm, enterprise-grade aesthetic inspired by Linear/Notion/Vercel:
- Monochrome palette with subtle accent colors for status (conflicts, updates, pending)
- Clean typography hierarchy
- Generous whitespace
- Subtle animations for "living" feel
- Dark mode support

---

## Screen 1: Command Center (Home)

The executive cockpit — a real-time pulse of the organization.

**Layout:**
- Top hero section with key metrics: Decisions today, Conflicts detected, Pending acknowledgments, Ownership gaps
- Quick input bar: "Ask AlignOS anything" with voice, text, and upload triggers
- Activity feed: Recent decisions, updates, and changes (live-updating)
- Alert cards for conflicts and missing acknowledgments
- "What changed today?" button with voice playback option

**AI Features (Real):**
- Natural language query processing
- Daily briefing generation
- Voice synthesis via ElevenLabs

---

## Screen 2: Ingestion Interface

The entry point for new information.

**Capabilities:**
- Text paste with rich formatting support
- File upload (transcripts, documents, meeting notes)
- Voice recording with real-time Whisper transcription

**AI Processing Pipeline:**
1. Raw input → AI extraction (decisions, people, projects, dates)
2. Entity recognition and linking to existing graph
3. Stakeholder suggestion based on affected areas
4. Conflict pre-check against existing decisions

**Output:**
- Editable extraction results
- Confirm/reject/edit interface
- "Commit to truth" action

---

## Screen 3: Knowledge Graph

Interactive force-directed visualization of organizational relationships.

**Nodes:**
- People (with role, team)
- Teams (with members, projects)
- Projects (with owner, status)
- Decisions (with version, stakeholders)
- Documents (with sources)

**Interactions:**
- Click node → Side panel with full details, history, dependencies
- Drag to explore connections
- Search/filter by entity type
- Zoom levels: Org-wide → Team → Individual focus

**Implementation:** D3.js force-directed graph with collision detection

---

## Screen 4: Decision Ledger

The canonical, versioned source of truth.

**Decision Record:**
- Title, description, rationale
- Version history (Git-style commits)
- Timestamps with author attribution
- Affected stakeholders list
- Acknowledgment tracking (who's seen, who hasn't)
- Related decisions and dependencies

**Views:**
- Chronological timeline
- By project/team filter
- Pending acknowledgments only
- Recently changed

---

## Screen 5: Propagation / Awareness View

Visibility into information flow.

**Visualization:**
- Stakeholder matrix: Who knows × Who should know
- Flow diagram showing information propagation paths
- "Stuck" indicators where information hasn't reached targets
- Time-based view: How long since decision vs. acknowledgment

**Actions:**
- Nudge stakeholders
- View detailed propagation history
- Set escalation triggers

---

## Screen 6: Critic / Conflict Panel

AI-powered organizational health monitor.

**Conflict Types:**
- Duplicate or contradictory decisions
- Timeline mismatches (deadlines that don't align)
- Ownership overlaps or gaps
- Stale decisions needing review

**Resolution Workflow:**
- Side-by-side comparison
- Suggested resolution from AI
- One-click merge or deprecate
- Assign owner for resolution

---

## Data Model (Postgres)

**Core Entities:**
```
persons (id, name, email, role, team_id, created_at)
teams (id, name, parent_team_id, created_at)
projects (id, name, description, owner_id, team_id, status, created_at)
decisions (id, title, description, rationale, status, created_at, created_by)
decision_versions (id, decision_id, version, content, changed_by, changed_at)
sources (id, type, raw_content, processed_content, created_at)
events (id, entity_type, entity_id, event_type, metadata, created_at)
relationships (id, source_type, source_id, target_type, target_id, relationship_type)
acknowledgments (id, decision_id, person_id, acknowledged_at)
conflicts (id, type, entity_ids, status, suggested_resolution, created_at)
```

---

## AI Services (Edge Functions)

**1. `/functions/extract`**
- Input: Raw text/transcript
- Output: Structured entities (decisions, people, projects, dates, relationships)

**2. `/functions/summarize`**
- Input: Content or decision history
- Output: Executive summary

**3. `/functions/detect-conflicts`**
- Input: New decision + existing decisions
- Output: Potential conflicts with confidence scores

**4. `/functions/suggest-stakeholders`**
- Input: Decision context
- Output: Recommended stakeholders based on graph analysis

**5. `/functions/daily-brief`**
- Input: Time range
- Output: Text summary + optional ElevenLabs audio URL

**6. `/functions/transcribe`**
- Input: Audio file
- Output: Transcribed text (via Whisper/speech API)

---

## Voice Features

**Input (Whisper):**
- Browser MediaRecorder → Upload to storage → Edge function transcription
- Real-time feedback during recording

**Output (ElevenLabs):**
- "What changed today?" generates audio briefing
- Decision summaries as audio
- Small, elegant audio player component

---

## Real-Time Features

- Supabase Realtime subscriptions for live updates
- Command Center activity feed auto-refreshes
- Graph updates when new entities are committed
- Toast notifications for conflicts and acknowledgment requests

---

## Component Structure

```
src/
├── components/
│   ├── command-center/
│   ├── ingestion/
│   ├── knowledge-graph/
│   ├── decision-ledger/
│   ├── propagation/
│   ├── conflicts/
│   ├── shared/ (AudioPlayer, EntityCard, Timeline, etc.)
│   └── ui/ (existing shadcn components)
├── hooks/
│   ├── useDecisions.ts
│   ├── useKnowledgeGraph.ts
│   ├── useIngestion.ts
│   └── useRealtime.ts
├── services/
│   ├── ai.ts (extraction, summarization)
│   ├── voice.ts (recording, playback)
│   └── graph.ts (entity relationships)
├── pages/
│   ├── Index.tsx (Command Center)
│   ├── Ingest.tsx
│   ├── Graph.tsx
│   ├── Ledger.tsx
│   ├── Propagation.tsx
│   └── Conflicts.tsx
└── types/
    └── entities.ts
```

---

## Implementation Phases

**Phase 1:** Foundation
- Design system and layout shell
- Database schema and types
- Navigation between all 6 screens

**Phase 2:** Core Screens
- Command Center with metrics
- Decision Ledger with CRUD
- Ingestion interface (text + upload)

**Phase 3:** AI Integration
- Extraction edge function
- Summarization
- Conflict detection
- Connect to Command Center and Ingestion

**Phase 4:** Knowledge Graph
- D3.js force graph implementation
- Entity detail panels
- Search and filter

**Phase 5:** Voice & Advanced
- Voice recording with transcription
- ElevenLabs audio playback
- Propagation view
- Real-time subscriptions

---

## Production-Ready Architecture

- All AI calls through edge functions (no client-side API keys)
- Modular service wrappers for easy provider swaps
- Type-safe database queries with generated types
- RLS policies for future multi-tenant support
- Clean separation between mock data and real APIs

