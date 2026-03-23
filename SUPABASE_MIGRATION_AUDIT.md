# Supabase Migration Audit — `get_analysis_preview` + `get_analysis_full`

---

## 1. Migration File Path

```
supabase/migrations/20260322_redact_preview_create_gated_full.sql
```

---

## 2. Full SQL Contents

```sql
-- ═══════════════════════════════════════════════════════════════════════════════
-- MIGRATION: Redact preview + create gated full fetch
-- Date: 2026-03-22
-- Purpose: Close the flags data leak; create backend-authoritative gate
-- ═══════════════════════════════════════════════════════════════════════════════

-- ── Step 1: Replace get_analysis_preview with redacted version ────────────────
-- Returns flag_count (integer) instead of flags (jsonb).
-- Adds flag_red_count and flag_amber_count for teaser UI.

DROP FUNCTION IF EXISTS public.get_analysis_preview(uuid);

CREATE FUNCTION public.get_analysis_preview(p_scan_session_id uuid)
RETURNS TABLE(
  grade text,
  flag_count integer,
  flag_red_count integer,
  flag_amber_count integer,
  proof_of_read jsonb,
  preview_json jsonb,
  confidence_score numeric,
  document_type text,
  rubric_version text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    a.grade,
    jsonb_array_length(COALESCE(a.flags, '[]'::jsonb))::integer AS flag_count,
    (SELECT count(*)::integer
     FROM jsonb_array_elements(COALESCE(a.flags, '[]'::jsonb)) elem
     WHERE elem->>'severity' IN ('Critical', 'High'))            AS flag_red_count,
    (SELECT count(*)::integer
     FROM jsonb_array_elements(COALESCE(a.flags, '[]'::jsonb)) elem
     WHERE elem->>'severity' = 'Medium')                         AS flag_amber_count,
    a.proof_of_read,
    a.preview_json,
    a.confidence_score,
    a.document_type,
    a.rubric_version
  FROM public.analyses a
  WHERE a.scan_session_id = p_scan_session_id
    AND a.analysis_status = 'complete'
  LIMIT 1;
$$;

-- ── Step 2: Create get_analysis_full — gated behind phone verification ───────
-- Returns flags + full_json ONLY when a verified phone record exists.
-- Returns empty result set if verification fails — no error, no hint.

CREATE OR REPLACE FUNCTION public.get_analysis_full(
  p_scan_session_id uuid,
  p_phone_e164 text
)
RETURNS TABLE(
  grade text,
  flags jsonb,
  full_json jsonb,
  proof_of_read jsonb,
  preview_json jsonb,
  confidence_score numeric,
  document_type text,
  rubric_version text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_verified boolean := false;
BEGIN
  -- Check that this phone has a verified record
  SELECT EXISTS(
    SELECT 1
    FROM public.phone_verifications pv
    WHERE pv.phone_e164 = p_phone_e164
      AND pv.status = 'verified'
  ) INTO v_verified;

  IF NOT v_verified THEN
    RETURN;  -- empty result — phone not verified
  END IF;

  -- Return the full gated payload
  RETURN QUERY
  SELECT
    a.grade,
    a.flags,
    a.full_json,
    a.proof_of_read,
    a.preview_json,
    a.confidence_score,
    a.document_type,
    a.rubric_version
  FROM public.analyses a
  WHERE a.scan_session_id = p_scan_session_id
    AND a.analysis_status = 'complete'
  LIMIT 1;
END;
$$;

-- ── Step 3: Ensure no direct anon SELECT on analyses ─────────────────────────
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_analyses" ON public.analyses;
DROP POLICY IF EXISTS "Allow anonymous select on analyses" ON public.analyses;
-- No new anon SELECT policy. All access goes through SECURITY DEFINER RPCs.
```

---

## 3. Exact Input Parameters of `get_analysis_preview`

| Parameter | SQL Type | Description |
|-----------|----------|-------------|
| `p_scan_session_id` | `uuid` | The scan session to look up |

