-- Sprint 3 dispatch worker operational primitives

DO $$
BEGIN
  ALTER TYPE public.wm_dispatch_status ADD VALUE IF NOT EXISTS 'sent';
  ALTER TYPE public.wm_dispatch_status ADD VALUE IF NOT EXISTS 'suppressed';
  ALTER TYPE public.wm_dispatch_status ADD VALUE IF NOT EXISTS 'dead_letter';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

CREATE OR REPLACE FUNCTION public.wm_claim_dispatch_rows(
  p_limit integer DEFAULT 25,
  p_lock_stale_minutes integer DEFAULT 10
)
RETURNS TABLE (
  dispatch_id uuid,
  event_log_id uuid,
  platform_name public.wm_platform_name,
  dispatch_status public.wm_dispatch_status,
  attempt_count integer,
  event_id text,
  event_name public.wm_event_name,
  event_timestamp timestamptz,
  event_payload jsonb,
  event_raw_payload jsonb,
  event_schema_version text,
  event_model_version text,
  event_rubric_version text,
  event_identity_quality text,
  should_send_meta boolean,
  should_send_google boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH eligible AS (
    SELECT d.id
    FROM public.wm_platform_dispatch_log d
    JOIN public.wm_event_log e ON e.id = d.event_log_id
    WHERE d.dispatch_status IN ('pending', 'failed', 'processing')
      AND (
        d.dispatch_status = 'processing'
          AND d.last_attempt_at IS NOT NULL
          AND d.last_attempt_at <= (now() - make_interval(mins => p_lock_stale_minutes))
        OR d.dispatch_status IN ('pending', 'failed')
          AND (d.next_attempt_at IS NULL OR d.next_attempt_at <= now())
      )
      AND COALESCE(d.attempt_count, 0) < 5
    ORDER BY COALESCE(d.next_attempt_at, d.created_at) ASC
    FOR UPDATE OF d SKIP LOCKED
    LIMIT GREATEST(COALESCE(p_limit, 25), 1)
  ), claimed AS (
    UPDATE public.wm_platform_dispatch_log d
    SET
      dispatch_status = 'processing',
      last_attempt_at = now(),
      next_attempt_at = NULL,
      attempt_count = COALESCE(d.attempt_count, 0) + 1,
      updated_at = now()
    FROM eligible
    WHERE d.id = eligible.id
    RETURNING d.id, d.event_log_id, d.platform_name, d.dispatch_status, d.attempt_count
  )
  SELECT
    c.id AS dispatch_id,
    c.event_log_id,
    c.platform_name,
    c.dispatch_status,
    c.attempt_count,
    e.event_id,
    e.event_name,
    e.event_timestamp,
    e.payload AS event_payload,
    e.raw_payload AS event_raw_payload,
    e.schema_version AS event_schema_version,
    e.model_version AS event_model_version,
    e.rubric_version AS event_rubric_version,
    COALESCE(e.payload->'identity'->>'identityQuality', e.payload->>'identityQuality', 'unknown') AS event_identity_quality,
    COALESCE((e.payload->>'shouldSendMeta')::boolean, e.approved_for_ads, false) AS should_send_meta,
    COALESCE((e.payload->>'shouldSendGoogle')::boolean, e.approved_for_index, false) AS should_send_google
  FROM claimed c
  JOIN public.wm_event_log e ON e.id = c.event_log_id;
END;
$$;

REVOKE ALL ON FUNCTION public.wm_claim_dispatch_rows(integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.wm_claim_dispatch_rows(integer, integer) TO service_role;
