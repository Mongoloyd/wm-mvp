DROP FUNCTION IF EXISTS public.get_rubric_stats();

CREATE OR REPLACE FUNCTION public.get_rubric_stats(p_days integer DEFAULT NULL)
RETURNS TABLE(
  rubric_version text,
  total_count bigint,
  grade_a bigint,
  grade_b bigint,
  grade_c bigint,
  grade_d bigint,
  grade_f bigint,
  avg_confidence numeric,
  min_confidence numeric,
  max_confidence numeric,
  avg_grade_score numeric,
  invalid_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
$$;