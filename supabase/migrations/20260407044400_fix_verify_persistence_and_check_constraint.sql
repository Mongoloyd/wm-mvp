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

-- ── 3. Harden fire_crm_handoff trigger ───────────────────────────────────────
-- Wrap lead_events INSERT in exception handler so the trigger doesn't crash
-- the leads UPDATE if lead_events table is missing in the target environment.
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

    -- Audit trail in lead_events (hardened: safe if table is absent)
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
    EXCEPTION WHEN undefined_table THEN
      RAISE LOG '[CRM:HANDOFF:WARN] lead_events table not found — skipping audit for lead_id=%', NEW.id;
    END;

    RAISE LOG '[CRM:HANDOFF:QUEUED] {"lead_id": "%", "analysis_id": "%", "timestamp": "%"}',
      NEW.id, NEW.latest_analysis_id, NOW();
  END IF;
  RETURN NEW;
END;
$$;