---

## 4. Exact Output Shape of `get_analysis_preview`

| Column | SQL Type | Description |
|--------|----------|-------------|
| `grade` | `text` | Letter grade (A/B/C/D/F) |
| `flag_count` | `integer` | Total number of flags (computed from `jsonb_array_length`) |
| `flag_red_count` | `integer` | Count of flags with severity `Critical` or `High` |
| `flag_amber_count` | `integer` | Count of flags with severity `Medium` |
| `proof_of_read` | `jsonb` | Contractor name, page count, opening count, line item count |
| `preview_json` | `jsonb` | Pillar scores, quality band, has_warranty, has_permits |
| `confidence_score` | `numeric` | AI confidence score |
| `document_type` | `text` | Document classification |
| `rubric_version` | `text` | Rubric version used for analysis |

**The `flags` jsonb array is NOT returned.** Only aggregate counts are exposed.

---

## 5. Exact Input Parameters of `get_analysis_full`

| Parameter | SQL Type | Description |
|-----------|----------|-------------|
| `p_scan_session_id` | `uuid` | The scan session to look up |
| `p_phone_e164` | `text` | The E.164-formatted phone number to verify |

---

## 6. Exact Output Shape of `get_analysis_full`

| Column | SQL Type | Description |
|--------|----------|-------------|
| `grade` | `text` | Letter grade |
| `flags` | `jsonb` | Full flags array with severity, detail, tip, pillar |
| `full_json` | `jsonb` | Complete analysis JSON |
| `proof_of_read` | `jsonb` | Same as preview |
| `preview_json` | `jsonb` | Same as preview |
| `confidence_score` | `numeric` | Same as preview |
| `document_type` | `text` | Same as preview |
| `rubric_version` | `text` | Same as preview |

---

## 7. Exact Authorization Logic Used by `get_analysis_full`

The authorization logic is contained in the `DECLARE` / `BEGIN` block:

```sql
DECLARE
  v_verified boolean := false;
BEGIN
  -- Check that this phone has a verified record
  SELECT EXISTS(
    SELECT 1
    FROM public.phone_verifications pv
    WHERE pv.phone_e164 = p_phone_e164
      AND pv.status = 'verified'
  ) INTO v_verified;

  IF NOT v_verified THEN
    RETURN;  -- empty result — phone not verified
  END IF;
```

The function checks whether **any row** in `phone_verifications` matches the supplied `p_phone_e164` with `status = 'verified'`. If no such row exists, the function returns an empty result set (zero rows).

If the check passes, the function then queries `analyses` filtered by `p_scan_session_id`:

```sql
  RETURN QUERY
  SELECT ...
  FROM public.analyses a
  WHERE a.scan_session_id = p_scan_session_id
    AND a.analysis_status = 'complete'
  LIMIT 1;
```

---

## 8. Exact SQL `JOIN`, `WHERE`, and `EXISTS` Clause — Cross-Unlock Analysis

The authorization check is:

```sql
SELECT EXISTS(
  SELECT 1
  FROM public.phone_verifications pv
  WHERE pv.phone_e164 = p_phone_e164
    AND pv.status = 'verified'
) INTO v_verified;
```

The data fetch is:

```sql
FROM public.analyses a
WHERE a.scan_session_id = p_scan_session_id
  AND a.analysis_status = 'complete'
```

**There is NO JOIN between these two queries.** The verification check and the data fetch are completely independent operations. The function checks:

1. Does `p_phone_e164` exist in `phone_verifications` with `status = 'verified'`? (global check)
2. Does `p_scan_session_id` exist in `analyses` with `analysis_status = 'complete'`? (unrelated check)

**There is no clause that binds `p_phone_e164` to `p_scan_session_id`.** The relationship chain that should be enforced is:

```
phone_verifications.lead_id → leads.id
leads.id ← scan_sessions.lead_id
scan_sessions.id = analyses.scan_session_id
```

This chain is **not present** in the SQL.

