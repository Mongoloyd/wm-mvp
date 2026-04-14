-- Sprint 2 canonical business-event names + wm_event_log index bug fix

DO $$
BEGIN
  ALTER TYPE public.wm_event_name ADD VALUE IF NOT EXISTS 'lead_identified';
  ALTER TYPE public.wm_event_name ADD VALUE IF NOT EXISTS 'lead_qualified';
  ALTER TYPE public.wm_event_name ADD VALUE IF NOT EXISTS 'quote_upload_completed';
  ALTER TYPE public.wm_event_name ADD VALUE IF NOT EXISTS 'quote_validation_passed';
  ALTER TYPE public.wm_event_name ADD VALUE IF NOT EXISTS 'sale_confirmed';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

DROP INDEX IF EXISTS idx_wm_event_log_dispatch_status;
CREATE INDEX IF NOT EXISTS idx_wm_event_log_dispatch_status
  ON public.wm_event_log (dispatch_status, event_timestamp DESC);
