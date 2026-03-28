-- ═══════════════════════════════════════════════════════════════════════════════
-- MIGRATION: voice_followups → leads sync triggers
-- Date: 2026-03-28
-- Purpose: Keep public.leads in sync with public.voice_followups via two triggers.
--
--   Trigger A  trg_voice_followup_set_called
--     • AFTER INSERT on public.voice_followups
--     • Always writes last_call_* snapshot fields onto the matched lead.
--     • Advances leads.status to 'called' ONLY when current status = 'new'.
--     • Stronger states (called, appointment, closed, dead) are never touched.
--
--   Trigger B  trg_voice_followup_set_appointment
--     • AFTER INSERT OR UPDATE on public.voice_followups
--     • Only acts when NEW.booking_intent_detected IS TRUE.
--     • On UPDATE, only acts when booking_intent_detected changed false → true.
--     • Writes last_call_* snapshot fields onto the matched lead.
--     • Advances leads.status to 'appointment' ONLY when current status
--       is 'new' or 'called' (terminal states closed/dead are never reopened).
--
-- STATUS TRANSITION RULES (derived from AdminDashboard.tsx:53,305)
--   Canonical status order: new < called < appointment < {closed, dead}
--   Source: src/components/AdminDashboard.tsx — dropdown ['new','called','appointment','closed','dead']
--
--   'called'      valid only from  'new'
--     (strictest safe rule — do not overwrite called/appointment/closed/dead)
--   'appointment' valid only from  'new' OR 'called'
--     (do not reopen closed or dead; do not re-apply when already appointment)
--
-- FIELD MAPPING  voice_followups → leads.last_call_*
--   voice_followups.status              → leads.last_call_status
--   voice_followups.booking_intent_detected → leads.last_call_booking_intent
--   voice_followups.call_outcome        → leads.last_call_outcome
--   voice_followups.call_intent         → leads.last_call_intent
--   voice_followups.queued_at           → leads.last_call_queued_at
--   voice_followups.completed_at        → leads.last_call_completed_at
--   voice_followups.answered_at         → leads.last_call_answered_at
--   voice_followups.duration_seconds    → leads.last_call_duration_seconds
--   voice_followups.summary             → leads.last_call_summary
--   voice_followups.recording_url       → leads.last_call_recording_url
--   voice_followups.failure_reason      → leads.last_call_failure_reason
--
--   NOT MAPPED: last_call_transcript_id
--     voice_followups has transcript_text (text) and transcript_url (text),
--     but no transcript_id column. Mapping is ambiguous — skipped for safety.
--
-- PREREQUISITES (handled in 20260327080000_create_voice_followups_and_leads_updated_at.sql)
--   • public.leads.updated_at column and its BEFORE UPDATE trigger.
--   • public.voice_followups table (with its updated_at trigger).
--
-- ASSUMPTIONS
--   • The last_call_* columns added below may already exist on the live DB
--     (reflected in types.ts). ADD COLUMN IF NOT EXISTS makes this idempotent.
--   • Trigger alphabetical ordering on shared INSERT events is intentional:
--     'set_appointment' < 'set_called' means Trigger B fires before A on INSERT.
--     If booking_intent_detected = TRUE on INSERT, B sets status → 'appointment';
--     A then sees 'appointment' (not 'new') and preserves it — correct.
-- ═══════════════════════════════════════════════════════════════════════════════


-- ── 0. Ensure last_call_* columns exist on public.leads ─────────────────────
-- These columns appear in src/integrations/supabase/types.ts (leads.Row) but
-- have no prior migration. ADD COLUMN IF NOT EXISTS is fully idempotent.
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS last_call_status            text,
  ADD COLUMN IF NOT EXISTS last_call_booking_intent    boolean,
  ADD COLUMN IF NOT EXISTS last_call_outcome           text,
  ADD COLUMN IF NOT EXISTS last_call_intent            text,
  ADD COLUMN IF NOT EXISTS last_call_queued_at         timestamptz,
  ADD COLUMN IF NOT EXISTS last_call_completed_at      timestamptz,
  ADD COLUMN IF NOT EXISTS last_call_answered_at       timestamptz,
  ADD COLUMN IF NOT EXISTS last_call_duration_seconds  integer,
  ADD COLUMN IF NOT EXISTS last_call_summary           text,
  ADD COLUMN IF NOT EXISTS last_call_recording_url     text,
  ADD COLUMN IF NOT EXISTS last_call_failure_reason    text,
  -- Column exists in types.ts but has no safe mapping from voice_followups;
  -- declared here so fresh-schema deploys stay consistent with the type file.
  ADD COLUMN IF NOT EXISTS last_call_transcript_id     text;


