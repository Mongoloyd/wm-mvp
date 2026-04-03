

# "Single Client" Match Logic — What It Fixes and What It Enables

## What the current code does (the problem)

The existing `computeSuggestedMatch` in `generate-contractor-brief/index.ts` was designed for a **multi-contractor marketplace**. It:

1. **Skips non-vetted contractors entirely** (line 252: `continue`)
2. **Penalizes county mismatches by -20** (line 264) — if your one contractor doesn't list the lead's county, their score drops, potentially below zero, meaning **no match is returned at all**
3. **Penalizes window count out-of-range by -10** (line 293)
4. **Penalizes low-grade leads by -15** if `accepts_low_grade_leads` is false (line 304)
5. **Starts at score 0** — so penalties can push the contractor below the `score > 0` threshold (line 314), resulting in **zero candidates**

**Net effect**: With a single contractor, any mismatch (wrong county, wrong window count range, low grade without the flag set) can result in **no suggested match at all**. The homeowner sees no CTA, no match card, no momentum — lost conversion.

## What the new logic fixes

1. **Starts at 50 baseline** — your single contractor always enters the candidate pool
2. **Removes all penalties** — county mismatch becomes a neutral "regional coverage" positive spin instead of -20
3. **Removes the vetted-only gate** — still gives a +20 bonus for vetted, but doesn't skip non-vetted (future-proofing)
4. **Reframes low-grade leads as high-opportunity** — D/F grades get +20 bonus ("target vulnerability specialist") instead of a potential -15 penalty
5. **Guarantees a match** — every lead gets a suggested contractor, every report shows the CTA

## What it enables

- **100% match rate**: Every scanned quote produces a contractor suggestion
- **Every Truth Report shows the "Get Matched" CTA** with a confident match card
- **D/F grades become your best leads** — the worse the quote, the higher the match score and the stronger the CTA framing
- **No dead-end reports** — removes the scenario where a homeowner verifies their phone, sees their report, but gets no next step

## Implementation — 2 files to change

### File 1: `supabase/functions/generate-contractor-brief/index.ts`
- Replace `computeSuggestedMatch` (lines 228-333) with the new single-client logic
- Remove `projectType` and `windowCount` params (simplified)
- Confidence becomes binary: high (≥70) or medium (everything else)

### File 2: `src/shared/matchReasons.ts`
- Add two new reason keys to the taxonomy:
  - `primary_market_partner` — "WindowMan's preferred market partner"
  - `regional_service_coverage` — "Serves your region"
  - `target_vulnerability_specialist` — "Specializes in quotes that need significant improvement"
- Add corresponding homeowner-friendly and admin labels

### Edge function redeploy
- The `generate-contractor-brief` function will need redeployment after the change

