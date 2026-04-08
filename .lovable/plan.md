

## Analysis

### Issue 1: `warranty_service_provider_unspecified` trigger is truncated
The spec shows the trigger as `data.warranty && (!data.warranty_service_provider_type` — cut off. Based on the flag name and the scoring penalty pattern, the complete trigger is clearly: `data.warranty && (!data.warranty_service_provider_type || data.warranty_service_provider_type === "unknown")`.

### Issue 2: `finish_exclusions_present` trigger is truncated
Shows `data.post_install_stucco_excluded === true` — cut off. Logical completion: `data.post_install_stucco_excluded === true || data.post_install_paint_excluded === true`. This is a Caution-level flag combining both finish exclusions.

### Issue 3: Early return in `scoreWarranty` blocks new penalties
Current `scoreWarranty` has `if (!data.warranty) return clamp(score - 40);` at line 366. The new penalties are all gated by `if (data.warranty) { ... }`, so they only fire when warranty exists. This is correct — the early return handles the "no warranty" case, and the new block handles the "warranty exists but is opaque" case. No conflict.

### Issue 4: Hard-cap interaction with existing `no_warranty_section`
The new `opaque_warranty_execution` hard-cap (max C) only fires when `!!data.warranty` — i.e., warranty section exists but execution is opaque. The existing `no_warranty_section` hard-cap (also max C) fires when `!data.warranty`. These are mutually exclusive. Clean.

### Issue 5: `leak_callback_sla_days` tiered penalty is good design
The spec uses a 3-tier SLA penalty (null → -15, >14 days → -10, >7 days → -5, ≤7 → no penalty). This is more nuanced than typical boolean penalties. No issues.

No logic errors found. Spec is ready to implement with the two truncated triggers completed as described.

---

## Plan

**Files: `scoring.ts` + `index.test.ts`**

### Step 1 — Extend `ExtractionResult` interface
Add 9 new fields after the installation method block (~line 132):

```
// ── Warranty execution fields ──────────────────────────────────────────────
warranty_execution_details_present?: boolean | null;
warranty_service_provider_type?: "contractor" | "manufacturer" | "third_party" | "unknown" | null;
warranty_service_provider_name?: string | null;
leak_callback_sla_days?: number | null;
labor_service_sla_days?: number | null;
callback_process_text?: string | null;
post_install_stucco_excluded?: boolean | null;
post_install_paint_excluded?: boolean | null;
water_intrusion_damage_excluded?: boolean | null;
```

### Step 2 — Patch `scoreWarranty()`
After the existing `if (!data.warranty.details) score -= 10;` block (~line 393), before the `return`, add the full warranty execution penalty block:

```typescript
// ── Warranty execution details ─────────────────────────────────────────
if (data.warranty_execution_details_present !== true) score -= 15;

if (!data.warranty_service_provider_type || data.warranty_service_provider_type === "unknown") {
  score -= 10;
}

if (data.leak_callback_sla_days == null) {
  score -= 15;
} else if (data.leak_callback_sla_days > 14) {
  score -= 10;
} else if (data.leak_callback_sla_days > 7) {
  score -= 5;
}

if (data.labor_service_sla_days == null) score -= 5;
if (!data.callback_process_text) score -= 10;

if (data.post_install_stucco_excluded === true) score -= 5;
if (data.post_install_paint_excluded === true) score -= 5;
if (data.water_intrusion_damage_excluded === true) score -= 15;

if (
  data.warranty_service_provider_type === "third_party" &&
  !data.warranty_service_provider_name
) {
  score -= 5;
}
```

Note: This block is inside the existing `if (data.warranty)` guard (the early return at line 366 handles the no-warranty case).

### Step 3 — Add hard-cap in `computeGrade()`
After the `install_method_unverified` hard-cap block (~line 582) and before `zero_line_items`, add:

```typescript
// Hard cap: warranty exists but execution is opaque → max C
const warrantyExistsButExecutionIsOpaque =
  !!data.warranty &&
  (!data.warranty_service_provider_type || data.warranty_service_provider_type === "unknown") &&
  data.leak_callback_sla_days == null &&
  !data.callback_process_text;

if (warrantyExistsButExecutionIsOpaque) {
  if (GRADE_RANK[grade] > GRADE_RANK["C"]) {
    grade = "C";
    hardCapApplied = hardCapApplied
      ? hardCapApplied + "+opaque_warranty_execution"
      : "opaque_warranty_execution";
  }
}
```

### Step 4 — Bump `RUBRIC_VERSION`
Change from `"1.5.0"` to `"1.6.0"`.

### Step 5 — Update tests
Add the 9 new fields to `perfectQuote()` in `index.test.ts`:

```typescript
warranty_execution_details_present: true,
warranty_service_provider_type: "contractor",
warranty_service_provider_name: "WindowMan Pro Services",
leak_callback_sla_days: 3,
labor_service_sla_days: 5,
callback_process_text: "Call main office, technician dispatched within 72 hours",
post_install_stucco_excluded: false,
post_install_paint_excluded: false,
water_intrusion_damage_excluded: false,
```

### Truncated trigger completions (for `detectFlags` in index.ts, future step)
- `warranty_service_provider_unspecified`: `data.warranty && (!data.warranty_service_provider_type || data.warranty_service_provider_type === "unknown")`
- `finish_exclusions_present`: `data.post_install_stucco_excluded === true || data.post_install_paint_excluded === true`

