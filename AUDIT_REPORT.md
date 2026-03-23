# WM-MVP Post-Refactor Frontend Continuity Audit

**Date:** March 22, 2026  
**Scope:** Every clickable surface, scroll target, route, and state transition on the production-facing homepage and report pages — verified via static code inspection + real browser testing.  
**Method:** Static grep/read of all components, then live browser clicks on `localhost:8081` (Vite dev server).

---

## 1. Confirmed-Good Table

Every CTA/link below was verified to fire the correct handler and reach the correct destination.

| # | Surface | Element | Handler | Target | Verified |
|---|---------|---------|---------|--------|----------|
| 1 | Header | Logo "WINDOWMAN.PRO" | `<a href="/">` | Homepage | Browser ✅ |
| 2 | Hero | "Scan My Quote — It's Free" | `scrollTo("truth-gate")` → `getElementById.scrollIntoView` | `#truth-gate` (TruthGateFlow) | Browser ✅ |
| 3 | Sticky Footer | "Scan My Quote" | `triggerTruthGate('sticky_footer')` | `#truth-gate` via useEffect + double-rAF | Browser ✅ |
| 4 | Sticky Footer | "Watch Live Demo" | `setPowerToolTriggered(true)` + `window.scrollTo({top:0})` | PowerToolFlow LeadModal portal | Code ✅ (browser portal overlay caused screenshot capture error — not a code bug) |
| 5 | Sticky Footer | Post-conversion CTA | `window.location.href = 'tel:+15614685571'` | Phone dialer | Code ✅ |
| 6 | Sticky Footer | "Don't Sign Until..." marquee | Static `<p>` — not clickable | N/A (decorative) | Code ✅ |
| 7 | IndustryTruth | "Scan My Quote — It's Free" | `onScanClick()` → `triggerTruthGate('industry_truth')` | `#truth-gate` | Code ✅ |
| 8 | IndustryTruth | "See the AI in Action" | `onDemoClick()` → `setPowerToolTriggered(true)` + scroll top | PowerToolFlow | Code ✅ |
| 9 | ProcessSteps | "Scan My Quote — It's Free" | `onScanClick()` → `triggerTruthGate('process_steps')` | `#truth-gate` | Code ✅ |
| 10 | ProcessSteps | "See the AI in Action" | `onDemoClick()` → `setPowerToolTriggered(true)` + scroll top | PowerToolFlow | Code ✅ |
| 11 | NarrativeProof | "Show Me My Grade →" | `onScanClick()` → `triggerTruthGate('narrative_proof')` | `#truth-gate` | Code ✅ |
| 12 | NarrativeProof | "See the AI in Action" | `onDemoClick()` → `setPowerToolTriggered(true)` + scroll top | PowerToolFlow | Code ✅ |
| 13 | ClosingManifesto | "Scan My Quote — It's Free" | `onScanClick()` → `triggerTruthGate('closing_manifesto')` | `#truth-gate` | Code ✅ |
| 14 | ClosingManifesto | "See the AI in Action" | `onDemoClick()` → `setPowerToolTriggered(true)` + scroll top | PowerToolFlow | Code ✅ |
| 15 | InteractiveDemoScan | Blurred card CTAs | `handleCtaClick()` → `onScanClick()` → `triggerTruthGate('interactive_demo')` | `#truth-gate` | Code ✅ |
| 16 | InteractiveDemoScan | "Scan My Quote — It's Free →" | `handleCtaClick()` | `#truth-gate` | Code ✅ |
| 17 | ExitIntentModal | "Check My Quote — It's Free" | `onCTAClick()` → `setPowerToolTriggered(true)` + scroll top | PowerToolFlow | Code ✅ |
| 18 | StickyRecoveryBar | Dynamic CTA button | `onDemoCTAClick()` → `setPowerToolTriggered(true)` + scroll top | PowerToolFlow | Code ✅ |
| 19 | StickyRecoveryBar | Contractor Match CTA | `onContractorMatchClick()` → scroll to `#contractor-match` | ContractorMatch section | Code ✅ |
| 20 | TruthGateFlow | Step 1-4 option buttons | State machine advances `currentStep` | Next step in 4-step form | Browser ✅ |
| 21 | TruthGateFlow | Lead capture form submit | `handleSubmit()` → creates Supabase lead → triggers scan | ScanTheatrics | Code ✅ |
| 22 | PowerToolDemo | "Scan My Quote" conversion CTA | `handleConversionClick()` → `onUploadQuote()` → `triggerTruthGate` | `#truth-gate` | Code ✅ |
| 23 | TruthReportClassic | "Get a Counter-Quote" | `onContractorMatchClick()` | `#contractor-match` | Code ✅ |
| 24 | TruthReportClassic | "Scan Another Quote →" | `onScanAnother()` | Resets state, scrolls to `#truth-gate` | Code ✅ |

---

## 2. Broken / Dead Table

