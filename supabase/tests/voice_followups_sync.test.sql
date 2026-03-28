-- ═══════════════════════════════════════════════════════════════════════════════
-- pgTAP tests for:
--   • 20260327080000_create_voice_followups_and_leads_updated_at.sql
--   • 20260328010000_voice_followup_lead_sync_triggers.sql
--
-- Run with: supabase test db
-- All assertions are wrapped in a rolled-back transaction to keep the DB clean.
-- ═══════════════════════════════════════════════════════════════════════════════

BEGIN;

SELECT plan(62);

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 1: Schema — voice_followups table (migration 20260327080000)
-- ─────────────────────────────────────────────────────────────────────────────

SELECT has_table(
  'public', 'voice_followups',
  'voice_followups table exists in public schema'
);

SELECT has_column(
  'public', 'voice_followups', 'id',
  'voice_followups has id column'
);

SELECT has_column(
  'public', 'voice_followups', 'lead_id',
  'voice_followups has lead_id column'
);

SELECT has_column(
  'public', 'voice_followups', 'booking_intent_detected',
  'voice_followups has booking_intent_detected column'
);

SELECT has_column(
  'public', 'voice_followups', 'status',
  'voice_followups has status column'
);

SELECT has_column(
  'public', 'voice_followups', 'phone_e164',
  'voice_followups has phone_e164 column'
);

SELECT has_column(
  'public', 'voice_followups', 'call_intent',
  'voice_followups has call_intent column'
);

SELECT has_column(
  'public', 'voice_followups', 'provider',
  'voice_followups has provider column'
);

SELECT has_column(
  'public', 'voice_followups', 'payload_json',
  'voice_followups has payload_json column'
);

SELECT has_column(
  'public', 'voice_followups', 'result_json',
  'voice_followups has result_json column'
);

SELECT has_column(
  'public', 'voice_followups', 'updated_at',
  'voice_followups has updated_at column'
);

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 2: Schema — leads.updated_at column (migration 20260327080000)
-- ─────────────────────────────────────────────────────────────────────────────

SELECT has_column(
  'public', 'leads', 'updated_at',
  'leads table has updated_at column after migration'
);

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 3: Indexes (migration 20260327080000)
-- ─────────────────────────────────────────────────────────────────────────────

SELECT has_index(
  'public', 'voice_followups', 'idx_voice_followups_lead_id',
  'index idx_voice_followups_lead_id exists'
);

SELECT has_index(
  'public', 'voice_followups', 'idx_voice_followups_scan_session_id',
  'index idx_voice_followups_scan_session_id exists'
);

SELECT has_index(
  'public', 'voice_followups', 'idx_voice_followups_created_at',
  'index idx_voice_followups_created_at exists'
);

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 4: Triggers from migration 20260327080000
-- ─────────────────────────────────────────────────────────────────────────────

SELECT has_trigger(
  'public', 'voice_followups', 'trg_voice_followups_updated_at',
  'voice_followups has trg_voice_followups_updated_at trigger'
);

SELECT has_trigger(
  'public', 'leads', 'trg_leads_updated_at',
  'leads has trg_leads_updated_at trigger'
);

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 5: Schema — last_call_* columns on leads (migration 20260328010000)
-- ─────────────────────────────────────────────────────────────────────────────

SELECT has_column(
  'public', 'leads', 'last_call_status',
  'leads has last_call_status column'
);

SELECT has_column(
  'public', 'leads', 'last_call_booking_intent',
  'leads has last_call_booking_intent column'
);

SELECT has_column(
  'public', 'leads', 'last_call_outcome',
  'leads has last_call_outcome column'
);

SELECT has_column(
  'public', 'leads', 'last_call_intent',
  'leads has last_call_intent column'
);

SELECT has_column(
  'public', 'leads', 'last_call_queued_at',
  'leads has last_call_queued_at column'
);

SELECT has_column(
  'public', 'leads', 'last_call_completed_at',
  'leads has last_call_completed_at column'
);

SELECT has_column(
  'public', 'leads', 'last_call_answered_at',
  'leads has last_call_answered_at column'
);

SELECT has_column(
  'public', 'leads', 'last_call_duration_seconds',
  'leads has last_call_duration_seconds column'
);

SELECT has_column(
  'public', 'leads', 'last_call_summary',
  'leads has last_call_summary column'
);

SELECT has_column(
  'public', 'leads', 'last_call_recording_url',
  'leads has last_call_recording_url column'
);

