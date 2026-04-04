

# P4a + P4 Plan: Truth Engine Audit Panel

## Prompt Assessment

Both prompts are good. The second prompt pair (the more detailed one) is better because it specifies exact Tailwind classes, card layouts, and severity badge styles. However, **both prompts contain the same critical error**: they assume `pillar_scores` contains `{ grade: string, summary: string }` objects per pillar. The real shape is **numeric scores (0-100)**:

```text
full_json.pillar_scores = {
  safety:   number,   // 0-100
  install:  number,   // 0-100
  price:    number,   // 0-100
  finePrint: number,  // 0-100 (camelCase, not snake_case)
  warranty: number    // 0-100
}
```

There are no per-pillar grades or summaries in the payload. The letter grade is derived from a weighted average at the top level only. A plan that renders `pillar.grade` and `pillar.summary` will show placeholders for every single pillar on every single lead.

Additionally, `full_json.flags` is an array but its shape differs from the top-level `analysis.flags`. The full_json flags come from the scoring pipeline directly and may have different field names than the `AnalysisFlag` type currently defined in `types.ts`.

## What I Will Add

1. **Numeric-to-letter conversion** for pillar cards (derive per-pillar letter grades from numeric scores using the same thresholds as `computeGrade`)
2. **Correct key mapping**: `finePrint` (camelCase), not `fine_print` (snake_case) for the full_json pillar scores
3. **Extraction metadata surface**: `full_json.extraction` contains contractor name, product details, pricing notes — real operator utility data that neither prompt explicitly maps
4. **SQL pre-flight query** to confirm `full_json` shape from live data before building the UI

## Execution Sequence

### Step 0 — Pre-flight: Inspect live full_json (30 seconds)

Query one real analysis record to confirm the exact key paths before any code changes. This is load-bearing — if `pillar_scores` uses different keys in production than in the source code, the panel silently fails.

### Step 1 — P4a: Backend contract fix (admin-data edge function)

**File**: `supabase/functions/admin-data/index.ts` (line 298)

Change:
```
.select("grade, dollar_delta, confidence_score, flags")
```
To:
```
.select("grade, dollar_delta, confidence_score, flags, full_json")
```

**File**: `src/components/admin/types.ts` — `LeadAnalysisData` interface

Add:
```typescript
full_json: Record<string, unknown> | null;
```

**File**: `src/components/admin/LeadDossierSheet.tsx` (line 97-102)

Update the `.then()` handler to pass through `full_json`:
```typescript
full_json: data.full_json ?? null,
```

No schema changes. No new actions. No response-shape redesign.

### Step 2 — P4: Truth Engine Audit Panel (LeadDossierSheet.tsx)

Add a new collapsible section between "Analysis Results" (existing section 4) and "Activity Timeline" (existing section 5).

**Data mapping** (corrected from both prompts):

```text
Header summary row:
  - Grade:       lead.grade (already on lead object)
  - Confidence:  analysis.confidence_score
  - Dollar Delta: analysis.dollar_delta (formatted as currency)
  - Flag Count:  analysis.flags.length

Pillar cards (from full_json.pillar_scores):
  Key            Display Label              Type
  ─────────────  ─────────────────────────  ──────
  safety         Safety & Code Match        number (0-100)
  install        Install & Scope Clarity    number (0-100)
  price          Price Fairness             number (0-100)
  finePrint      Fine Print & Transparency  number (0-100)  ← camelCase
  warranty       Warranty Value             number (0-100)

  Per-pillar letter grade derived locally:
    ≥80 → A, ≥65 → B, ≥50 → C, ≥35 → D, else → F

  No per-pillar summaries exist in the payload.
  Cards show: pillar label + derived letter grade + numeric score bar.

Flags list:
  Source: analysis.flags (top-level, already fetched)
  Shape: { flag: string, severity: string, detail?: string, pillar?: string }
  Sort: Critical → High → Medium → Low
  Show top 5, "Show more" expander if >5

Operator metadata (from full_json):
  - full_json.rubric_version
  - full_json.extraction.contractor_name (if present)
  - full_json.extraction.total_price
  - full_json.price_fairness
  - full_json.markup_estimate
  - full_json.negotiation_leverage
  Render only fields that exist. Skip silently if absent.
```

**Loading/empty/error states**:
- No `latest_analysis_id` → "No Truth Engine analysis available yet"
- Loading → skeleton placeholder inside section only
- Fetch error → "Unable to load Truth Engine audit" (does not crash dossier)
- Sparse payload → render what exists, show "—" for missing pillars

**UI style**:
- Collapsible via Radix Collapsible (already in project)
- Default expanded
- Operator-dense, not marketing-heavy
- Reuse existing `gradeColor()` helper for badge colors
- Pillar cards: 5-column grid on md+, 2-column on mobile
- Flag severity badges match existing red/amber pattern in dossier

### Hard Constraints
- No schema migrations
- No new backend actions
- No new Supabase queries (uses existing `fetchLeadAnalysis`)
- No changes outside `LeadDossierSheet.tsx`, `types.ts`, and `admin-data/index.ts`
- Backward compatible with sparse or older analysis payloads
- `finePrint` accessed as camelCase (matching scan-quote output)

### Files Modified
1. `supabase/functions/admin-data/index.ts` — add `full_json` to SELECT
2. `src/components/admin/types.ts` — add `full_json` to `LeadAnalysisData`
3. `src/components/admin/LeadDossierSheet.tsx` — pass through `full_json` + new Truth Engine section

### Post-deploy Verification
- Open dossier on a verified lead with analysis
- Confirm pillar cards show numeric scores and derived letter grades
- Confirm flags render sorted by severity
- Confirm sparse/missing payloads degrade gracefully (no crash)
- Confirm section collapses on toggle
- Check mobile layout at 375px viewport

