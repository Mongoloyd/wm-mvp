

## Confirmed constraints

1. Public route is `/diagnosis` (final). No `/estimate` rename. No duplicate entry points.
2. Mechanical extraction first — preserve all current behavior, copy, chip sets, guarantees, mirror panel, SLA logic, success state.
3. `useDiagnosticIntake` hook will be full-fidelity (all listed state preserved).
4. No local tracking wrapper — import canonical `trackGtmEvent` from `@/lib/trackConversion` directly.
5. Mock hydration stays with explicit `// TODO(arc-5): hydrate from real lead/report context`.
6. No new diagnosis branches — preserve current 8-diagnosis union exactly.
7. Safe extraction order followed (types → constants → helpers → hook → step components → entry → route → tracking swap).

## Audit findings

- `src/pages/diagnosis.tsx` — 1,493 lines, lowercase filename, contains inline toy `App` shell at lines 1466–1493. **Not currently wired** into `src/App.tsx`.
- `src/App.tsx` — has `/estimate` route (post-Arc-4 conversion page at `src/pages/Estimate.tsx`). `/estimate` is a separate page, NOT a duplicate of `/diagnosis`. Both can coexist; only the toy inline router inside `diagnosis.tsx` needs removal.
- No existing `/diagnosis` route. Safe to add a single new route.
- Canonical tracking: `trackGtmEvent` from `src/lib/trackConversion.ts`.

## Target file tree

```text
src/
  App.tsx                                    [EDIT — add /diagnosis route + import]
  pages/
    Diagnosis.tsx                            [CREATE — page entry, ~80 lines]
    diagnosis.tsx                            [DELETE — after extraction complete]
    diagnosis/
      types.ts                               [CREATE — StepId, DiagnosisCode, DiagnosticConfig, SLAPromise]
      constants/
        diagnosticMap.ts                     [CREATE — DIAGNOSTIC_MAP + DIAGNOSIS_ORDER, ~210 lines]
        windowOptions.ts                     [CREATE — WINDOW_STYLES, WINDOW_CONCERNS, FRAME_MATERIALS]
        branchChips.ts                       [CREATE — BRANCH_DYNAMIC_CHIPS + generateConditionalStatement]
      lib/
        formatters.ts                        [CREATE — formatPhoneNumber, sanitizeZip, maskPhone, maskEmail]
        sla.ts                               [CREATE — getSLAPromise + business hours]
      hooks/
        useDiagnosticIntake.ts               [CREATE — full-fidelity state hook, ~150 lines]
      components/
        ProgressIndicator.tsx                [CREATE — ~30 lines]
        StepIntake.tsx                       [CREATE — root chip step, ~120 lines]
        StepDiagnosis.tsx                    [CREATE — 4 chip groups, ~210 lines]
        StepPrescription.tsx                 [CREATE — mirror + counter-offer + SLA + submit, ~290 lines]
        SuccessScreen.tsx                    [CREATE — ~60 lines]
        MarketingSections.tsx                [CREATE — Step 1 marketing blocks, ~110 lines]
```

## Exact route diff

`src/App.tsx`:

```diff
 const Estimate = lazy(() => import("./pages/Estimate.tsx"));
+const Diagnosis = lazy(() => import("./pages/Diagnosis.tsx"));
```

```diff
 <Route path="/estimate" element={<Estimate />} />
+<Route path="/diagnosis" element={<Diagnosis />} />
```

Single new public route. `/estimate` (Arc 4 conversion page) is unrelated and stays. Toy `App` shell inside `diagnosis.tsx` is dead code — removed by virtue of deleting that file.

## Hook fidelity contract

`useDiagnosticIntake` will expose exactly:

State: `step`, `primaryDiagnosis`, `secondaryClarifiers`, `otherFreeText`, `windowStyles`, `windowConcerns`, `frameMaterial`, `counterOfferTerms`, `counterOfferFreeText`, `context` (hydrated lead/report — mock for now), `isSubmitting`, `submitSuccess`.

Derived: `activeConfig`, `confidence`, `hasCounterOffer`, `canAdvanceFromDiagnosis`, `slaPromise`.

Handlers: `setStep`, `selectPrimaryDiagnosis`, `toggleSecondaryClarifier`, `setOtherFreeText`, `toggleWindowStyle`, `toggleWindowConcern`, `setFrameMaterial`, `toggleCounterOfferTerm`, `setCounterOfferFreeText`, `handleSubmit`, `handleContactEdit` (preserves current `alert` for now).

## Out of scope (will NOT touch)

- `src/components/consentBanner.tsx` build errors — pre-existing, unrelated to diagnosis page. Will flag separately after extraction.
- `/estimate` route or `Estimate.tsx` — Arc 4 work, separate concern.
- Any copy, chip, SLA, or diagnosis-config changes.
- Real lead hydration (deferred to Arc 5 with TODO marker).

## Execution order (after approval)

1. Create `types.ts`
2. Create `constants/diagnosticMap.ts`, `constants/windowOptions.ts`, `constants/branchChips.ts`
3. Create `lib/formatters.ts`, `lib/sla.ts`
4. Create `hooks/useDiagnosticIntake.ts` (full-fidelity)
5. Create `components/ProgressIndicator.tsx`, `SuccessScreen.tsx`, `MarketingSections.tsx`
6. Create `components/StepIntake.tsx`, `StepDiagnosis.tsx`, `StepPrescription.tsx`
7. Create `src/pages/Diagnosis.tsx` (page entry, no toy router)
8. Edit `src/App.tsx` — add lazy import + `/diagnosis` route
9. Delete `src/pages/diagnosis.tsx`
10. Swap local `trackEvent` stub for canonical `trackGtmEvent` import inside the hook (last step, isolated diff)