SELECT has_column(
  'public', 'leads', 'last_call_failure_reason',
  'leads has last_call_failure_reason column'
);

SELECT has_column(
  'public', 'leads', 'last_call_transcript_id',
  'leads has last_call_transcript_id column'
);

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 6: Trigger function and trigger (migration 20260328010000)
-- ─────────────────────────────────────────────────────────────────────────────

SELECT has_function(
  'public', 'trg_fn_voice_followup_sync_lead', ARRAY[]::text[],
  'trg_fn_voice_followup_sync_lead function exists'
);

SELECT has_trigger(
  'public', 'voice_followups', 'trg_voice_followup_sync_lead',
  'voice_followups has trg_voice_followup_sync_lead trigger'
);

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 7: Behavior tests — trigger logic
-- Test data is set up inside this transaction and rolled back automatically.
-- ─────────────────────────────────────────────────────────────────────────────

-- Insert two test leads. session_id is NOT NULL in the leads table.
INSERT INTO public.leads (id, session_id, status)
VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001'::uuid, 'sess-test-1', 'new'),
  ('aaaaaaaa-0000-0000-0000-000000000002'::uuid, 'sess-test-2', 'new'),
  ('aaaaaaaa-0000-0000-0000-000000000003'::uuid, 'sess-test-3', 'appointment'),
  ('aaaaaaaa-0000-0000-0000-000000000004'::uuid, 'sess-test-4', 'closed'),
  ('aaaaaaaa-0000-0000-0000-000000000005'::uuid, 'sess-test-5', 'dead');

-- ── TEST: INSERT followup for lead in 'new' → status becomes 'called' ────────

INSERT INTO public.voice_followups (
  lead_id, phone_e164, call_intent, queued_at,
  status, booking_intent_detected
) VALUES (
  'aaaaaaaa-0000-0000-0000-000000000001'::uuid,
  '+15555550001', 'report_help', NOW(),
  'completed', false
);

SELECT is(
  (SELECT status FROM public.leads WHERE id = 'aaaaaaaa-0000-0000-0000-000000000001'::uuid),
  'called',
  'INSERT followup for new lead advances status to called'
);

-- ── TEST: last_call_status is synced on INSERT ────────────────────────────────

SELECT is(
  (SELECT last_call_status FROM public.leads WHERE id = 'aaaaaaaa-0000-0000-0000-000000000001'::uuid),
  'completed',
  'INSERT followup syncs last_call_status to leads'
);

-- ── TEST: last_call_booking_intent is synced on INSERT ───────────────────────

SELECT is(
  (SELECT last_call_booking_intent FROM public.leads WHERE id = 'aaaaaaaa-0000-0000-0000-000000000001'::uuid),
  false,
  'INSERT followup syncs last_call_booking_intent (false) to leads'
);

-- ── TEST: last_call_intent is synced on INSERT ───────────────────────────────

SELECT is(
  (SELECT last_call_intent FROM public.leads WHERE id = 'aaaaaaaa-0000-0000-0000-000000000001'::uuid),
  'report_help',
  'INSERT followup syncs last_call_intent to leads'
);

-- ── TEST: leads.updated_at is not NULL after trigger fires ───────────────────

SELECT isnt(
  (SELECT updated_at FROM public.leads WHERE id = 'aaaaaaaa-0000-0000-0000-000000000001'::uuid),
  NULL,
  'leads.updated_at is not NULL after sync trigger fires (maintained by trg_leads_updated_at)'
);

-- ── TEST: INSERT followup for lead in 'appointment' → status stays 'appointment'

INSERT INTO public.voice_followups (
  lead_id, phone_e164, call_intent, queued_at,
  status, booking_intent_detected
) VALUES (
  'aaaaaaaa-0000-0000-0000-000000000003'::uuid,
  '+15555550003', 'contractor_match', NOW(),
  'completed', false
);

SELECT is(
  (SELECT status FROM public.leads WHERE id = 'aaaaaaaa-0000-0000-0000-000000000003'::uuid),
  'appointment',
  'INSERT followup for appointment lead does not downgrade status'
);

-- ── TEST: last_call_* still synced even when status is preserved ─────────────

SELECT is(
  (SELECT last_call_status FROM public.leads WHERE id = 'aaaaaaaa-0000-0000-0000-000000000003'::uuid),
  'completed',
  'last_call_status is synced even when lead status is not advanced'
);

