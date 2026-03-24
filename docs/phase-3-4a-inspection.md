# Phase 3.4A Inspection Report — Immediate Match + Call Momentum Layer

## Actual Tables Found
- `contractors` — active, vetted contractors with service_counties, project_types, window count range
- `contractor_opportunities` — canonical opportunity per scan_session_id (UNIQUE), now extended with suggested match + call workflow columns
- `contractor_opportunity_routes` — routing ledger with interest/release lifecycle
- `billable_intros` — revenue ledger with billing status lifecycle
- `contractor_outcomes` — post-release outcome tracking
- `event_logs` — fire-and-forget event log (anon INSERT only)
- `leads` — lead data with county, window_count, project_type, phone_e164
- `scan_sessions` — scan session lifecycle
- `analyses` — scoring data with contractor_brief caching
- `phone_verifications` — SMS OTP verification records

## Actual Identity / Access Tables
- `leads` — session-scoped (no auth.users FK)
- `phone_verifications` — lead_id FK, status='verified'
- No `profiles` table exists — system uses anonymous leads + phone verification

## Edge Functions Found
- `generate-contractor-brief` — builds anonymized brief, computes priority score, upserts opportunity
- `contractor-actions` — 5 actions: mark_interest, review_release, release_contact, update_billing_status, update_outcome
- `send-otp` — Twilio Verify OTP send
- `verify-otp` — Twilio Verify OTP check
- `scan-quote` — quote OCR + scoring pipeline
- `capi-event` — Facebook CAPI event forwarding

## Key File Paths
- `src/components/ContractorMatch.tsx` — homeowner CTA surface (current single-CTA)
- `src/components/TruthReportClassic.tsx` — full report renderer with CTA section at bottom
- `src/pages/ReportClassic.tsx` — smart container for report page
- `src/components/AdminDashboard.tsx` — 4-tab operator command center
- `src/lib/statusConstants.ts` — centralized status/event name constants
- `src/lib/trackEvent.ts` — fire-and-forget event_logs writer

## Schema Drift from Prompt Assumptions
- **No drift** — all tables and columns match expectations
- `contractor_opportunities.scan_session_id` has UNIQUE constraint (confirmed)
- `analyses` has `contractor_brief`, `contractor_brief_json`, `contractor_brief_generated_at` (confirmed)
- Phase 3.4A columns added via migration: suggested_contractor_id, suggested_match_*, last_call_*, cta_source

## Adaptation Strategy
- Extended `generate-contractor-brief` with suggested match logic (sub-step after brief build)
- Created new `voice-followup` edge function for phonecall.bot webhook
- Rebuilt `ContractorMatch.tsx` with dual CTA architecture
- Created `src/shared/matchReasons.ts` as shared taxonomy
- Created `/how-we-beat-window-quotes` manifesto page
- Updated AdminDashboard with suggested match visibility
- Extended status constants with new events

## Foreign Key Relationships Used
- `contractor_opportunities.suggested_contractor_id → contractors.id (ON DELETE SET NULL)`
- `contractor_opportunities.lead_id → leads.id`
- `contractor_opportunities.scan_session_id → scan_sessions.id`
- `contractor_opportunities.analysis_id → analyses.id`