-- ── 1. Trigger A function: set status = 'called' on INSERT ──────────────────
-- Fires after every new row in voice_followups.
-- Always writes the last_call_* snapshot so metadata is fresh.
-- Advances status to 'called' only when the lead is still in state 'new'.
--
-- Security note: SECURITY DEFINER + SET search_path TO 'public' is required
-- by this project's migration spec. All table references inside this function
-- are fully-qualified (public.leads) to prevent search_path-based injection.
--
-- Referential integrity note: voice_followups.lead_id has a FK constraint to
-- leads.id (voice_followups_lead_id_fkey, confirmed in types.ts), so a
-- matching lead row is always present when this trigger fires. No explicit
-- existence check is required.
CREATE OR REPLACE FUNCTION public.trg_fn_voice_followup_set_called()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.leads
  SET
    updated_at                  = NOW(),
    last_call_status            = NEW.status,
    last_call_booking_intent    = NEW.booking_intent_detected,
    last_call_outcome           = NEW.call_outcome,
    last_call_intent            = NEW.call_intent,
    last_call_queued_at         = NEW.queued_at,
    last_call_completed_at      = NEW.completed_at,
    last_call_answered_at       = NEW.answered_at,
    last_call_duration_seconds  = NEW.duration_seconds,
    last_call_summary           = NEW.summary,
    last_call_recording_url     = NEW.recording_url,
    last_call_failure_reason    = NEW.failure_reason,
    status = CASE
               WHEN status = 'new' THEN 'called'
               ELSE status            -- preserve called/appointment/closed/dead
             END
  WHERE id = NEW.lead_id;

  RETURN NEW;
END;
$$;


-- ── 2. Drop + recreate Trigger A ────────────────────────────────────────────
DROP TRIGGER IF EXISTS trg_voice_followup_set_called ON public.voice_followups;

CREATE TRIGGER trg_voice_followup_set_called
  AFTER INSERT ON public.voice_followups
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_fn_voice_followup_set_called();


-- ── 3. Trigger B function: set status = 'appointment' on booking_intent ──────
-- Fires after every INSERT or UPDATE on voice_followups.
-- Only acts when booking_intent_detected is TRUE.
-- On UPDATE, only acts when it *changed* to TRUE (false/null → true).
-- Advances status to 'appointment' only from 'new' or 'called';
-- never reopens 'closed' or 'dead', never re-applies to 'appointment'.
--
-- Security note: same rationale as trg_fn_voice_followup_set_called above.
-- All table references are fully-qualified; FK guarantees lead existence.
CREATE OR REPLACE FUNCTION public.trg_fn_voice_followup_set_appointment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Guard: only proceed when booking_intent is now TRUE.
  IF NEW.booking_intent_detected IS NOT TRUE THEN
    RETURN NEW;
  END IF;

  -- Guard: on UPDATE, skip if booking_intent was already TRUE (no change).
  IF TG_OP = 'UPDATE' AND OLD.booking_intent_detected IS TRUE THEN
    RETURN NEW;
  END IF;

  UPDATE public.leads
  SET
    updated_at                  = NOW(),
    last_call_status            = NEW.status,
    last_call_booking_intent    = NEW.booking_intent_detected,
    last_call_outcome           = NEW.call_outcome,
    last_call_intent            = NEW.call_intent,
    last_call_queued_at         = NEW.queued_at,
    last_call_completed_at      = NEW.completed_at,
    last_call_answered_at       = NEW.answered_at,
    last_call_duration_seconds  = NEW.duration_seconds,
    last_call_summary           = NEW.summary,
    last_call_recording_url     = NEW.recording_url,
    last_call_failure_reason    = NEW.failure_reason,
    status = CASE
               WHEN status IN ('new', 'called') THEN 'appointment'
               ELSE status   -- preserve appointment/closed/dead
             END
  WHERE id = NEW.lead_id;

  RETURN NEW;