---

## 9. RLS Policy Changes in This Migration

```sql
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_analyses" ON public.analyses;
DROP POLICY IF EXISTS "Allow anonymous select on analyses" ON public.analyses;
-- No new anon SELECT policy. All access goes through SECURITY DEFINER RPCs.
```

The migration:
- Enables RLS on `analyses` (if not already enabled)
- Drops two existing anon SELECT policies
- Does **not** create any new SELECT policy for anon
- All data access is routed through `SECURITY DEFINER` RPCs, which bypass RLS

---

## 10. Frontend Files That Assume This New SQL Contract

| File | What It Assumes |
|------|-----------------|
| `src/hooks/useAnalysisData.ts` lines 200-203 | Calls `get_analysis_preview` with `{ p_scan_session_id: scanSessionId }`. Reads `row.flag_count`, `row.flag_red_count`, `row.flag_amber_count` from the response (lines 226-228). These columns only exist in the new migration — the old function returned `flags: jsonb`. |
| `src/hooks/useAnalysisData.ts` lines 260-262 | Calls `get_analysis_full` with `{ p_scan_session_id: scanSessionId, p_phone_e164: phoneE164 }`. This function does not exist before this migration. |
| `src/hooks/useAnalysisData.ts` line 225 | Sets `flags: []` for preview — assumes the backend no longer returns flags in preview. |
| `src/hooks/useReportAccess.ts` | Returns `"full"` only when `isFullLoaded` is true, which is set after `get_analysis_full` succeeds. |
| `src/components/post-scan/PostScanReportSwitcher.tsx` lines 34-37 | Accepts `onVerified` callback and `isFullLoaded` prop — wired to `fetchFull()` in parent. |
| `src/pages/Index.tsx` line 63 | Destructures `fetchFull` and `isFullLoaded` from `useAnalysisData`. |
| `src/pages/Index.tsx` line 257 | Passes `onVerified={(phoneE164) => { fetchFull(phoneE164); }}` to `PostScanReportSwitcher`. |
| `src/pages/ReportClassic.tsx` lines 103, 112, 121, 127-128 | Uses `fetchFull`, `isFullLoaded`, and auto-triggers `fetchFull(funnel.phoneE164)` when `funnel.phoneStatus === "verified"`. |
| `src/integrations/supabase/types.ts` lines 339-350 | **STALE**: Still declares old `get_analysis_preview` return type with `flags: Json` instead of `flag_count`, `flag_red_count`, `flag_amber_count`. Does **not** declare `get_analysis_full` at all. |

---

## A. Frontend → SQL Contract

### `get_analysis_preview`

| Parameter Name | Type | Where It Comes From |
|---------------|------|---------------------|
| `p_scan_session_id` | `string` (UUID) | `scanSessionId` state variable in `useAnalysisData` hook, which is passed from `Index.tsx` line 63 (set by `setScanSessionId` after file upload) or `ReportClassic.tsx` line 103 (extracted from URL param `sessionId`) |

### `get_analysis_full`

| Parameter Name | Type | Where It Comes From |
|---------------|------|---------------------|
| `p_scan_session_id` | `string` (UUID) | Same as above — `scanSessionId` from `useAnalysisData` hook |
| `p_phone_e164` | `string` | Passed as argument to `fetchFull(phoneE164)`. Originates from: (a) `PostScanReportSwitcher.onVerified` callback which gets it from `funnel?.phoneE164 \|\| pipeline.e164` after OTP verification succeeds, or (b) `ReportClassic.tsx` line 128 which reads `funnel.phoneE164` when `funnel.phoneStatus === "verified"` |

---

## B. Authorization Proof

### The SQL fragment that is supposed to prove authorization:

```sql
SELECT EXISTS(
  SELECT 1
  FROM public.phone_verifications pv
  WHERE pv.phone_e164 = p_phone_e164
    AND pv.status = 'verified'
) INTO v_verified;
```

### Analysis against each requirement:

