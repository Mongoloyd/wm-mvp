-- Arc 1 hardening: bind OTP challenge rows to a specific scan session
-- so verification from session A cannot unlock session B.

ALTER TABLE public.phone_verifications
  ADD COLUMN IF NOT EXISTS scan_session_id uuid;

CREATE INDEX IF NOT EXISTS idx_phone_verifications_scan_session_id
  ON public.phone_verifications(scan_session_id);

CREATE OR REPLACE FUNCTION public.get_analysis_full(p_scan_session_id uuid, p_phone_e164 text)
 RETURNS TABLE(grade text, flags jsonb, full_json jsonb, proof_of_read jsonb, preview_json jsonb, confidence_score numeric, document_type text, rubric_version text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_authorized boolean := false;
BEGIN
  -- Belt-and-suspenders: check phone_verifications + lead + exact scan session.
  SELECT EXISTS(
    SELECT 1
    FROM public.phone_verifications pv
    JOIN public.leads l       ON l.id = pv.lead_id
    JOIN public.scan_sessions ss ON ss.lead_id = l.id
    WHERE pv.phone_e164 = p_phone_e164
      AND pv.status = 'verified'
      AND pv.scan_session_id = p_scan_session_id
      AND ss.id = p_scan_session_id
      AND l.phone_verified = true
  ) INTO v_authorized;

  IF NOT v_authorized THEN
    RETURN QUERY SELECT
      '__UNAUTHORIZED__'::text AS grade,
      NULL::jsonb AS flags,
      NULL::jsonb AS full_json,
      NULL::jsonb AS proof_of_read,
      NULL::jsonb AS preview_json,
      NULL::numeric AS confidence_score,
      NULL::text AS document_type,
      NULL::text AS rubric_version;
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    a.grade,
    a.flags,
    a.full_json,
    a.proof_of_read,
    a.preview_json,
    a.confidence_score,
    a.document_type,
    a.rubric_version
  FROM public.analyses a
  WHERE a.scan_session_id = p_scan_session_id
    AND a.analysis_status = 'complete'
  LIMIT 1;
END;
$function$;
