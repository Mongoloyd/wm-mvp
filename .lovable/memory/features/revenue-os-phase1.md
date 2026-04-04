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