| Requirement | Met? | Evidence |
|-------------|------|----------|
| The phone was verified | **YES** | `pv.status = 'verified'` checks this |
| The verified phone belongs to the correct lead/session | **NO** | No JOIN to `leads` or `scan_sessions`. The check is global — any verified phone passes. |
| The lead/session belongs to the requested `scan_session_id` | **NO** | No relationship enforced between `phone_verifications.lead_id` and `scan_sessions.lead_id` |
| A verified phone for one report cannot unlock another report | **NO** | Any verified phone in the entire `phone_verifications` table can unlock any `scan_session_id` in `analyses` |

### **WARNING: CROSS-UNLOCK EXPLOIT PRESENT IN DRAFT.**

**Attack scenario:** User A verifies phone `+15551234567` for scan session `AAA`. User B has scan session `BBB` with a different phone. User A calls `get_analysis_full(p_scan_session_id := 'BBB', p_phone_e164 := '+15551234567')`. The function finds `+15551234567` is verified (from session AAA), passes the check, and returns the full analysis for session BBB.

---

## C. Failure Behavior

### `p_phone_e164` is verified but does not belong to the requested `p_scan_session_id`

**Current behavior:** Returns the full analysis data. This is the cross-unlock exploit.

**Expected behavior:** Should return zero rows.

### `p_scan_session_id` exists but has no matching verified phone

**Current behavior:** If the supplied `p_phone_e164` has no verified record anywhere in `phone_verifications`, returns zero rows (empty result set). If the supplied `p_phone_e164` is verified for a *different* session, returns the full data (exploit).

### Missing or null parameters

**Current behavior:**
- `p_phone_e164 = NULL`: The `EXISTS` subquery will find no rows where `pv.phone_e164 = NULL` (NULL = NULL is false in SQL), so `v_verified = false`, function returns zero rows.
- `p_scan_session_id = NULL`: The `EXISTS` check may still pass (if phone is verified globally), then the data query `WHERE a.scan_session_id = NULL` returns zero rows (NULL = NULL is false).
- Both NULL: Returns zero rows.

**Return type in all failure cases:** Zero rows (empty result set). No exception. No null payload. No error message.

---

## D. RLS Interaction

Access to full report data depends on **the RPC alone**, not RLS.

**Division of responsibility:**

| Layer | Role |
|-------|------|
| RLS on `analyses` | Blocks all direct `SELECT` by anon role. No anon SELECT policy exists after migration. |
| `SECURITY DEFINER` on both RPCs | Both functions execute as the function owner (typically `postgres`), bypassing RLS entirely. |
| RPC authorization logic | `get_analysis_preview`: No authorization — any caller with any `scan_session_id` gets preview data. `get_analysis_full`: Phone verification check (flawed — see Section B). |

RLS serves as a **defense-in-depth backstop** — it prevents direct table access if someone bypasses the RPCs (e.g., via Supabase client `from('analyses').select()`). But the actual data gating logic lives entirely in the RPC functions.

---

## E. Self-Correction Directive

### Diagnosis

The current `get_analysis_full` SQL checks whether `p_phone_e164` exists in `phone_verifications` with `status = 'verified'` **but fails to join that phone number to the correct lead record and the specific `scan_session_id`**.

The relationship chain exists in the schema:

```
phone_verifications.lead_id → leads.id
scan_sessions.lead_id → leads.id
analyses.scan_session_id → scan_sessions.id
```

But the SQL does not traverse this chain. The verification check and the data fetch are two independent queries with no shared binding.

### **WARNING: CROSS-UNLOCK EXPLOIT PRESENT IN DRAFT.**

### Corrected SQL for `get_analysis_full`

