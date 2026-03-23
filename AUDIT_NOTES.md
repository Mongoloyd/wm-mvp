# WM-MVP Post-Refactor Frontend Continuity Audit

## Phase 1: Static Code Inspection

### BUG 1: LinearHeader "Get Started Free" — no click handler
**File**: `src/components/LinearHeader.tsx:22` and `src/pages/Index.tsx:103`
**Issue**: `onCtaClick` prop is optional, defaults to undefined. Index.tsx renders `<LinearHeader />` with no props.
**Result**: Clicking "Get Started Free" does nothing.
**Fix**: Pass `onCtaClick={() => triggerTruthGate('header_cta')}` in Index.tsx.

### BUG 2: `id="market-baseline"` scroll target missing
**File**: `src/components/MarketBaselineTool.tsx` — root div has no `id` attribute
**Consumers**: FlowCEntry.tsx:39, ScamConcernImage.tsx:13, StickyRecoveryBar.tsx:11, Index.tsx:166
**Result**: All Flow B/C scrolls to baseline tool silently fail (no crash, just no scroll).
**Fix**: Add `id="market-baseline"` to MarketBaselineTool root div.

### OBSERVATION: ScanTheatrics cliffhanger is purely visual (by design)
4 phases: scanning → cliffhanger → pillars → reveal. Cliffhanger auto-advances after 2000ms. No user interaction. Lead capture happens BEFORE scan (TruthGateFlow) and AFTER scan (OTP gate in report).

### OBSERVATION: AnalysisViewMode toggle is dead code in production
`useAnalysisViewMode()` only consumed by dev panel's AnalysisViewModeToggle. PostScanReportSwitcher always renders TruthReportClassic regardless of mode.

### OBSERVATION: TruthReportFindings is orphaned dead code
Not imported by any production component. Safe to remove.

### OBSERVATION: No production CTA points to /demo-classic or any V2 route
All production-facing CTAs use `triggerTruthGate()` (scroll to truth-gate) or `triggerPowerTool()` (scroll to top + open PowerToolDemo). No links to deleted routes.

---

## Phase 2: Browser Test — Header/Navbar

| Element | Expected | Result |
|---------|----------|--------|
| Logo "WINDOWMAN.PRO" (index 2) | Navigate to `/` | PASS — `<a href="/">` works |
| "Get Started Free" (index 3) | Scroll to truth-gate | FAIL — Nothing happens (no handler) |

---

## Phase 3: Browser Test — Homepage CTAs

| Element | Expected | Result |
|---------|----------|--------|
| Hero "Scan My Quote — It's Free" (index 4) | Scroll to `#truth-gate` | PASS — Smooth scrolls to TruthGateFlow (Step 1 of 4 visible after ~3s) |
| Sticky footer "Scan My Quote" (index 5) | Scroll to `#truth-gate` | PASS — Calls `triggerTruthGate('sticky_footer')`, scrolls to truth-gate via useEffect with double-rAF |
| Sticky footer "Watch Live Demo" (index 6) | Trigger PowerToolDemo | (testing next) |
| "SEE THE AI IN ACTION" hero button | Trigger PowerToolDemo | (testing next) |
| "Getting Quotes Soon?" hero button | Switch to Flow B | (testing next) |

### Note on triggerTruthGate scroll behavior
The `triggerTruthGate` function does NOT call `scrollIntoView` directly. It sets `pendingScrollRef.current = true` and then a `useEffect` watches for `flowMode === 'A' && !gradeRevealed` to trigger the actual scroll via double `requestAnimationFrame`. This means the scroll happens asynchronously after React re-renders, which is why there's a delay.

The hero CTA in AuditHero uses a DIFFERENT mechanism: `document.getElementById("truth-gate")?.scrollIntoView({ behavior: "smooth" })` directly. This is simpler and scrolls immediately.

---

## Phase 4: Browser Test — Footer CTAs
(testing next)

## Phase 5: Browser Test — Route Safety
(testing next)

## Phase 6: Browser Test — ScanTheatrics Cliffhanger
(testing next)
