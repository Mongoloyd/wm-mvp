

# Plan: Rubric Intelligence Dashboard Improvements

## Current State
The base dashboard is fully built: `get_rubric_stats` RPC, `useRubricStats` hook, `RubricComparison` component with grade bars and deltas, wired into DevPreviewPanel, and `rubricVersion` column in DevQuoteGenerator. All working.

## What's Missing for "Intelligence System"

The current dashboard shows static snapshots. To make it a true governance and iteration tool, here are the improvements:

### 1. Weighted Grade Score (single number per version)
Right now you compare 5 grade percentages across versions -- too much cognitive load. Add a single "Rubric Quality Score" per version:
```
Score = (A*4 + B*3 + C*2 + D*1 + F*0) / total_graded
```
Range 0-4. Higher = more lenient. This makes version comparison instant: "v1.0 scored 2.8, v1.1 scored 2.1 -- v1.1 is stricter."

**Change**: Update `get_rubric_stats` RPC to return `avg_grade_score numeric`. Display as a prominent metric in `RubricComparison`.

### 2. Confidence Distribution Indicator
`avg_confidence` alone hides variance. A version could average 0.7 but have half its scores at 0.4 (unreliable). Add `min_confidence` and `max_confidence` to the RPC so you can see the spread.

**Change**: Add two columns to the RPC return type. Show as "0.4 - 0.9 (avg 0.7)" in the table.

### 3. Sample Size Warning
If v1.1 has 3 scans vs v1.0's 50, the delta is statistically meaningless. Add a visual warning when a version has fewer than 10 graded scans, so you don't make rubric decisions on insufficient data.

**Change**: Frontend-only. Render a caution icon next to versions with `total_count < 10`.

### 4. Time-Windowed Stats
Current RPC shows all-time aggregates. A rubric might perform differently on recent quotes vs old ones. Add an optional time window parameter.

**Change**: Create `get_rubric_stats_windowed(p_days integer DEFAULT NULL)` variant, or add a `WHERE created_at > now() - interval '...'` filter. Add a "Last 7d / 30d / All" toggle in the UI.

### 5. "Winner" Indicator
When 2+ versions exist with sufficient sample size, auto-highlight which version has the best quality score (or let the user pick their target distribution). Removes guesswork.

**Change**: Frontend logic in `RubricComparison` -- compare `avg_grade_score` across rows, highlight the row with the score closest to a target (e.g., 2.0 = balanced).

---

## Implementation

### Database Migration
Alter `get_rubric_stats` to return three additional columns:

```sql
DROP FUNCTION IF EXISTS public.get_rubric_stats();
CREATE FUNCTION public.get_rubric_stats()
RETURNS TABLE(
  rubric_version text,
  total_count bigint,
  grade_a bigint, grade_b bigint, grade_c bigint, grade_d bigint, grade_f bigint,
  avg_confidence numeric,
  min_confidence numeric,
  max_confidence numeric,
  avg_grade_score numeric,
  invalid_count bigint
) ...
-- avg_grade_score = ROUND((A*4 + B*3 + C*2 + D*1) / NULLIF(graded,0), 2)
```

### Hook Update (`useRubricStats.ts`)
- Add `min_confidence`, `max_confidence`, `avg_grade_score` to `RubricStatRow`
- Add optional `days` parameter to support time-windowed queries (future)

### Component Update (`RubricComparison.tsx`)
- Add "Quality Score" column showing `avg_grade_score` with color coding (green near 2.0, yellow at extremes)
- Add confidence range display
- Add caution badge for `total_count < 10`
- Highlight the "winner" row when 2+ versions with 10+ scans exist
- Add time window toggle (7d / 30d / All) using simple button group

### Files Changed
| File | Change |
|------|--------|
| `supabase/migrations/...` | Replace `get_rubric_stats` with enhanced version |
| `src/hooks/useRubricStats.ts` | Expand interface, add optional time filter |
| `src/components/dev/RubricComparison.tsx` | Quality score, confidence range, warnings, winner highlight, time toggle |
| `src/integrations/supabase/types.ts` | Auto-updated |

