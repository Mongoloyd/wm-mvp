# Revenue OS Phase 1 — Lead Snapshot Sync & Attribution Wiring

## Completed 2026-04-04

### Lead Snapshot Sync (scan-quote Edge Function)
- `upsertAnalysisRecord` now returns `analysisId` via `.select("id")`
- After successful analysis, scan-quote writes to `leads`:
  - `latest_analysis_id`, `latest_scan_session_id`, `grade`
  - `flag_count`, `critical_flag_count`, `red_flag_count`, `amber_flag_count`
  - `funnel_stage: 'scanned'`
- Inserts `scan_completed` event into `lead_events` (event_source: `edge_function`)
- Both writes are non-fatal (try/catch wrapped, won't block scan response)

### QA Test Report
- Invoked scan-quote via dev bypass on session `4481964c-371a-4044-aa43-fa9fa2bb78cb`
- Confirmed `[LEAD_SNAPSHOT_SYNC]` log entry in edge function logs
- Verified `leads` table updated: `latest_analysis_id=b29b0b91-...`, `grade=A`, `funnel_stage=scanned`
- Verified `lead_events` row: `event_name=scan_completed`, `event_source=edge_function`
- Fixed check constraint issue: `wm_scan_completed` → `scan_completed`, `backend` → `edge_function`

### Attribution Wiring (TruthGateFlow.tsx)
- Imported `getUtmData` from `useUtmCapture`
- Lead insert now includes: `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`, `fbclid`, `gclid`, `fbc`, `landing_page_url`, `first_page_path`, `initial_referrer`
- Attribution captured at moment of lead creation from localStorage (persisted by useUtmCapture)

### Check Constraints Discovered
- `lead_events.event_name` restricted to: lead_created, lead_captured, scan_started, scan_completed, otp_*, report_unlocked, intro_requested, voice_followup_*, booking_intent_detected, appointment_booked, contractor_intro_routed, billable_intro_created, deal_outcome_updated
- `lead_events.event_source` restricted to: web, edge_function, admin, phonecall_bot, system

### E2E UTM Test (2026-04-04)
- Loaded app with `?utm_source=test_source&utm_medium=cpc&utm_campaign=spring_sale`
- Submitted TruthGateFlow form as "UTMTest / utmtest@windowman.test"
- Verified leads row `e3103329-...`: `utm_source=test_source`, `utm_medium=cpc`, `utm_campaign=spring_sale`
- `landing_page_url=/`, `first_page_path=/` — all attribution fields persisted correctly

### Voice-Followup Auth Fix (request-callback)
- Created `supabase/functions/request-callback/index.ts` — public-facing callback bridge
- Security: looks up lead via scan_session_id, asserts `phone_verified === true`
- Uses SUPABASE_SERVICE_ROLE_KEY to bypass RLS for voice_followups insert
- Inserts voice_followups row, fires phonecall.bot webhook, logs lead_event
- Updated `ReportClassic.tsx` to invoke `request-callback` instead of `voice-followup`
- No admin auth required — safe for public report page usage

