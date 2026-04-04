
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

    -- Audit trail in lead_events
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

    RAISE LOG '[CRM:HANDOFF:QUEUED] {"lead_id": "%", "analysis_id": "%", "timestamp": "%"}',
      NEW.id, NEW.latest_analysis_id, NOW();
  END IF;
  RETURN NEW;
END;
$$;
