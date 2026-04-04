

## P0 Bug Squash Plan — Two Critical Fixes

### Task 1: Fix `get_analysis_full` Cross-Session Bug (Backend)

**Current behavior:** The RPC checks `phone_verifications.status = 'verified'` joined through leads/scan_sessions. When authorization fails, it returns zero rows silently — the frontend sees an empty result and doesn't know why.

**Actual issues to fix:**
1. The RPC should also check `leads.phone_verified = true` for belt-and-suspenders verification.
2. On authorization failure, the frontend gets `null` from `row`, logs "returned empty" and silently returns — the OTP modal never dismisses and the user is stuck.

**Fix:**
- **Migration:** Replace `get_analysis_full` with a version that:
  - Checks `leads.phone_verified = true` in addition to the phone_verifications join
  - Returns a structured error row (e.g., `grade = '__UNAUTHORIZED__'`) when auth fails, instead of returning nothing
- **Frontend (`useAnalysisData.ts`):** In `fetchFull`, detect the `__UNAUTHORIZED__` sentinel and set an explicit error state instead of silently returning.

### Task 2: Fix "Zero Flags" Ghost in TruthReportClassic (Frontend)

**Current behavior (lines 128-135 of TruthReportClassic.tsx):**
```typescript
const flagsDerivedRed = flags.filter(f => resolveEffectiveSeverity(f) === "red").length;
// In preview: flags is [], so flagsDerivedRed = 0
const redCount = isFull ? flagsDerivedRed : (flagRedCountProp ?? flagsDerivedRed);
// If flagRedCountProp is 0 (falsy!), ?? treats it as defined, so it's fine.
// But if flagRedCountProp is undefined, fallback is flagsDerivedRed = 0. Bug!
```

Wait — `0 ?? 0` is `0`, which is correct. The `??` operator only falls through on `null`/`undefined`. So if `flagRedCountProp` is `3`, it stays `3`. The actual data flow: `activeData.flagRedCount` comes from `useAnalysisData` which sets it from `row.flag_red_count ?? 0` in preview. This should work.

**Real bug:** The `summaryText` on line 143 shows "no issues" when all counts are 0. But in preview mode, the counts should be non-zero if the backend preview returned them. Let me re-check — the `greenCount` calculation on line 134:
```typescript
const greenCount = isFull ? flagsDerivedGreen : Math.max(0, (flagCountProp ?? 0) - (flagRedCountProp ?? 0) - (flagAmberCountProp ?? 0));
```
If `flagCountProp` is passed as the total flag count (say 5), and red=3, amber=2, then green=0. The `issueCount = redCount + amberCount` on line 135. This should be 5 in that case.

The props ARE being passed from Index.tsx (lines 325-327). So the issue might be that `flagCount`/`flagRedCount`/`flagAmberCount` are `undefined` when first rendered (before preview data loads). But `activeData` guard on line 308 means we only render when data exists.

**Possible real bug:** `PostScanReportSwitcher` receives `flagCount` etc. as optional props, and spreads them to `TruthReportClassic` via `{...props}`. But `TruthReportClassic` receives them as `flagCount: flagCountProp` which could be `undefined` if not in `PostScanReportSwitcher.Props`.

Looking at PostScanReportSwitcher's Props type — it has `flagCount?: number`, `flagRedCount?: number`, `flagAmberCount?: number`. These are spread as `{...props}` to TruthReportClassic. So they flow through correctly.

**The actual fix the user wants:** Stop relying on the `flags.length` fallback entirely. In preview mode, ALWAYS use the aggregate prop counts, never derive from the empty flags array. This makes the code more resilient.

**Fix in `TruthReportClassic.tsx`:**
```typescript
// Preview mode: NEVER derive from flags array (it's intentionally empty)
const redCount = isFull ? flagsDerivedRed : (flagRedCountProp ?? 0);
const amberCount = isFull ? flagsDerivedAmber : (flagAmberCountProp ?? 0);
const totalFlagCount = isFull ? flags.length : (flagCountProp ?? 0);
const greenCount = isFull ? flagsDerivedGreen : Math.max(0, totalFlagCount - redCount - amberCount);
```

Also fix `RiskSummaryHeader.tsx` — it already uses `flagRedCountProp ?? 0` in preview mode, so it's correct.

---

### Files Changed

| File | Change |
|---|---|
| **Migration** | Replace `get_analysis_full` RPC — add `leads.phone_verified` check + return error sentinel on auth failure |
| `src/hooks/useAnalysisData.ts` | Detect `__UNAUTHORIZED__` sentinel in `fetchFull`, set error state |
| `src/components/TruthReportClassic.tsx` | Lines 128-134: Remove `flagsDerivedRed`/`flagsDerivedAmber` fallback in preview mode; always use aggregate props |

### What does NOT change
- `RiskSummaryHeader.tsx` — already correctly uses prop counts in preview mode
- `PostScanReportSwitcher.tsx` — prop passthrough is correct
- `Index.tsx` — already passes all three aggregate count props