```sql
CREATE OR REPLACE FUNCTION public.get_analysis_full(
  p_scan_session_id uuid,
  p_phone_e164 text
)
RETURNS TABLE(
  grade text,
  flags jsonb,
  full_json jsonb,
  proof_of_read jsonb,
  preview_json jsonb,
  confidence_score numeric,
  document_type text,
  rubric_version text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_authorized boolean := false;
BEGIN
  -- ── Authorization: Verify the phone is verified AND belongs to this session ──
  -- Chain: phone_verifications.lead_id → leads.id ← scan_sessions.lead_id
  --        scan_sessions.id = p_scan_session_id
  SELECT EXISTS(
    SELECT 1
    FROM public.phone_verifications pv
    JOIN public.leads l       ON l.id = pv.lead_id
    JOIN public.scan_sessions ss ON ss.lead_id = l.id
    WHERE pv.phone_e164 = p_phone_e164
      AND pv.status     = 'verified'
      AND ss.id          = p_scan_session_id
  ) INTO v_authorized;

  IF NOT v_authorized THEN
    RETURN;  -- empty result — not authorized for this session
  END IF;

  -- ── Data fetch (unchanged) ──
  RETURN QUERY
  SELECT
    a.grade,
    a.flags,
    a.full_json,
    a.proof_of_read,
    a.preview_json,
    a.confidence_score,
    a.document_type,
    a.rubric_version
  FROM public.analyses a
  WHERE a.scan_session_id = p_scan_session_id
    AND a.analysis_status = 'complete'
  LIMIT 1;
END;
$$;
```

### What the corrected SQL proves:

| Requirement | How It's Enforced |
|-------------|-------------------|
| Phone was verified | `pv.status = 'verified'` |
| Verified phone belongs to the correct lead | `JOIN public.leads l ON l.id = pv.lead_id` |
| Lead belongs to the requested scan session | `JOIN public.scan_sessions ss ON ss.lead_id = l.id AND ss.id = p_scan_session_id` |
| Cross-unlock blocked | The three-table JOIN ensures the phone → lead → session chain is unbroken for the specific `p_scan_session_id` |

### Frontend impact of correction

**None.** The function signature (input parameters and output columns) is unchanged. The correction only tightens the internal authorization check. No frontend files need updating.

---

## F. Migration Completeness Check

### Classification: **Safe only after SQL correction**

### Reasons:

| Issue | Severity | Fix |
|-------|----------|-----|
| `get_analysis_full` has cross-unlock exploit | **CRITICAL** | Replace the `EXISTS` subquery with the corrected three-table JOIN version above |
| `src/integrations/supabase/types.ts` is stale | **MEDIUM** | The types file still declares `get_analysis_preview` with `flags: Json` return type instead of `flag_count`, `flag_red_count`, `flag_amber_count`. It does not declare `get_analysis_full` at all. The frontend works because it uses `.rpc()` with string names and casts responses dynamically, but TypeScript type safety is broken. Run `supabase gen types typescript` after applying the migration to regenerate. |
| `get_analysis_preview` has no authorization | **LOW (by design)** | Preview data is intentionally public — it contains no actionable findings (only aggregate counts). This is acceptable. |
| No rollback script included | **PROCESS** | The migration drops the old `get_analysis_preview` function. A rollback script should be prepared before running. |

### Corrected migration file (full replacement):