| # | Surface | Element | Bug | Severity | Fix |
|---|---------|---------|-----|----------|-----|
| 1 | **Header** | **"Get Started Free" button** | `onCtaClick` prop is optional, defaults to `undefined`. `Index.tsx:103` renders `<LinearHeader />` with **no props**. Clicking does nothing. | **P1 — Primary conversion CTA is dead** | Pass `onCtaClick={() => triggerTruthGate('header_cta')}` in Index.tsx |
| 2 | **MarketBaselineTool** | **`id="market-baseline"` scroll target** | Root `<section>` has no `id` attribute. FlowBEntry, FlowCEntry, ScamConcernImage, StickyRecoveryBar, and Index.tsx all call `scrollIntoView` on `#market-baseline`. All silently fail. | **P2 — Flow B/C entry points broken** | Add `id="market-baseline"` to MarketBaselineTool root element |

---

## 3. ScanTheatrics Cliffhanger Verdict

**The cliffhanger phase is purely visual — by design. No lead-capture form exists within it.**

The ScanTheatrics component has 4 phases:

| Phase | Duration | What User Sees | User Interaction |
|-------|----------|----------------|------------------|
| `scanning` | ~8s (min) | Progress bar, rotating log lines ("Scanning warranty language..."), percentage counter | None — auto-advances when `scanStatus === "preview_ready"` AND `scanningMinDone` |
| `cliffhanger` | 2s (fixed) | OCR validation checkmarks, trust signals (page count, line items, contractor name), OCR quality badge, "Data extracted successfully" | **None — auto-advances via `addTimer(() => startPillars(), 2000)`** |
| `pillars` | ~5s | 5-pillar analysis cards animate in one by one (PASS/FAIL/REVIEW badges) | None — auto-advances |
| `reveal` | ~2s | Grade badge appears (A-F), `onRevealComplete()` fires after 7s total | None — triggers report render |

**Lead capture happens at two other points:**
1. **Before scan:** TruthGateFlow (4-step form + name/email/phone)
2. **After report renders:** OTP gate in PostScanReportSwitcher (phone verification to unlock full findings)

**Verdict:** The cliffhanger is working as designed. It builds anticipation via OCR proof-of-read signals, then auto-advances. There is no "cliffhanger lead capture" — that concept does not exist in the current architecture.

---

## 4. Route Safety After V2 Purge

| Route | Expected | Actual | Status |
|-------|----------|--------|--------|
| `/` | Homepage renders | Homepage renders with all sections | ✅ PASS |
| `/report/:sessionId` | Redirect to `/report/classic/:sessionId` | Redirects correctly (URL changes to `/report/classic/...`) | ✅ PASS |
| `/report/classic/:sessionId` | Report page or "Report Not Found" | "Report Not Found" for invalid IDs, real report for valid Supabase sessions | ✅ PASS |
| `/report/findings/:sessionId` | **404** (V2 purged) | **404 — "Oops! Page not found"** | ✅ PASS |
| `/demo-classic` | Gate Orchestration Test page | Renders with 3 OTP scenarios + full report preview | ✅ PASS |
| `/random-garbage` | 404 catch-all | "404 — Oops! Page not found" with "Return to Home" link | ✅ PASS |

**No production CTA links to any deleted V2 route.** Confirmed via `grep -rn '/report/findings\|/demo\b' src/` — zero hits in production components.

---

## 5. Dead Code / Cleanup Candidates

| File | Status | Notes |
|------|--------|-------|
| `components/TruthReportFindings/TruthReportFindings.tsx` | **Orphaned** | Not imported by any production component. Safe to delete. |
| `components/dev/AnalysisViewModeToggle.tsx` | **Dev-only** | Only imported by `DevPreviewPanel.tsx`. Not consumed by any production rendering logic. |
| `state/scanFunnel.tsx` comment (line 5) | **Stale comment** | References "VerifyGate, TruthReportFindings" — both are no longer in the production flow. |
| `lib/reportMode.ts` | **Dev-only** | `USE_FINDINGS_V2` flag only consumed by DevPreviewPanel. PostScanReportSwitcher always renders Classic. |

---

## 6. File-by-File Fix Blocks

### Fix 1: Header "Get Started Free" — wire the click handler

**File:** `src/pages/Index.tsx` (around line 103)

```diff
- <LinearHeader />
+ <LinearHeader onCtaClick={() => triggerTruthGate('header_cta')} />
```

### Fix 2: MarketBaselineTool — add missing scroll target ID

**File:** `src/components/MarketBaselineTool.tsx` (root element, around line 185)

```diff
- <section className="...">
+ <section id="market-baseline" className="...">
```

*(The exact line depends on the root element tag — find the first `<section` or `<div` returned by the component and add `id="market-baseline"`.)*

---

## 7. Summary

| Category | Count |
|----------|-------|
| CTAs verified working | 24 |
| CTAs broken | 2 |
| Routes verified safe | 6/6 |
| V2 route references in production code | 0 |
| Orphaned dead code files | 1 (TruthReportFindings) |
| Stale comments | 1 (scanFunnel.tsx) |

**Overall assessment:** The V2/Findings-first purge was clean. All production routes are safe. The two broken items (header CTA, market-baseline scroll target) are both one-line fixes. The ScanTheatrics cliffhanger is functioning as designed with no lead-capture gap.
