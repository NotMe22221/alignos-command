

# Fix AI Extraction, Database Commits, and Data Display

This plan addresses the core issues: fake AI extraction results, non-functional "Commit to Truth", empty Decision Ledger, and broken "Import Data" on the Knowledge Graph.

---

## Problem Summary

| Issue | Current State | Fix Required |
|-------|--------------|--------------|
| AI Extraction | Returns hardcoded mock data | Call real AI via edge function |
| Commit to Truth | Logs to console, does nothing | Save extracted entities to database |
| Decision Ledger | Empty array, no database queries | Fetch real decisions from database |
| Knowledge Graph Import | Button does nothing | Navigate to Ingest page |

---

## Implementation Plan

### Part 1: Create AI Extraction Edge Function

Create a new edge function `extract-entities` that uses Lovable AI (Gemini) to analyze text and extract structured organizational data.

**What it does:**
- Receives raw text content
- Sends to Gemini with structured tool calling
- Returns decisions, people, projects, stakeholders, and summary
- Uses proper JSON schema to ensure consistent output format

**File:** `supabase/functions/extract-entities/index.ts`

---

### Part 2: Update Ingest Page to Use Real AI

Replace the mock extraction with a real call to the new edge function:

1. Remove the `mockExtractionResult` constant
2. Update `handleProcess()` to call the `extract-entities` function
3. Pass the `textContent` to the API
4. Display actual AI-extracted results

---

### Part 3: Implement "Commit to Truth" Database Saves

Update `handleCommit()` to save all extracted entities:

1. Save each decision to the `decisions` table
2. Create persons (if they don't exist by email lookup)
3. Create projects (if they don't exist by name)
4. Log an `events` entry for each created entity
5. Store the raw source in the `sources` table
6. Show success toast with count of items saved
7. Navigate to Decision Ledger after successful commit

---

### Part 4: Connect Decision Ledger to Database

Create a custom hook and update the Ledger page:

1. **Create `useDecisions.ts` hook:**
   - Fetch decisions with versions count
   - Include acknowledgment stats
   - Subscribe to realtime updates
   - Provide loading/error states

2. **Update `Ledger.tsx`:**
   - Use the new hook instead of empty array
   - Show loading spinner while fetching
   - Display real decisions from database

---

### Part 5: Fix Knowledge Graph "Import Data" Button

Make the button navigate to the Ingest page:

1. Import `useNavigate` from react-router-dom
2. Add click handler to navigate to `/ingest`

---

## Technical Details

### Edge Function: extract-entities

```text
Request:
  POST /functions/v1/extract-entities
  Body: { content: string }

Response:
  {
    decisions: [{ title, description, rationale }],
    people: [{ name, role }],
    projects: [{ name, description }],
    suggested_stakeholders: string[],
    summary: string
  }
```

The function uses Gemini's tool calling feature for structured extraction, ensuring consistent JSON output rather than freeform text.

### Database Insert Flow (Commit to Truth)

```text
1. Insert source record (type: 'text'/'voice'/'file')
2. For each person:
   - Check if exists by email pattern
   - Insert if new, get ID
3. For each project:
   - Check if exists by name
   - Insert if new, get ID
4. For each decision:
   - Insert with status 'draft'
   - Create version 1 entry
   - Log 'created' event
5. Show success summary
6. Navigate to /ledger
```

### Data Hook Pattern

```text
useDecisions hook:
- useQuery for fetching with related data
- Realtime subscription for live updates
- Return { decisions, isLoading, error, refetch }
```

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `supabase/functions/extract-entities/index.ts` | Create - AI extraction edge function |
| `supabase/config.toml` | Modify - Register new function |
| `src/hooks/useDecisions.ts` | Create - Database query hook |
| `src/pages/Ingest.tsx` | Modify - Real AI + database saves |
| `src/pages/Ledger.tsx` | Modify - Connect to database |
| `src/pages/Graph.tsx` | Modify - Fix Import Data button |

---

## Expected Results

After implementation:

1. **Ingest Page**: "Extract with AI" analyzes your actual text and shows relevant decisions, people, and stakeholders found in the content
2. **Commit to Truth**: Saves everything to the database and shows confirmation
3. **Decision Ledger**: Displays all decisions from the database with search/filter
4. **Knowledge Graph**: "Import Data" button takes you to the Ingest page