```sql
-- ═══════════════════════════════════════════════════════════════════════════════
-- MIGRATION: Redact preview + create gated full fetch
-- Date: 2026-03-22
-- Purpose: Close the flags data leak; create backend-authoritative gate
-- ═══════════════════════════════════════════════════════════════════════════════

-- ── Step 1: Replace get_analysis_preview with redacted version ────────────────

DROP FUNCTION IF EXISTS public.get_analysis_preview(uuid);

CREATE FUNCTION public.get_analysis_preview(p_scan_session_id uuid)
RETURNS TABLE(
  grade text,
  flag_count integer,
  flag_red_count integer,
  flag_amber_count integer,
  proof_of_read jsonb,
  preview_json jsonb,
  confidence_score numeric,
  document_type text,
  rubric_version text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    a.grade,
    jsonb_array_length(COALESCE(a.flags, '[]'::jsonb))::integer AS flag_count,
    (SELECT count(*)::integer
     FROM jsonb_array_elements(COALESCE(a.flags, '[]'::jsonb)) elem
     WHERE elem->>'severity' IN ('Critical', 'High'))            AS flag_red_count,
    (SELECT count(*)::integer
     FROM jsonb_array_elements(COALESCE(a.flags, '[]'::jsonb)) elem
     WHERE elem->>'severity' = 'Medium')                         AS flag_amber_count,
    a.proof_of_read,
    a.preview_json,
    a.confidence_score,
    a.document_type,
    a.rubric_version
  FROM public.analyses a
  WHERE a.scan_session_id = p_scan_session_id
    AND a.analysis_status = 'complete'
  LIMIT 1;
$$;

-- ── Step 2: Create get_analysis_full — gated behind phone verification ───────
-- CORRECTED: Uses three-table JOIN to prevent cross-unlock exploit.
-- Returns flags + full_json ONLY when a verified phone record exists
-- AND that phone belongs to the lead that owns this scan session.

CREATE OR REPLACE FUNCTION public.get_analysis_full(
  p_scan_session_id uuid,
  p_phone_e164 text
)
RETURNS TABLE(
  grade text,
  flags jsonb,
  full_json jsonb,
  proof_of_read jsonb,
  preview_json jsonb,
  confidence_score numeric,
  document_type text,
  rubric_version text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_authorized boolean := false;
BEGIN
  -- Authorization: phone must be verified AND bound to this session's lead
  SELECT EXISTS(
    SELECT 1
    FROM public.phone_verifications pv
    JOIN public.leads l       ON l.id = pv.lead_id
    JOIN public.scan_sessions ss ON ss.lead_id = l.id
    WHERE pv.phone_e164 = p_phone_e164
      AND pv.status     = 'verified'
      AND ss.id          = p_scan_session_id
  ) INTO v_authorized;

  IF NOT v_authorized THEN
    RETURN;  -- empty result — not authorized for this session
  END IF;

  RETURN QUERY
  SELECT
    a.grade,
    a.flags,
    a.full_json,
    a.proof_of_read,
    a.preview_json,
    a.confidence_score,
    a.document_type,
    a.rubric_version
  FROM public.analyses a
  WHERE a.scan_session_id = p_scan_session_id
    AND a.analysis_status = 'complete'
  LIMIT 1;
END;
$$;

-- ── Step 3: Ensure no direct anon SELECT on analyses ─────────────────────────
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_analyses" ON public.analyses;
DROP POLICY IF EXISTS "Allow anonymous select on analyses" ON public.analyses;
-- No new anon SELECT policy. All access goes through SECURITY DEFINER RPCs.
```

### Rollback script:

```sql
-- ROLLBACK: Revert 20260322_redact_preview_create_gated_full.sql
-- Restores the original get_analysis_preview that returns flags jsonb.
-- Drops get_analysis_full entirely.
-- Re-creates anon SELECT policy on analyses.

DROP FUNCTION IF EXISTS public.get_analysis_full(uuid, text);
DROP FUNCTION IF EXISTS public.get_analysis_preview(uuid);

-- Restore original get_analysis_preview (returns flags jsonb)
CREATE FUNCTION public.get_analysis_preview(p_scan_session_id uuid)
RETURNS TABLE(
  grade text,
  flags jsonb,
  proof_of_read jsonb,
  preview_json jsonb,
  confidence_score numeric,
  document_type text,
  rubric_version text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    a.grade,
    a.flags,
    a.proof_of_read,
    a.preview_json,
    a.confidence_score,
    a.document_type,
    a.rubric_version
  FROM public.analyses a
  WHERE a.scan_session_id = p_scan_session_id
    AND a.analysis_status = 'complete'
  LIMIT 1;
$$;

-- Restore anon SELECT on analyses
CREATE POLICY "Allow anonymous select on analyses"
  ON public.analyses
  FOR SELECT
  USING (true);
```