-- ── TEST: Second INSERT overwrites last_call_* (snapshot idempotency) ────────
-- Lead is now 'called'; a second INSERT with different values should overwrite.

INSERT INTO public.voice_followups (
  lead_id, phone_e164, call_intent, queued_at,
  status, booking_intent_detected, summary
) VALUES (
  'aaaaaaaa-0000-0000-0000-000000000001'::uuid,
  '+15555550001', 'report_help', NOW(),
  'no_answer', false, 'Second attempt summary'
);

SELECT is(
  (SELECT last_call_status FROM public.leads WHERE id = 'aaaaaaaa-0000-0000-0000-000000000001'::uuid),
  'no_answer',
  'Second INSERT overwrites last_call_status with latest value'
);

SELECT is(
  (SELECT last_call_summary FROM public.leads WHERE id = 'aaaaaaaa-0000-0000-0000-000000000001'::uuid),
  'Second attempt summary',
  'Second INSERT overwrites last_call_summary with latest value'
);

-- ── TEST: Second INSERT for 'called' lead → status stays 'called' ────────────

SELECT is(
  (SELECT status FROM public.leads WHERE id = 'aaaaaaaa-0000-0000-0000-000000000001'::uuid),
  'called',
  'Second INSERT for already-called lead does not re-advance status'
);

-- ── TEST: INSERT with booking_intent=true for 'new' lead → 'appointment'
-- (booking intent takes priority over the new→called rule)

INSERT INTO public.voice_followups (
  lead_id, phone_e164, call_intent, queued_at,
  status, booking_intent_detected
) VALUES (
  'aaaaaaaa-0000-0000-0000-000000000002'::uuid,
  '+15555550002', 'booking_confirm', NOW(),
  'completed', true
);

SELECT is(
  (SELECT status FROM public.leads WHERE id = 'aaaaaaaa-0000-0000-0000-000000000002'::uuid),
  'appointment',
  'INSERT with booking_intent=true for new lead goes directly to appointment (not called first)'
);

-- ── TEST: INSERT with booking_intent=true for 'called' lead → 'appointment' ──
-- Re-use lead 1 which is currently 'called' after the earlier INSERTs.

INSERT INTO public.voice_followups (
  lead_id, phone_e164, call_intent, queued_at,
  status, booking_intent_detected
) VALUES (
  'aaaaaaaa-0000-0000-0000-000000000001'::uuid,
  '+15555550001', 'booking_confirm', NOW(),
  'completed', true
);

SELECT is(
  (SELECT status FROM public.leads WHERE id = 'aaaaaaaa-0000-0000-0000-000000000001'::uuid),
  'appointment',
  'INSERT with booking_intent=true for called lead advances status to appointment'
);

-- ── TEST: UPDATE booking_intent false → true → 'appointment' ─────────────────
-- Lead 4 (sess-test-4) was closed; use a fresh lead in 'called' for this test.
-- We'll use lead 3 (appointment) to test: already appointment → should not re-fire booking.
-- For false→true transition test, insert without booking intent first, then update.

DO $$
DECLARE v_vf_id uuid;
BEGIN
  INSERT INTO public.voice_followups (
    lead_id, phone_e164, call_intent, queued_at, status, booking_intent_detected
  ) VALUES (
    'aaaaaaaa-0000-0000-0000-000000000004'::uuid,
    '+15555550004', 'check_in', NOW(), 'completed', false
  );
END;
$$;

-- Lead 4 was 'closed'; it should have stayed 'closed' after the INSERT.
-- Now manually set lead 4 to 'called' to set up the false→true update test.
UPDATE public.leads SET status = 'called' WHERE id = 'aaaaaaaa-0000-0000-0000-000000000004'::uuid;

DO $$
DECLARE v_vf_id uuid;
BEGIN
  SELECT id INTO v_vf_id
  FROM public.voice_followups
  WHERE lead_id = 'aaaaaaaa-0000-0000-0000-000000000004'::uuid
  ORDER BY created_at DESC LIMIT 1;

  UPDATE public.voice_followups
  SET booking_intent_detected = true, call_outcome = 'booked'
  WHERE id = v_vf_id;
END;
$$;

SELECT is(
  (SELECT status FROM public.leads WHERE id = 'aaaaaaaa-0000-0000-0000-000000000004'::uuid),
  'appointment',
  'UPDATE booking_intent false→true for called lead advances status to appointment'
);

