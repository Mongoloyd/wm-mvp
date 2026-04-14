

## Scoring Engine Fixture Corrections — Implementation Plan

### Confirmed Defects (3 from audit + 1 bonus)

| # | Scenario | File Line | Current Expected | Correct Grade | Defect Type |
|---|----------|-----------|-----------------|---------------|-------------|
| 1 | inspectionTrap | L573 | C | **D** | Stale expectation — `unilateral_price_adjustment` D-cap makes C unreachable |
| 2 | vagueScope | L670 | D | **F** | Stale expectation — weighted avg = 33, below D threshold (37). D-caps are ceilings, not floors |
| 3 | mixedPillars | L524-525 | B | **A** (currently) | Mock data defect — inherits perfect install/scope/finePrint from base. Must degrade install fields |
| 4 | cornerCutting | L596 | D | **F** | Same pattern as vagueScope — hand-crafted, too sparse, weighted avg ~30 |

### Changes to `src/test/createMockQuote.ts`

**Fix 1 — inspectionTrap (L573)**: Change `expectedGrade` from `"C"` to `"D"`.

**Fix 2 — vagueScope (L670)**: Change `expectedGrade` from `"D"` to `"F"`. The data is intentionally sparse ("kept hand-crafted to preserve intentionally sparse scope language") — enriching it would defeat its purpose.

**Fix 3 — mixedPillars (L526-542)**: Add extraction overrides using `undefined` (which `deepMerge` treats as "delete from base") to actually degrade the install pillar as the description claims:
```ts
{
  // ... existing overrides ...
  // Degrade install pillar to match "sparse install" description
  anchoring_method_text: undefined,
  waterproofing_method_text: undefined,
  buck_treatment_method_text: undefined,
  sealant_specified: undefined,
  opening_schedule_present: undefined,
  opening_schedule_room_labels_present: undefined,
  opening_schedule_dimensions_complete: undefined,
  opening_schedule_product_assignments_present: undefined,
  installation: {
    scope_detail: "Install windows per specification",
    disposal_included: false,
    accessories_mentioned: false,
  },
}
```
This drops install from 100 to ~55, bringing weighted avg to ~82 → B. No hard caps fire because `manufacturer_install_compliance_stated` is still true (preventing `install_method_unverified` C-cap).

**Fix 4 — cornerCutting (L596)**: Change `expectedGrade` from `"D"` to `"F"`. Same root cause as vagueScope — hand-crafted sparse data, weighted avg below 37.

### Changes to `supabase/functions/scan-quote/scoring.test.ts`

Add 3 new test cases from Section 8 of the audit:

1. **Cumulative amber risk** — Minor weaknesses across all 5 pillars, no hard cap triggers, verify grade B
2. **Perfect safety + empty scope** — Safety=100, no install/warranty/permits, verify C with hard caps
3. **High-quality products + predatory payment** — Perfect specs but `unilateral_price_adjustment_allowed: true`, verify D-cap overrides B-level weighted average

These use the existing `makeQuote` helper from `fixtures.ts` and `BASE_GOOD_QUOTE`, not the client-side `createMockQuote.ts`.

### Changes to `supabase/functions/scan-quote/fixtures.ts`

No changes — this file serves the Deno scoring tests and is already correct.

### What is NOT changed

- `scoring.ts` — rubric logic is correct; all 16 existing tests pass
- `DevQuoteGenerator.tsx` — UI component reads `expectedGrade` dynamically
- No scenario keys, labels, or fixture structure changes

### Verification

After implementation, run `supabase--test_edge_functions` for `scan-quote` to confirm existing + new scoring tests pass.

