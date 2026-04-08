-- ═══════════════════════════════════════════════════════════════════════════════
-- MIGRATION: Fix OTP verification persistence issues (Prompt 1 backend fixes)
-- Date: 2026-04-07
-- ═══════════════════════════════════════════════════════════════════════════════

-- ── 1. Expand phone_verifications.status CHECK to include 'expired' ──────────
-- send-otp already sets status='expired' on old pending rows, but the original
-- CHECK constraint (pending, verified, failed) silently rejects the update.
-- This caused stale pending rows to accumulate.
ALTER TABLE public.phone_verifications
  DROP CONSTRAINT IF EXISTS phone_verifications_status_check;

ALTER TABLE public.phone_verifications
  ADD CONSTRAINT phone_verifications_status_check
  CHECK (status IN ('pending', 'verified', 'failed', 'expired'));

-- ── 2. Add phone_verified_at to leads ────────────────────────────────────────
-- verify-otp needs to set this timestamp alongside phone_verified=true.
-- fire_crm_handoff trigger already references NEW.phone_verified_at.
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS phone_verified_at timestamptz;

-- ── 3. Align lead_events constraints with trigger values ────────────────────
-- fire_crm_handoff emits event_name='crm_handoff_queued' and
-- event_source='db_trigger'. Add these to lead_events constraints if the
-- table exists. If lead_events does not exist, the ALTER will fail silently.
DO $$
BEGIN
  -- Add 'crm_handoff_queued' to event_name CHECK constraint
  ALTER TABLE public.lead_events
    DROP CONSTRAINT IF EXISTS lead_events_event_name_check;

  ALTER TABLE public.lead_events
    ADD CONSTRAINT lead_events_event_name_check
    CHECK (event_name IN (
      'lead_created',
      'quote_uploaded',
      'analysis_complete',
      'phone_verified',
      'report_revealed',
      'crm_handoff_queued'
    ));

  -- Add 'db_trigger' to event_source CHECK constraint
  ALTER TABLE public.lead_events
    DROP CONSTRAINT IF EXISTS lead_events_event_source_check;

  ALTER TABLE public.lead_events
    ADD CONSTRAINT lead_events_event_source_check
    CHECK (event_source IN (
      'frontend',
      'edge_function',
      'admin_dashboard',
      'db_trigger'
    ));
EXCEPTION
  WHEN undefined_table THEN
    RAISE LOG '[MIGRATION:WARN] lead_events table not found — skipping constraint alignment';
  WHEN OTHERS THEN
    RAISE LOG '[MIGRATION:WARN] Could not update lead_events constraints: %', SQLERRM;
END;
$$;

-- ── 4. Harden fire_crm_handoff trigger ───────────────────────────────────────
-- Wrap lead_events INSERT in broad exception handler so the trigger doesn't
-- crash the leads UPDATE if:
--   - lead_events table is missing
--   - CHECK constraints reject the values (despite alignment above)
--   - any other unexpected database error occurs
CREATE OR REPLACE FUNCTION public.fire_crm_handoff()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.phone_verified = true
     AND NEW.latest_analysis_id IS NOT NULL
     AND (OLD.phone_verified = false OR OLD.latest_analysis_id IS NULL)
  THEN
    -- Queue webhook delivery
    INSERT INTO public.webhook_deliveries (lead_id, event_type, status)
    VALUES (NEW.id, 'qualified_lead', 'pending');

    -- Audit trail in lead_events (hardened: safe if table is absent or constraints reject)
    BEGIN
      INSERT INTO public.lead_events (lead_id, event_name, event_source, metadata)
      VALUES (
        NEW.id,
        'crm_handoff_queued',
        'db_trigger',
        jsonb_build_object(
          'analysis_id', NEW.latest_analysis_id,
          'phone_verified_at', NEW.phone_verified_at,
          'triggered_at', now()
        )
      );
    EXCEPTION WHEN OTHERS THEN
      RAISE LOG '[CRM:HANDOFF:WARN] Failed to insert lead_event for lead_id=% — %: %',
        NEW.id, SQLSTATE, SQLERRM;
    END;

    RAISE LOG '[CRM:HANDOFF:QUEUED] {"lead_id": "%", "analysis_id": "%", "timestamp": "%"}',
      NEW.id, NEW.latest_analysis_id, NOW();
  END IF;
  RETURN NEW;
END;
$$;