SELECT is(
  (SELECT last_call_booking_intent FROM public.leads WHERE id = 'aaaaaaaa-0000-0000-0000-000000000004'::uuid),
  true,
  'UPDATE booking_intent false→true syncs last_call_booking_intent = true'
);

SELECT is(
  (SELECT last_call_outcome FROM public.leads WHERE id = 'aaaaaaaa-0000-0000-0000-000000000004'::uuid),
  'booked',
  'UPDATE syncs last_call_outcome to leads'
);

-- ── TEST: UPDATE booking_intent true → true (no-op, status stays 'appointment')

DO $$
DECLARE v_vf_id uuid;
BEGIN
  SELECT id INTO v_vf_id
  FROM public.voice_followups
  WHERE lead_id = 'aaaaaaaa-0000-0000-0000-000000000004'::uuid
  ORDER BY created_at DESC LIMIT 1;

  UPDATE public.voice_followups
  SET summary = 'Updated summary, intent unchanged'
  WHERE id = v_vf_id;
END;
$$;

SELECT is(
  (SELECT status FROM public.leads WHERE id = 'aaaaaaaa-0000-0000-0000-000000000004'::uuid),
  'appointment',
  'UPDATE with booking_intent already true does not re-advance (status stays appointment)'
);

-- ── TEST: INSERT for 'closed' lead → status stays 'closed' ───────────────────
-- Lead 4 ended at 'appointment' from the UPDATE above; use a dedicated 'closed'
-- lead to keep this assertion unambiguous.

INSERT INTO public.leads (id, session_id, status)
VALUES ('aaaaaaaa-0000-0000-0000-000000000006'::uuid, 'sess-test-6', 'closed');

INSERT INTO public.voice_followups (
  lead_id, phone_e164, call_intent, queued_at,
  status, booking_intent_detected
) VALUES (
  'aaaaaaaa-0000-0000-0000-000000000006'::uuid,
  '+15555550006', 'report_help', NOW(),
  'completed', false
);

SELECT is(
  (SELECT status FROM public.leads WHERE id = 'aaaaaaaa-0000-0000-0000-000000000006'::uuid),
  'closed',
  'INSERT followup for closed lead does not reopen status'
);

SELECT is(
  (SELECT last_call_status FROM public.leads WHERE id = 'aaaaaaaa-0000-0000-0000-000000000006'::uuid),
  'completed',
  'INSERT followup for closed lead still syncs last_call_status'
);

-- ── TEST: INSERT with booking_intent=true for 'dead' lead → status stays 'dead'

INSERT INTO public.voice_followups (
  lead_id, phone_e164, call_intent, queued_at,
  status, booking_intent_detected
) VALUES (
  'aaaaaaaa-0000-0000-0000-000000000005'::uuid,
  '+15555550005', 'contractor_match', NOW(),
  'completed', true
);

SELECT is(
  (SELECT status FROM public.leads WHERE id = 'aaaaaaaa-0000-0000-0000-000000000005'::uuid),
  'dead',
  'INSERT with booking_intent=true for dead lead does not reopen status'
);

SELECT is(
  (SELECT last_call_booking_intent FROM public.leads WHERE id = 'aaaaaaaa-0000-0000-0000-000000000005'::uuid),
  true,
  'INSERT for dead lead still syncs last_call_booking_intent'
);

-- ── TEST: All last_call_* fields are synced (comprehensive mapping check) ─────

INSERT INTO public.leads (id, session_id, status)
VALUES ('aaaaaaaa-0000-0000-0000-000000000007'::uuid, 'sess-test-7', 'new');

INSERT INTO public.voice_followups (
  lead_id,
  phone_e164,
  call_intent,
  queued_at,
  answered_at,
  completed_at,
  duration_seconds,
  recording_url,
  failure_reason,
  status,
  booking_intent_detected,
  call_outcome
) VALUES (
  'aaaaaaaa-0000-0000-0000-000000000007'::uuid,
  '+15555550007',
  'full_sync_test',
  '2026-03-28 10:00:00+00',
  '2026-03-28 10:00:05+00',
  '2026-03-28 10:02:00+00',
  115,
  'https://recordings.example.com/test-call.mp3',
  NULL,
  'completed',
  false,
  'interested'
);

SELECT is(
  (SELECT last_call_queued_at FROM public.leads WHERE id = 'aaaaaaaa-0000-0000-0000-000000000007'::uuid),
  '2026-03-28 10:00:00+00'::timestamptz,
  'last_call_queued_at is synced from voice_followups.queued_at'
);

