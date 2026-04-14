

## Plan: OrangeScanner Three-Scenario Proof Engine Refactor

**Single file**: `src/components/OrangeScanner.tsx` — complete rewrite preserving visual shell.

---

### What Changes

**Delete entirely:**
- `ESTIMATE_DATA` constant (lines 20-55)
- Timer-driven scan engine inside `startScan` (lines 377-408)
- `Math.random()` audit ID in VerdictHologram (line 291)
- Single "GENERATE REBUTTAL REPORT" button in VerdictHologram (lines 283-287)
- Hardcoded ESTIMATE_DATA bindings in header (lines 603-630), table (lines 643-683), totals (lines 691-698), sidebar log (lines 799-814), and footer specs (lines 826-836)
- Old anomaly-count score formula in TrustScoreWidget (line 60)
- Always-on FinePrintScanner render (line 705)

**Add at top of file (~120 lines):**
- `LineItemStatus`, `LineItem`, `ScenarioSpecs`, `AlertLevel`, `QuoteScenario` types
- `quoteScenarios` array with all three scenarios (predatory, vague, fair) using the exact user-provided payload
- `INITIAL_SCANNER_STATE` constant

**Add to component state:**
- `scenarioIndex` (number, default 0)
- `isComplete` (boolean)
- Derived `currentScenario` and `safeScenario` with fallbacks
- `verdictRef` (useRef for focus management)

**Add new `resetScannerState(nextIsScanning)` helper** — resets scanProgress, activeAnomalies, isComplete, isScanning in one call.

**Refactor `startScan`** — guard, advance scenarioIndex (modulo 3) on re-runs, call resetScannerState(true). No timers.

**Add `useEffect` scan engine** — dependency on `[isScanning, scanProgress, currentScenario, isComplete]`. Uses setTimeout with STEP=2/DELAY=40. Deterministic anomaly triggers using `itemStart=24, itemRange=56, stepSize` formula. License trigger at 14, fine print at 84. Lands exactly on 100. Focuses verdictRef on completion.

**Refactor `TrustScoreWidget`** — accept `integrityScore` and `alertLevel` props, remove anomaly-count formula. Color thresholds: <70 red, <85 amber, else cyan.

**Refactor `VerdictHologram`** — accept `alertLevel`, `summaryTitle`, `summaryText`, `integrityScore`, `onScanClick`, `onDemoClick`. Theme colors by alertLevel. Verdict headline locked per spec. Replace single CTA with two-button Decision Gate ("I Have a Quote" / "I Want a Quote") with exact classes, aria-labels, data-testids. Add `aria-live="polite"`, `tabIndex={-1}`, ref binding. Remove `Math.random()` audit ID (use `useRef` for stable ID).

**Add safe callback wrappers** — `safeInvokeScanClick` and `safeInvokeDemoClick` with rate-limited console.warn for missing props.

**Bind document header** to `safeScenario.client`, `.contractor`, `.license`, `.date`, `.quoteRef`. Add two new rows: Specified Brand, NOA Code. License anomaly highlight driven by `activeAnomalies.includes("license")`.

**Insert Executive Summary Alert Box** between header and table — color-coded by alertLevel (red/amber/green), shows summaryTitle + summaryText, border-l-4 style.

**Bind line items table** to `safeScenario.lineItems`. Cost as raw string. Sub-rows with "AUDIT FLAG:" or "VERIFIED:" text labels (no emoji). Color by status.

**Bind totals** to `safeScenario.subtotal` and `safeScenario.total` as raw strings.

**Conditionally render FinePrintScanner** only when `safeScenario.finePrintTrap === true`.

**Bind sidebar audit log** to scenario data — license entry gated by `licenseAnomaly`, fine print gated by `finePrintTrap`, item flags from `lineItems`.

**Bind footer specs** to `safeScenario.specs` (stc, uFactor, shgc, frame).

**Add QA data-testids**: `orange-scanner-have-quote`, `orange-scanner-want-quote`, `orange-scanner-verdict-cta`, `orange-scanner-fineprint`, `orange-scanner-trust-score`.

---

### What Stays Untouched
- All ambient lighting divs
- Scanner bed layout and 3D tilt wrapper
- HUD phase bar (DATA EXTRACTION / CONTEXTUAL INJECTION / COMPLIANCE DETECTION)
- Laser scan line visuals
- Paper texture (grain, coffee ring, fold line, blue stamp)
- ScanCTA component
- Mobile + desktop "Run Demo Audit" button placement and styling
- `onScanClick` / `onDemoClick` prop signature
- Global CSS keyframes and custom scrollbar styles
- Overall dark forensic holographic aesthetic

### Net Result
- ~55 lines deleted (old static data + timer engine + single CTA)
- ~180 lines added (types, scenarios, scan engine useEffect, alert box, Decision Gate, safe wrappers)
- Net ~+125 lines
- Zero files changed besides OrangeScanner.tsx
- Zero visual regression in shell aesthetics
- Three internally rotating scenarios with no visible selector

