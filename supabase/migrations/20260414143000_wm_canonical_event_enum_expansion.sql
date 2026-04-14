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

DO $$
BEGIN
  DROP INDEX IF EXISTS idx_wm_event_log_dispatch_status;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'wm_event_log'
      AND column_name = 'dispatch_status'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_wm_event_log_dispatch_status
      ON public.wm_event_log (dispatch_status, event_timestamp DESC)';
  ELSIF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'wm_event_log'
      AND column_name = 'platform_dispatch_status'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_wm_event_log_dispatch_status
      ON public.wm_event_log (platform_dispatch_status, event_timestamp DESC)';
  ELSE
    RAISE EXCEPTION 'Cannot create idx_wm_event_log_dispatch_status: neither dispatch_status nor platform_dispatch_status exists on public.wm_event_log';
  END IF;
END
$$;