END;
$$;


-- ── 4. Drop + recreate Trigger B ────────────────────────────────────────────
DROP TRIGGER IF EXISTS trg_voice_followup_set_appointment ON public.voice_followups;

CREATE TRIGGER trg_voice_followup_set_appointment
  AFTER INSERT OR UPDATE ON public.voice_followups
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_fn_voice_followup_set_appointment();


-- ═══════════════════════════════════════════════════════════════════════════════
-- MANUAL SQL TEST CASES
-- Run against a dev/staging database only. Replace UUIDs as appropriate.
-- ═══════════════════════════════════════════════════════════════════════════════

/*

-- ── Setup ────────────────────────────────────────────────────────────────────
-- Insert two test leads. session_id is required NOT NULL.
INSERT INTO public.leads (id, session_id, status)
VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001', 'sess-test-1', 'new'),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'sess-test-2', 'appointment');


-- ── TEST 1: INSERT followup for lead in 'new' ────────────────────────────────
-- Expected: leads.status → 'called'; last_call_* populated; updated_at refreshed.
INSERT INTO public.voice_followups (
  lead_id, phone_e164, call_intent, queued_at,
  status, booking_intent_detected
) VALUES (
  'aaaaaaaa-0000-0000-0000-000000000001', '+15555550001', 'report_help', NOW(),
  'completed', false
);

-- Verify:
SELECT id, status, last_call_status, last_call_booking_intent, last_call_intent, updated_at
FROM public.leads WHERE id = 'aaaaaaaa-0000-0000-0000-000000000001';
-- Expected: status='called', last_call_status='completed', last_call_booking_intent=false,
--           last_call_intent='report_help', updated_at ≈ NOW()


-- ── TEST 2: INSERT followup for lead already in 'appointment' ────────────────
-- Expected: leads.status stays 'appointment'; last_call_* still updated.
INSERT INTO public.voice_followups (
  lead_id, phone_e164, call_intent, queued_at,
  status, booking_intent_detected
) VALUES (
  'aaaaaaaa-0000-0000-0000-000000000002', '+15555550002', 'contractor_match', NOW(),
  'completed', false
);

-- Verify:
SELECT id, status, last_call_status, last_call_intent
FROM public.leads WHERE id = 'aaaaaaaa-0000-0000-0000-000000000002';
-- Expected: status='appointment' (unchanged), last_call_status='completed'


-- ── TEST 3: Duplicate inserts (idempotency of last_call_* snapshot) ──────────
-- Expected: second insert overwrites last_call_* with newer values; status
-- stays 'called' (not re-applied from 'called' — CASE has no 'called'→'called').
INSERT INTO public.voice_followups (
  lead_id, phone_e164, call_intent, queued_at,
  status, booking_intent_detected, summary
) VALUES (
  'aaaaaaaa-0000-0000-0000-000000000001', '+15555550001', 'report_help', NOW(),
  'no_answer', false, 'Second attempt'
);

-- Verify:
SELECT id, status, last_call_status, last_call_summary
FROM public.leads WHERE id = 'aaaaaaaa-0000-0000-0000-000000000001';
-- Expected: status='called' (no change), last_call_status='no_answer',
--           last_call_summary='Second attempt'


-- ── TEST 4: INSERT with booking_intent_detected = false → (no appt) ──────────
-- Lead is in 'called'. Insert a followup without booking intent.
-- Expected: status stays 'called'; last_call_booking_intent = false.
-- (Trigger A fires — sets called from... already called, no change.
--  Trigger B fires — booking_intent NOT TRUE, returns early.)
INSERT INTO public.voice_followups (
  lead_id, phone_e164, call_intent, queued_at,
  status, booking_intent_detected
) VALUES (
  'aaaaaaaa-0000-0000-0000-000000000001', '+15555550001', 'report_help', NOW(),
  'completed', false
);

-- Verify:
SELECT id, status, last_call_booking_intent
FROM public.leads WHERE id = 'aaaaaaaa-0000-0000-0000-000000000001';
-- Expected: status='called', last_call_booking_intent=false


-- ── TEST 5: UPDATE booking_intent_detected false → true ──────────────────────
-- Lead is in 'called'. Update an existing followup row to flip booking_intent.
-- Expected: leads.status → 'appointment'; last_call_booking_intent = true.
DO $$
DECLARE v_vf_id uuid;
BEGIN
  SELECT id INTO v_vf_id
  FROM public.voice_followups
  WHERE lead_id = 'aaaaaaaa-0000-0000-0000-000000000001'
  ORDER BY created_at DESC LIMIT 1;

  UPDATE public.voice_followups
  SET booking_intent_detected = true, call_outcome = 'booked'
  WHERE id = v_vf_id;
END;
$$;

-- Verify:
SELECT id, status, last_call_booking_intent, last_call_outcome
FROM public.leads WHERE id = 'aaaaaaaa-0000-0000-0000-000000000001';
-- Expected: status='appointment', last_call_booking_intent=true, last_call_outcome='booked'


-- ── TEST 6: UPDATE booking_intent_detected true → true (no-op) ───────────────
-- Lead is now 'appointment'. Update the same row again (booking_intent already true).
-- Expected: status stays 'appointment'; trigger B skips (OLD.booking_intent IS TRUE).
DO $$
DECLARE v_vf_id uuid;
BEGIN
  SELECT id INTO v_vf_id
  FROM public.voice_followups
  WHERE lead_id = 'aaaaaaaa-0000-0000-0000-000000000001'
  ORDER BY created_at DESC LIMIT 1;

  UPDATE public.voice_followups
  SET summary = 'Updated summary, no intent change'
  WHERE id = v_vf_id;
END;
$$;

-- Verify:
SELECT id, status, last_call_booking_intent
FROM public.leads WHERE id = 'aaaaaaaa-0000-0000-0000-000000000001';
-- Expected: status='appointment' (unchanged), trigger B did not re-fire


-- ── TEST 7: INSERT followup for lead in 'closed' ─────────────────────────────
-- Expected: status stays 'closed'; last_call_* still refreshed.
UPDATE public.leads SET status = 'closed' WHERE id = 'aaaaaaaa-0000-0000-0000-000000000002';

INSERT INTO public.voice_followups (
  lead_id, phone_e164, call_intent, queued_at,
  status, booking_intent_detected
) VALUES (
  'aaaaaaaa-0000-0000-0000-000000000002', '+15555550002', 'contractor_match', NOW(),
  'completed', false
);

-- Verify:
SELECT id, status, last_call_status
FROM public.leads WHERE id = 'aaaaaaaa-0000-0000-0000-000000000002';
-- Expected: status='closed' (unchanged), last_call_status='completed'


-- ── TEST 8: INSERT with booking_intent=true for lead in 'dead' ───────────────
-- Expected: status stays 'dead'; last_call_* refreshed; Trigger B skips update.
UPDATE public.leads SET status = 'dead' WHERE id = 'aaaaaaaa-0000-0000-0000-000000000002';

INSERT INTO public.voice_followups (
  lead_id, phone_e164, call_intent, queued_at,
  status, booking_intent_detected
) VALUES (
  'aaaaaaaa-0000-0000-0000-000000000002', '+15555550002', 'contractor_match', NOW(),
  'completed', true
);

-- Verify:
SELECT id, status, last_call_booking_intent
FROM public.leads WHERE id = 'aaaaaaaa-0000-0000-0000-000000000002';
-- Expected: status='dead' (unchanged), last_call_booking_intent=true


-- ── Cleanup ──────────────────────────────────────────────────────────────────
DELETE FROM public.voice_followups WHERE lead_id IN (
  'aaaaaaaa-0000-0000-0000-000000000001',
  'aaaaaaaa-0000-0000-0000-000000000002'
);
DELETE FROM public.leads WHERE id IN (
  'aaaaaaaa-0000-0000-0000-000000000001',
  'aaaaaaaa-0000-0000-0000-000000000002'
);

*/
