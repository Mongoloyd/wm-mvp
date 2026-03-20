

# Plan: Rubric Version Comparison Dashboard

## What We're Building
A dev-facing dashboard that queries `analyses` and shows grade distribution broken down by `rubric_version`, so you can see at a glance whether v1.1 is grading harder/softer than v1.0.

## Step 1: Create a `get_rubric_stats` RPC function
A new Postgres function that returns aggregate data:

```sql
CREATE FUNCTION public.get_rubric_stats()
RETURNS TABLE(
  rubric_version text,
  total_count bigint,
  grade_a bigint,
  grade_b bigint,
  grade_c bigint,
  grade_d bigint,
  grade_f bigint,
  avg_confidence numeric,
  invalid_count bigint
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    a.rubric_version,
    COUNT(*)                                          AS total_count,
    COUNT(*) FILTER (WHERE a.grade = 'A')             AS grade_a,
    COUNT(*) FILTER (WHERE a.grade = 'B')             AS grade_b,
    COUNT(*) FILTER (WHERE a.grade = 'C')             AS grade_c,
    COUNT(*) FILTER (WHERE a.grade = 'D')             AS grade_d,
    COUNT(*) FILTER (WHERE a.grade = 'F')             AS grade_f,
    ROUND(AVG(a.confidence_score), 1)                 AS avg_confidence,
    COUNT(*) FILTER (WHERE a.analysis_status = 'invalid_document') AS invalid_count
  FROM public.analyses a
  WHERE a.analysis_status IN ('complete', 'invalid_document')
  GROUP BY a.rubric_version
  ORDER BY a.rubric_version;
$$;
```

No RLS needed — `SECURITY DEFINER` function callable by anon, returns only aggregate stats (no PII).

## Step 2: Create `src/hooks/useRubricStats.ts`
A simple hook that calls `supabase.rpc('get_rubric_stats')` and returns the rows. Fetches once on mount.

## Step 3: Create `src/components/dev/RubricComparison.tsx`
A dev-only component (same pattern as `DevQuoteGenerator`):

- **Summary table** — one row per rubric_version showing: total scans, grade distribution (count + percentage), avg confidence, invalid doc count
- **Visual bar** per version — stacked horizontal bar showing A/B/C/D/F proportions with color coding (green → red)
- **Delta row** — if 2+ versions exist, show the shift: "+12% more D grades in v1.1 vs v1.0"
- Uses existing `Table` UI components

## Step 4: Wire into DevPreviewPanel
Add a "Rubric Stats" tab or section in `src/dev/DevPreviewPanel.tsx` that renders `RubricComparison`. Only visible in dev mode.

## Step 5: Show `rubric_version` in DevQuoteGenerator results
Add a `rubricVersion` field to `RunResult` and display it as a column in the results table, so each scenario run shows which rubric version scored it.

## Files Changed
| File | Action |
|------|--------|
| `supabase/migrations/...` | New migration: `get_rubric_stats` RPC |
| `src/hooks/useRubricStats.ts` | New hook |
| `src/components/dev/RubricComparison.tsx` | New component |
| `src/dev/DevPreviewPanel.tsx` | Add Rubric Stats section |
| `src/components/dev/DevQuoteGenerator.tsx` | Add rubric_version column |
| `src/integrations/supabase/types.ts` | Auto-updated by migration |

