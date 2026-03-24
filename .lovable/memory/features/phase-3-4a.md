Phase 3.4A — Immediate Match + Call Momentum Layer. COMPLETE. Architecture simplified.

## What was built
- DB migration: 14 new columns on contractor_opportunities (suggested_match_*, last_call_*, cta_source)
- `generate-contractor-brief` now runs deterministic weighted match logic, persists top candidate + top 3
- Edge function: `voice-followup` — CTA-aware phonecall.bot webhook with full context payload
- Dual CTAs now NATIVE inside TruthReportClassic.tsx CTA section (no separate component)
- Match card renders inline in TruthReportClassic after intro request succeeds
- `/how-we-beat-window-quotes` manifesto/trust/SEO page
- `src/shared/matchReasons.ts` — shared taxonomy for match reason keys
- AdminDashboard: suggested match panel
- `statusConstants.ts` extended with Phase 3.4A event names

## Architecture (simplified March 2026)
- **DELETED**: ContractorMatch.tsx — replaced by native CTA section in TruthReportClassic
- TruthReportClassic is pure UI — receives `onContractorMatchClick`, `onReportHelpCall`, `introRequested`, `reportCallRequested`, `isCtaLoading`, `suggestedMatch` as props
- ReportClassic.tsx (smart container) handles all edge function calls and state
- SuggestedMatch type exported from TruthReportClassic.tsx
- Auto-scroll to #cta-section on bad grades (B/C/D/F) when isFullLoaded
- CTAs only visible when accessLevel === "full" (phone verified)

## Key decisions
- Match logic is deterministic weighted scoring (county 30pts, vetted 20pts, project type 20pts, window fit 15pts)
- Only vetted contractors are suggested
- Contractor identity anonymized on homeowner side (WM-XXXXXX alias)
- PHONECALL_BOT_WEBHOOK_URL secret is optional — gracefully skips if not set
- Match confidence: high (≥70), medium (≥40), low (<40)
- Top 3 candidates persisted for auditability
