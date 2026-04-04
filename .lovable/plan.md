

## P1 Closure + Pre-P2 Assessment

### CHECK 1 — `red_flag_count` in InternalCRMDesk.tsx
**PASSED** — zero occurrences found. The file uses only `flag_count`.

### CHECK 2 — Column header state
**ISSUE CONFIRMED** — Line 191 has a single merged header: `<TableHead className="text-center">Grade / Flags</TableHead>`. This needs splitting into two `<th>` elements before P2 adds a Status column.

### Pre-P2 Fix Required
Split line 191 into two separate headers and split the corresponding `<TableCell>` (line 220-238) into two cells. Minimal change:
- `<TableHead className="text-center">Grade</TableHead>` — contains only the circular pill
- `<TableHead className="text-center">Flags</TableHead>` — contains only the flag badge

### Test Data Seed
Insert one lead with `grade='F'`, `flag_count=4`, `phone_verified=true`, `session_id` (required NOT NULL), then visually confirm badges. Delete after.

### P2a vs P2b Assessment

**P2a is the better option.** Here's why:

1. **`fetch_voice_followups` already exists** — confirmed in `supabase/functions/admin-data/index.ts` line 95-97. It selects all voice_followups ordered by `created_at DESC`, limit 100. The action is already in the admin-data type union and permission map (viewer-level access).

2. **P2a is a pure wiring task** — no new backend code, no new edge functions, no schema changes. It adds ~20 lines: one extra `Promise.all` call in `AdminDashboard.tsx`, a `latestFollowups` map built with a `reduce()`, and one new prop on `InternalCRMDesk`.

3. **P2b (implied alternative)** would likely involve per-lead fetching or a new endpoint, which violates the "single fetch cycle" architecture of the dashboard and adds unnecessary complexity.

### Recommended Execution Order

**Step 1** — Split "Grade / Flags" header into two columns (2-minute fix)
**Step 2** — Seed test lead, visually confirm badges, delete record
**Step 3** — Close P1
**Step 4** — Execute P2a (wire `fetch_voice_followups` into dashboard fetch cycle)

### P2a Implementation Details

Files to modify:
- `src/components/AdminDashboard.tsx` — add `invokeAdminData("fetch_voice_followups")` to the `Promise.all`, build `latestFollowups` map, pass as prop
- `src/components/admin/InternalCRMDesk.tsx` — accept new `latestFollowups` prop (used by future P2 badge rendering)
- `src/components/admin/types.ts` — add `VoiceFollowupSummary` interface if not already present (lightweight: `lead_id`, `status`, `call_outcome`, `created_at`)

No new edge functions. No new DB queries. No UI badge logic yet — that's a separate prompt.

