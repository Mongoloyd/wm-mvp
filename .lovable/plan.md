

# P7a + P7 — Implementation Plan (Corrected)

## Critical Corrections from Prompt Spec

### 1. rescan_lead is fundamentally wrong as specified
`scan-quote` accepts `{ scan_session_id }` — NOT `file_path`/`storage_bucket`. Those columns don't exist on `scan_sessions`. The file chain is: `scan_sessions.quote_file_id → quote_files.storage_path → storage.quotes` (bucket name is `quotes`, not `quote-uploads`).

Additionally, `scan-quote` has an **idempotency guard** that rejects sessions already in terminal states (`processing`, `preview_ready`, `complete`, `invalid_document`). A rescan must first reset the session status to `idle` or `uploading` before re-invoking.

**Fix**: `rescan_lead` should (a) reset `scan_sessions.status` to `idle`, (b) delete the existing `analyses` row for that session, then (c) invoke `scan-quote` with just `{ scan_session_id }`.

### 2. fetch_needs_review filter is wrong
The prompt uses `status.eq.failed` — but `analyses` has no `status` column. The column is `analysis_status`, and the failure values are `invalid_document` and `needs_better_upload` — NOT `failed`.

**Fix**: Query `analyses` using `.or('analysis_status.eq.invalid_document,analysis_status.eq.needs_better_upload,confidence_score.lt.0.6')`.

### 3. Storage bucket name
The bucket is `quotes`, not `quote-uploads`. The `QuoteImageThumb` component must use `quotes` and derive the path from `quote_files.storage_path` (not a `scanSessionId/quote.jpg` convention).

### 4. QuoteImageThumb can't use Supabase client directly
Admin components follow the rule: no direct Supabase client table queries. The image thumbnail needs a signed URL, but creating one from the client requires knowing the storage path. Since we can't query `quote_files` from the client, I'll add the `storage_path` to the `fetch_needs_review` response by joining through `scan_sessions.quote_file_id → quote_files.storage_path`.

Actually — the storage bucket `quotes` is private, and the client uses the anon key which has no SELECT policy on `quote_files`. The signed URL creation via `supabase.storage.from('quotes').createSignedUrl()` also requires auth. **Simplest approach**: include a signed URL in the `fetch_needs_review` response from the edge function (server-side, using service role). This avoids client-side storage calls entirely.

---

## Phase 1: P7a — Backend (3 new admin-data actions)

### File: `supabase/functions/admin-data/index.ts`

**Add 3 actions to `ActionName` union and `ACTION_ROLES`:**

| Action | Roles |
|--------|-------|
| `fetch_needs_review` | super_admin, operator, viewer |
| `rescan_lead` | super_admin, operator |
| `update_lead_manual_entry` | super_admin, operator |

**ACTION 1: `fetch_needs_review`** (two-query merge, no FK join)

- Query A: leads where `latest_analysis_id IS NULL` AND `manually_reviewed` is false/null
- Query B: analyses where `analysis_status IN ('invalid_document', 'needs_better_upload')` OR `confidence_score < 0.6`. Then fetch parent leads filtered by `manually_reviewed` false/null
- For each result, generate a signed URL from `quotes` bucket using the `quote_files.storage_path` (fetched via `scan_sessions.quote_file_id`)
- Merge, deduplicate by lead ID, tag with `review_reason` (`no_scan`, `parse_failed`, `low_confidence`)
- Return merged array sorted by `created_at` desc

**ACTION 2: `rescan_lead`**

1. Fetch `lead.latest_scan_session_id`
2. Guard: return 400 if null
3. Reset `scan_sessions.status` to `'idle'` for that session (clears idempotency guard)
4. Delete existing `analyses` row for that `scan_session_id` (prevents stale data)
5. Invoke `scan-quote` with `{ scan_session_id }` only (matches its actual contract)
6. Return success/failure

**ACTION 3: `update_lead_manual_entry`** — as specified in prompt (no corrections needed)

### File: `src/services/adminDataService.ts`

Add 3 new entries to `AdminAction` union and `AdminActionPayloads`.

---

## Phase 2: P7 — Frontend

### File: `src/components/AdminDashboard.tsx`

- Add `needsReview` state and fetch in `fetchAll()` via `invokeAdminData('fetch_needs_review')`
- Add "Needs Review" tab between Ghost Recovery and Dialer Desk (5-tab grid)
- Red count badge when count > 0

### File: `src/components/admin/NeedsReviewTab.tsx` (new)

- Table with columns: Lead, Reason, Image, Error Note, Actions
- **Image column**: Uses `quote_image_url` from the server response (signed URL generated server-side) — no client-side storage calls
- **Reason badges**: Gray (no_scan), Red (parse_failed), Amber (low_confidence with %)
- **Actions**: Re-Scan button (calls `rescan_lead`), Manual Entry button (opens Sheet)
- **Manual Entry Sheet**: Form with contractorName, totalPrice, productBrand, notes — calls `update_lead_manual_entry`
- Optimistic removal via `localRemoved` Set
- Loading skeleton, empty state with CheckCircle

---

## Files Modified

| File | Change |
|------|--------|
| `supabase/functions/admin-data/index.ts` | +3 action types, +3 role entries, +3 handlers |
| `src/services/adminDataService.ts` | +3 union members, +3 payload types |
| `src/components/AdminDashboard.tsx` | +needsReview state/fetch, +tab (5-col grid) |
| `src/components/admin/NeedsReviewTab.tsx` | New component |

No schema changes. No new edge functions.

## Key Divergences from Prompt

1. `rescan_lead`: Passes `{ scan_session_id }` to scan-quote (not file_path). Resets session status and deletes stale analysis first.
2. `fetch_needs_review`: Filters on `analysis_status` (not `status`), uses `invalid_document`/`needs_better_upload` (not `failed`).
3. Image thumbnail: Server-generated signed URL from `quotes` bucket (not client-side `quote-uploads` call).
4. Tab grid: Changes from 4-col to 5-col.

