# WM-MVP Browser Click Test Results — 2026-03-22

## Test Environment
- Dev server: Vite on port 8081 (exposed via proxy)
- Browser: Chromium (automated)
- URL: https://8081-ixzvr8elgrvw5kp1ll5yv-58561da4.us2.manus.computer/

---

## Test 1: Homepage Load ✅ PASS
Homepage renders fully after installing missing `uuid` dependency. Hero section, sample report card, all CTAs, live demo, TruthGateFlow form, social proof stories, "How WindowMan Works" section, and footer all render correctly.

## Test 2: "Scan My Quote — It's Free" CTA ✅ PASS
Clicking the primary CTA scrolls to TruthGateFlow section showing "STEP 1 OF 4 · CONFIGURE YOUR SCAN".

## Test 3: TruthGateFlow 4-Question Form ✅ PASS
All 4 steps work. Step 1 (window count) → Step 2 (project type) → Step 3 → Step 4 (budget range). Lead capture form appears after completion with name, email, phone fields and "Show Me My Grade →" CTA.

## Test 4: DevQuoteGenerator — Rubric Engine ✅ PASS
"Grade C → C" scenario: Expected C, Actual C. Flags: 5, Pillars: war:pass fin:warn saf:fail ins:warn pri:pass, Rubric v1.1.0.

## Test 5: DevPreviewPanel — Report Previews

| State | Grade Shown | Pillars | Findings | OTP Gate | Status |
|-------|-------------|---------|----------|----------|--------|
| Grade D (Preview) | D — SIGNIFICANT PROBLEMS | Safety FAIL, Install FAIL, Price FAIL, Fine Print REVIEW, Warranty REVIEW | 6 issues (4 crit, 2 caution, 1 confirmed) | ✅ Visible | ✅ PASS |
| Grade C (Preview) | C — REVIEW BEFORE SIGNING | Safety FAIL, Install REVIEW, Price PASS, Fine Print FAIL, Warranty REVIEW | 5 issues (2 crit, 3 caution, 1 confirmed) | ✅ Visible | ✅ PASS |
| Grade F (Full) | F — CRITICAL ISSUES | ALL 5 FAIL | 7 issues (6 crit, 1 caution, 0 confirmed) | ✅ Visible | ✅ PASS |
| Grade A (Full) | — | — | — | — | ⚠️ BLOCKED (automation index offset) |

All tested reports render correctly with proper grade badges, 5-pillar analysis, forensic findings (blurred in preview), OTP verification gate, and contractor match CTA.

## Test 6: Route Testing

| Route | Expected | Actual | Status |
|-------|----------|--------|--------|
| `/` | Homepage | Homepage renders | ✅ PASS |
| `/report/test-session-123` | Redirect to `/report/classic/test-session-123` | Redirected correctly, shows "Report Not Found" with "Back to Home" link | ✅ PASS |
| `/report/classic/test-session-123` | Report page (or not found) | "Report Not Found — We couldn't find a report for this session." with "Back to Home" link | ✅ PASS |
| `/nonexistent-page` | 404 page | "404 — Oops! Page not found" with "Return to Home" link | ✅ PASS |
| `/demo-classic` | Demo Classic page | Gate Orchestration Test page with 3 scenarios (No phone, Known phone, OTP already sent). Shows Grade C report with OTP gate in preview mode. | ✅ PASS |

## Test 7: Demo Classic Page ✅ PASS
The `/demo-classic` route renders a Gate Orchestration Test page with scenario buttons for testing the OTP verification flow. It shows a Grade C report in preview mode with "Broward County" (real county, not placeholder). The page has three scenario buttons: "No phone", "Known phone", and "OTP already sent". Mode/Phone/Access state is displayed in the header bar.

---

## Bug/Issue Log

| # | Issue | Severity | Status |
|---|-------|----------|--------|
| 1 | `uuid` package missing | Blocking | ✅ Fixed |
| 2 | County shows "your county County" in dev previews | Cosmetic | Expected (dev fixtures use placeholder) |
| 3 | Browser automation index offset in DevPreviewPanel | Testing only | Not a code bug |

## Architecture Observations

The app uses a single-page architecture where reports render inline on the Index page via a `shouldShowReport` flag. The DevQuoteGenerator tests the rubric engine in isolation (single runs skip ScanTheatrics). The DevPreviewPanel uses fixture data from `fixtures.ts` to render reports without Supabase calls. The state flow is: `devState` → `devConfig` → `showReportFromDev` → `shouldShowReport` → `PostScanReportSwitcher`.

Routes are: `/` (homepage), `/report/classic/:sessionId` (report page), `/report/:sessionId` (legacy redirect), `/demo-classic` (gate orchestration test), and `*` (404 catch-all).

## Final Summary

| Test Area | Status |
|-----------|--------|
| Homepage Load | ✅ PASS |
| CTA → TruthGateFlow | ✅ PASS |
| TruthGateFlow 4-Step Form | ✅ PASS |
| DevQuoteGenerator Rubric | ✅ PASS |
| Grade D Preview Report | ✅ PASS |
| Grade C Preview Report | ✅ PASS |
| Grade F Full Report | ✅ PASS |
| Grade A Full Report | ⚠️ BLOCKED (automation) |
| Route: /report redirect | ✅ PASS |
| Route: 404 catch-all | ✅ PASS |
| Route: /demo-classic | ✅ PASS |
| ScanTheatrics | ⚠️ N/A (not testable via dev tools) |
