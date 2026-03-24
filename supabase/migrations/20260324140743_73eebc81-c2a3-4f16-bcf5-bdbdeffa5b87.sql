-- 1. Restrict get_rubric_stats to authenticated operators only
CREATE OR REPLACE FUNCTION public.get_rubric_stats(p_days integer DEFAULT NULL::integer)
RETURNS TABLE(rubric_version text, total_count bigint, grade_a bigint, grade_b bigint, grade_c bigint, grade_d bigint, grade_f bigint, avg_confidence numeric, min_confidence numeric, max_confidence numeric, avg_grade_score numeric, invalid_count bigint)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.is_internal_operator() THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    a.rubric_version,
    COUNT(*)                                          AS total_count,
    COUNT(*) FILTER (WHERE a.grade = 'A')             AS grade_a,
    COUNT(*) FILTER (WHERE a.grade = 'B')             AS grade_b,
    COUNT(*) FILTER (WHERE a.grade = 'C')             AS grade_c,
    COUNT(*) FILTER (WHERE a.grade = 'D')             AS grade_d,
    COUNT(*) FILTER (WHERE a.grade = 'F')             AS grade_f,
    ROUND(AVG(a.confidence_score), 1)                 AS avg_confidence,
    ROUND(MIN(a.confidence_score), 1)                 AS min_confidence,
    ROUND(MAX(a.confidence_score), 1)                 AS max_confidence,
    ROUND(
      (
        COUNT(*) FILTER (WHERE a.grade = 'A') * 4 +
        COUNT(*) FILTER (WHERE a.grade = 'B') * 3 +
        COUNT(*) FILTER (WHERE a.grade = 'C') * 2 +
        COUNT(*) FILTER (WHERE a.grade = 'D') * 1
      )::numeric / NULLIF(
        COUNT(*) FILTER (WHERE a.grade IN ('A','B','C','D','F')), 0
      ), 2
    )                                                 AS avg_grade_score,
    COUNT(*) FILTER (WHERE a.analysis_status = 'invalid_document') AS invalid_count
  FROM public.analyses a
  WHERE a.analysis_status IN ('complete', 'invalid_document')
    AND (p_days IS NULL OR a.created_at >= now() - (p_days || ' days')::interval)
  GROUP BY a.rubric_version
  ORDER BY a.rubric_version;
END;
$$;

-- 2. Fix get_analysis_full — overwrite insecure version with secure three-table JOIN
CREATE OR REPLACE FUNCTION public.get_analysis_full(
  p_scan_session_id uuid,
  p_phone_e164 text
)
RETURNS TABLE(
  grade text,
  flags jsonb,
  full_json jsonb,
  proof_of_read jsonb,
  preview_json jsonb,
  confidence_score numeric,
  document_type text,
  rubric_version text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_authorized boolean := false;
BEGIN
  SELECT EXISTS(
    SELECT 1
    FROM public.phone_verifications pv
    JOIN public.leads l       ON l.id = pv.lead_id
    JOIN public.scan_sessions ss ON ss.lead_id = l.id
    WHERE pv.phone_e164 = p_phone_e164
      AND pv.status     = 'verified'
      AND ss.id          = p_scan_session_id
  ) INTO v_authorized;

  IF NOT v_authorized THEN
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
$$;