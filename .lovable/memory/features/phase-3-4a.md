Phase 3.4A — Immediate Match + Call Momentum Layer. COMPLETE.

## What was built
- DB migration: 14 new columns on contractor_opportunities (suggested_match_*, last_call_*, cta_source)
- `generate-contractor-brief` now runs deterministic weighted match logic, persists top candidate + top 3
- New edge function: `voice-followup` — CTA-aware phonecall.bot webhook with full context payload
- `ContractorMatch.tsx` rebuilt with dual CTAs: "I'd Like an Introduction" + "Call WindowMan About My Report"
- Immediate match card renders synchronously with confidence badge, fit reasons, process strip
- `/how-we-beat-window-quotes` manifesto/trust/SEO page created
- `src/shared/matchReasons.ts` — shared taxonomy for match reason keys
- AdminDashboard: suggested match panel with contractor name, confidence, reasons, call intent, webhook status
- `statusConstants.ts` extended with 15 new Phase 3.4A event names
- `docs/phase-3-4a-inspection.md` — reality check inspection doc

## Key decisions
- Match logic is deterministic weighted scoring (county 30pts, vetted 20pts, project type 20pts, window fit 15pts)
- Only vetted contractors are suggested
- Contractor identity anonymized on homeowner side (WM-XXXXXX alias)
- PHONECALL_BOT_WEBHOOK_URL secret is optional — gracefully skips if not set
- Match confidence: high (≥70), medium (≥40), low (<40)
- Top 3 candidates persisted for auditability
