

## What's there now (preview state, before any change)

The pre-OTP view today already shows:

1. **Report header** — "WindowMan Truth Report™" + county + date + grade letter circle
2. **Grade verdict band** — GRADE C / "REVIEW BEFORE SIGNING" + verdict line
3. **Locked Preview teaser** (small strip) — `summaryTeaser || topWarning` + `missingItemsCount` + one example missing item
4. **Risk Summary Header** — "High Risk Detected: N critical issues..." (uses `flagRedCount`/`flagAmberCount` props)
5. **Document Verified strip** — Multi-Page · Line Items · Contractor Identified · READ QUALITY: GOOD
6. **Top Violation Summary Strip** — single most-important violation card (from `selectTopViolation`)
7. **5-Pillar section** — pillar names + bands (no exact scores in preview)
8. **LockedOverlay** dimming the rest, with a small headline showing `{issueCount} issues, {redCount} critical`

**Weakness:** the gate card says only "We found N issues, including N critical." It does NOT name:
- the **weakest pillar** (e.g. "Price Fairness scored lowest")
- a **proof-of-read** anchor inside the gate (it's far above the gate, easy to miss on mobile)
- the **grade band label** ("REVIEW BEFORE SIGNING") inside the gate
- a clear **"3 of 5 findings hidden"** counter

The gate looks generic. The Truth Report area above it has the value, but the gate itself doesn't echo it.

---

## What changes — exactly 3 files

### 1. `src/components/LockedOverlay.tsx` — enrich the gate card

Add 3 new optional props (purely presentational, derived from already-available preview-safe data):

```ts
gradeLabel?: string;        // e.g. "REVIEW BEFORE SIGNING"
weakestPillarLabel?: string; // e.g. "Price Fairness"
hiddenFindingsCount?: number; // total - shown-in-teaser
```

Inside the gate card (above the existing subtext), insert a compact 3-row "Latent Value Strip":

```
┌──────────────────────────────────────┐
│ GRADE C · REVIEW BEFORE SIGNING      │  ← grade band echo
│ Weakest area: Price Fairness         │  ← weakest pillar
│ 4 critical findings still hidden     │  ← hidden counter
└──────────────────────────────────────┘
```

All three rows are conditional — if a value is missing, that row is omitted (no invented data per constraints).

The existing `subtext` line ("We found N issues, including N critical…") stays unchanged.

### 2. `src/components/TruthReportClassic.tsx` — pass the 3 derived values to `LockedOverlay`

In the gate render (`gateProps` spread), add:

- `gradeLabel: gradeConfig[grade]?.label`
- `weakestPillarLabel`: derived inline from `pillarScores` — pick the lowest-banded pillar (status `fail` first, then `warn`); fallback `null`
- `hiddenFindingsCount`: `Math.max(0, (flagCountProp ?? 0) - 1)` (1 = the one shown in TopViolationSummaryStrip)

Zero new fetches. All three values come from props already received from `useAnalysisData` preview.

### 3. `src/components/post-scan/PostScanReportSwitcher.tsx` — thread the props through

The switcher already builds `gateProps`. Add a tiny extension so the new fields flow to `TruthReportClassic` → `LockedOverlay`. No logic change, no new state, no new effects.

---

## What does NOT change

| File / system | Status |
|---|---|
| `useAnalysisData` | untouched |
| `usePhonePipeline` | untouched |
| `scan-quote` / `send-otp` / `verify-otp` | untouched |
| Preview-safe fetch contract | untouched (no new payload fields) |
| `RevealPhase` derivation | untouched |
| OTP gate logic / TCPA / resend / shake | untouched |
| Full report fetch & RLS | untouched |
| `TopViolationSummaryStrip` / `RiskSummaryHeader` / pillar bands | untouched |
| Mobile sticky unlock CTA | untouched |
| New components / files | none created |

---

## Why this increases curiosity without leaking value

- **Grade label echo** ("REVIEW BEFORE SIGNING") inside the gate makes the lock feel earned — the user already saw the letter, now the gate confirms severity.
- **Weakest pillar name** ("Price Fairness") is a *category*, not a finding. It hints where the risk lives without disclosing the actionable detail (which item, which dollar amount, which clause). This is the same level of information the existing pillar-bands already render above.
- **"4 critical findings still hidden"** quantifies what's behind the lock — the Zeigarnik effect that's already used in the progress bar, applied to findings count. The number is derived from `flagCount`, which is already exposed in the preview payload.
- All three are **summaries of preview-safe aggregates**, not new data leaks. The full flags array, exact pillar scores, contractor-sensitive intelligence, and scoring internals stay backend-gated.

---

## Files to change

| File | Action | Scope |
|---|---|---|
| `src/components/LockedOverlay.tsx` | EDIT | +3 optional props, +1 small "latent value" strip inside the existing gate card |
| `src/components/TruthReportClassic.tsx` | EDIT | derive 3 values from existing props, pass them into `gateProps` |
| `src/components/post-scan/PostScanReportSwitcher.tsx` | EDIT | extend `gateProps` typing/spread to forward the 3 new fields |

No new files. No backend touch. No new fetches. Verify-to-Reveal preserved.

