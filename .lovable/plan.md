

# Wire Live Analysis Data into Grade Report

## Changes

### 1. Database Migration: `get_analysis_preview` RPC

```sql
CREATE OR REPLACE FUNCTION public.get_analysis_preview(p_scan_session_id uuid)
RETURNS TABLE(
  grade text,
  flags jsonb,
  proof_of_read jsonb,
  preview_json jsonb,
  confidence_score numeric,
  document_type text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT a.grade, a.flags, a.proof_of_read, a.preview_json,
         a.confidence_score, a.document_type
  FROM public.analyses a
  WHERE a.scan_session_id = p_scan_session_id
  LIMIT 1;
$$;
```

Excludes `full_json`, `dollar_delta`, `analysis_status`. Preview-safe only.

### 2. New Hook: `src/hooks/useAnalysisData.ts`

- Accepts `scanSessionId: string | null` and `enabled: boolean`
- Calls `get_analysis_preview` RPC when enabled and scanSessionId is set
- Maps DB flags `{ flag, severity, pillar, detail }` to UI `Flag[]`:
  - severity: `"Critical"/"High"` → `"red"`, `"Medium"` → `"amber"`, `"Low"` → `"green"`
  - `flag` → humanized `label` (e.g., `"missing_dp_rating"` → `"Missing DP Rating"`)
  - `detail` → `detail`
  - `tip` → `null` (no tips from DB yet)
  - `id` → index-based
- Extracts `contractorName` from `proof_of_read.contractor_name`
- Returns `{ data, isLoading, error }` where data shape:
  - `grade`, `flags: Flag[]`, `contractorName: string | null`, `confidenceScore: number | null`
- Does NOT derive county — leaves existing `selectedCounty` state untouched

### 3. Update `src/pages/Index.tsx`

- Remove `mockAuditResult` constant entirely
- Add `useAnalysisData(scanSessionId, gradeRevealed)` call
- When `gradeRevealed && isLoading`: render a loading skeleton in place of the report
- When `gradeRevealed && !data`: render a "No analysis found" fallback message
- When `gradeRevealed && data`: pass `grade`, `flags` to `GradeReveal`; pass `county` from existing `selectedCounty`; omit `dollarDelta`/`fairPriceLow`/`fairPriceHigh`; pass flag counts to `EvidenceLocker`/`ContractorMatch`

### 4. Update `src/components/GradeReveal.tsx`

- The benchmark section (columns 1 and 2 of the 3-column grid: "YOUR QUOTE VS. FAIR MARKET" and "FAIR MARKET RANGE") renders **only when `dollarDelta` and `fairPriceLow`/`fairPriceHigh` are provided**. When omitted, hide those columns entirely — the grid collapses to show only the summary column.
- Remove `defaultFlags` fallback array — flags must come from props or show empty state
- Add optional `contractorName` prop — if provided, replace `[Contractor Name]` in the negotiation script
- Add optional `isLoading` prop — if true, render skeleton placeholders instead of content

### 5. Trivial downstream prop updates

- `ContractorMatch`: already has defaults; receives real `grade` and `county`; `dollarDelta` omitted (default remains but won't display meaningfully — acceptable for now)
- `EvidenceLocker`: receives real `grade`, `county`, flag counts; `dollarDelta` omitted

### 6. Memory update

Update `scanner-brain-followups.md` to record derived `.txt` artifact follow-up requirement.

## Not in scope

- OTP hard gate / full_json unlock
- ScanTheatrics grade teaser polish
- Route refactors
- Benchmark delta calculation
- `quote_files` RLS tightening