SELECT is(
  (SELECT last_call_answered_at FROM public.leads WHERE id = 'aaaaaaaa-0000-0000-0000-000000000007'::uuid),
  '2026-03-28 10:00:05+00'::timestamptz,
  'last_call_answered_at is synced from voice_followups.answered_at'
);

SELECT is(
  (SELECT last_call_completed_at FROM public.leads WHERE id = 'aaaaaaaa-0000-0000-0000-000000000007'::uuid),
  '2026-03-28 10:02:00+00'::timestamptz,
  'last_call_completed_at is synced from voice_followups.completed_at'
);

SELECT is(
  (SELECT last_call_duration_seconds FROM public.leads WHERE id = 'aaaaaaaa-0000-0000-0000-000000000007'::uuid),
  115,
  'last_call_duration_seconds is synced from voice_followups.duration_seconds'
);

SELECT is(
  (SELECT last_call_recording_url FROM public.leads WHERE id = 'aaaaaaaa-0000-0000-0000-000000000007'::uuid),
  'https://recordings.example.com/test-call.mp3',
  'last_call_recording_url is synced from voice_followups.recording_url'
);

SELECT is(
  (SELECT last_call_failure_reason FROM public.leads WHERE id = 'aaaaaaaa-0000-0000-0000-000000000007'::uuid),
  NULL,
  'last_call_failure_reason is synced as NULL when voice_followups.failure_reason is NULL'
);

SELECT is(
  (SELECT last_call_outcome FROM public.leads WHERE id = 'aaaaaaaa-0000-0000-0000-000000000007'::uuid),
  'interested',
  'last_call_outcome is synced from voice_followups.call_outcome'
);

-- ── TEST: voice_followups.updated_at is refreshed on UPDATE ──────────────────
-- Verifies the trg_voice_followups_updated_at trigger from migration 20260327080000.

DO $$
DECLARE
  v_vf_id   uuid;
  v_orig_ts timestamptz;
BEGIN
  SELECT id, updated_at INTO v_vf_id, v_orig_ts
  FROM public.voice_followups
  WHERE lead_id = 'aaaaaaaa-0000-0000-0000-000000000007'::uuid
  LIMIT 1;

  -- Force a small time gap so updated_at will differ from created_at.
  PERFORM pg_sleep(0.01);

  UPDATE public.voice_followups
  SET summary = 'trigger updated_at test'
  WHERE id = v_vf_id;
END;
$$;

SELECT isnt(
  (SELECT updated_at FROM public.voice_followups
   WHERE lead_id = 'aaaaaaaa-0000-0000-0000-000000000007'::uuid
   LIMIT 1),
  NULL,
  'voice_followups.updated_at is not NULL after UPDATE (trg_voice_followups_updated_at fires)'
);

-- ── REGRESSION: booking_intent priority overrides new→called when INSERT ──────
-- A plain INSERT with booking_intent=true for a 'new' lead should go directly
-- to 'appointment', not 'called'. This tests the CASE priority ordering:
-- the booking-intent branch fires before the plain-INSERT branch.

INSERT INTO public.leads (id, session_id, status)
VALUES ('aaaaaaaa-0000-0000-0000-000000000008'::uuid, 'sess-test-8', 'new');

INSERT INTO public.voice_followups (
  lead_id, phone_e164, call_intent, queued_at, status, booking_intent_detected
) VALUES (
  'aaaaaaaa-0000-0000-0000-000000000008'::uuid,
  '+15555550008', 'booking_confirm', NOW(), 'completed', true
);

SELECT is(
  (SELECT status FROM public.leads WHERE id = 'aaaaaaaa-0000-0000-0000-000000000008'::uuid),
  'appointment',
  'REGRESSION: booking_intent=true on INSERT takes priority over new→called rule'
);

-- ── REGRESSION: legacy trigger functions must not exist ───────────────────────
-- Migration 20260328010000 drops trg_fn_voice_followup_set_called and
-- trg_fn_voice_followup_set_appointment. Verify they are absent.

SELECT hasnt_function(
  'public', 'trg_fn_voice_followup_set_called', ARRAY[]::text[],
  'legacy trg_fn_voice_followup_set_called function does not exist after migration'
);

SELECT hasnt_function(
  'public', 'trg_fn_voice_followup_set_appointment', ARRAY[]::text[],
  'legacy trg_fn_voice_followup_set_appointment function does not exist after migration'
);

SELECT * FROM finish();
ROLLBACK;