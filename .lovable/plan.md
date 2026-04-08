

## Analysis

The spec is clean and consistent with the existing codebase patterns. Two issues worth flagging:

### Issue 1: Overlap with existing `installation.scope_detail`
The `ExtractionResult` already has `installation.scope_detail` (a free-text string). The new `anchoring_method_text`, `waterproofing_method_text`, and `buck_treatment_method_text` fields are more granular extractions from the same domain. This is correct -- the existing field is too coarse to score against. No conflict, just noting the relationship.

### Issue 2: `anchor_spacing_missing` flag triggers conditionally on `anchoring_method_text` presence
The flag fires when anchoring method IS present but spacing IS NOT. This is good design -- it only penalizes incomplete anchoring specs, not quotes that omit anchoring entirely (those get the bigger `anchoring_method_missing` flag). No change needed.

### Issue 3: `buck_treatment_unspecified` vs Area 3's `buck_replacement_unit_pricing_present`
Area 3 already penalizes missing buck replacement *pricing*. Area 4 now penalizes missing buck *treatment method*. These are distinct concerns (cost vs. technique). The combined penalty for a quote that mentions bucks but specifies neither pricing nor method could stack to -20 across pillars. This is appropriate -- both are legitimate gaps.

### Issue 4: `manufacturer_install_compliance_stated` and `code_compliance_install_statement_present` in `scoreSafety`
These are install-related fields being penalized in the safety pillar. The spec assigns the flags to `safety` pillar, which makes sense -- manufacturer compliance and code compliance are safety concerns even though they relate to installation. The penalties are modest (-5 each). No change needed.

No logic errors found. Spec is ready to implement as-is.

---

## Plan

**File: `supabase/functions/scan-quote/scoring.ts`**

### Step 1 -- Extend `ExtractionResult` interface
Add 8 new fields after the change-order/substrate section (~line 122):

```
anchoring_method_text?: string | null;
anchor_spacing_specified?: boolean | null;
fastener_type_specified?: boolean | null;
waterproofing_method_text?: string | null;
sealant_specified?: boolean | null;
buck_treatment_method_text?: string | null;
manufacturer_install_compliance_stated?: boolean | null;
code_compliance_install_statement_present?: boolean | null;
```

### Step 2 -- Patch `scoreSafety()`
After the glass package penalty block (~line 201), add:

```typescript
if (data.manufacturer_install_compliance_stated !== true) score -= 5;
if (data.code_compliance_install_statement_present !== true) score -= 5;
```

### Step 3 -- Patch `scoreInstall()`
After the opening schedule block (~line 244), add:

```typescript
if (!data.anchoring_method_text && items.length > 0) score -= 15;
if (data.anchoring_method_text && data.anchor_spacing_specified !== true) score -= 5;
if (data.anchoring_method_text && data.fastener_type_specified !== true) score -= 5;
if (!data.waterproofing_method_text && items.length > 0) score -= 15;
if (data.sealant_specified !== true && items.length > 0) score -= 5;
if (!data.buck_treatment_method_text && items.length > 0) score -= 10;
```

Note: `items` is already declared in `scoreInstall` at line 235.

### Step 4 -- Add hard-cap in `computeGrade()`
After the `substrate_open_checkbook` hard-cap block (~line 544) and before `zero_line_items`, add:

```typescript
// Hard cap: install method critically underspecified → max C
const installMethodCriticallyUnderspecified =
  items.length > 0 &&
  !data.anchoring_method_text &&
  !data.waterproofing_method_text &&
  data.manufacturer_install_compliance_stated !== true;

if (installMethodCriticallyUnderspecified) {
  if (GRADE_RANK[grade] > GRADE_RANK["C"]) {
    grade = "C";
    hardCapApplied = hardCapApplied
      ? hardCapApplied + "+install_method_unverified"
      : "install_method_unverified";
  }
}
```

### Step 5 -- Bump `RUBRIC_VERSION`
Change from `"1.4.0"` to `"1.5.0"`.

### Step 6 -- Update tests
Add the 8 new fields to the `perfectQuote()` fixture in `index.test.ts` with passing values:

```typescript
anchoring_method_text: "Tapcon concrete anchors",
anchor_spacing_specified: true,
fastener_type_specified: true,
waterproofing_method_text: "DAP Silicone Plus flashing and weep system",
sealant_specified: true,
buck_treatment_method_text: "Pressure-treated 2x4 buck with Boral wrap",
manufacturer_install_compliance_stated: true,
code_compliance_install_statement_present: true,
```

